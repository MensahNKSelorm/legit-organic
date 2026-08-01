from decimal import Decimal, InvalidOperation
import logging
import os
import re

import requests

from django.db.models import Q
from rest_framework import generics, status, views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Recipe, RecipeCombinationNote, UserRecipe, UserRecipeIngredient
from .serializers import (
    RecipeListSerializer,
    RecipeDetailWithPairingsSerializer,
    UserRecipeSerializer,
    CreateUserRecipeSerializer,
)

logger = logging.getLogger(__name__)

DEMO_RECIPE_TITLES = {
    'Fufu', 'Light soup', 'Groundnut soup', 'Palm nut soup',
    'Ebunebunu soup', 'Kontomire stew', 'Plain rice', 'Garden egg stew',
}


def _normalise_title(value):
    return re.sub(r'[^a-z0-9]+', ' ', value.lower()).strip()


def _fallback_note(titles):
    names = ', '.join(titles[:-1]) + f" and {titles[-1]}"
    return f"{names} make a complete plate, with each dish bringing its own flavour and texture to the table."


def _groq_note(titles):
    api_key = os.getenv('GROQ_API_KEY', '').strip()
    if not api_key:
        return None, ''
    model = os.getenv('GROQ_MODEL', 'openai/gpt-oss-20b').strip()
    prompt = (
        "Write one warm, useful sentence (maximum 32 words) about why these Ghanaian dishes "
        f"work together: {', '.join(titles)}. Mention flavour or texture. No headings, hype, "
        "health claims, quotation marks, or instructions."
    )
    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': 'You are a concise Ghanaian food editor for Legit Organic.'},
            {'role': 'user', 'content': prompt},
        ],
        'temperature': 0.6,
        'reasoning_effort': 'low',
        'max_completion_tokens': 256,
    }
    try:
        response = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            json=payload,
            timeout=5,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
        )
        response.raise_for_status()
        data = response.json()
        note = data['choices'][0]['message']['content'].strip().strip('"')
        return (note[:500], model) if note else (None, model)
    except (requests.RequestException, KeyError, ValueError) as exc:
        logger.warning('Groq recipe note unavailable: %s', exc.__class__.__name__)
        return None, model


class RecipeCombinationNoteView(views.APIView):
    permission_classes = []
    throttle_scope = 'recipe_note'

    def post(self, request):
        raw_titles = request.data.get('titles')
        if not isinstance(raw_titles, list) or not 2 <= len(raw_titles) <= 4:
            return Response({'detail': 'Choose between two and four dishes.'}, status=status.HTTP_400_BAD_REQUEST)

        requested = [str(title).strip()[:100] for title in raw_titles]
        if any(not title for title in requested):
            return Response({'detail': 'Every dish needs a title.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_titles = set(DEMO_RECIPE_TITLES)
        allowed_titles.update(Recipe.objects.filter(is_default=True).values_list('title', flat=True))
        allowed = {_normalise_title(title): title for title in allowed_titles}
        normalised = [_normalise_title(title) for title in requested]
        if len(set(normalised)) != len(normalised) or any(title not in allowed for title in normalised):
            return Response({'detail': 'One or more dishes are not in the recipe shelf.'}, status=status.HTTP_400_BAD_REQUEST)

        canonical = sorted(normalised)
        key = '|'.join(canonical)
        cached = RecipeCombinationNote.objects.filter(combination_key=key).first()
        if cached:
            return Response({'note': cached.note, 'source': 'cache'})

        display_titles = [allowed[title] for title in canonical]
        note, model = _groq_note(display_titles)
        if not note:
            return Response({'note': _fallback_note(display_titles), 'source': 'fallback'})

        cached, _ = RecipeCombinationNote.objects.get_or_create(
            combination_key=key,
            defaults={'titles': display_titles, 'note': note, 'model_name': model},
        )
        return Response({'note': cached.note, 'source': 'generated'})


class RecipeListView(generics.ListAPIView):
    queryset = Recipe.objects.all()
    serializer_class = RecipeListSerializer
    permission_classes = []


class RecipeDetailView(generics.RetrieveAPIView):
    queryset = Recipe.objects.prefetch_related('ingredients__product', 'steps', 'pairings__suggested_recipe')
    serializer_class = RecipeDetailWithPairingsSerializer
    permission_classes = []
    lookup_field = 'slug'


class DefaultRecipesView(generics.ListAPIView):
    serializer_class = RecipeListSerializer
    permission_classes = []

    def get_queryset(self):
        queryset = Recipe.objects.filter(is_default=True)
        raw_search = self.request.query_params.get('search', '').strip()[:200]
        if not raw_search:
            return queryset

        # A plus sign represents components that the frontend will assemble
        # into one combined meal page, e.g. "fufu + light soup". Return the
        # candidates; the frontend selects the closest title match and then
        # fetches each recipe's full details.
        terms = [term.strip() for term in re.split(r'\s*\+\s*', raw_search) if term.strip()]
        search_query = Q()
        for term in terms:
            search_query |= (
                Q(title__icontains=term)
                | Q(description__icontains=term)
                | Q(ingredients__name__icontains=term)
            )
        return queryset.filter(search_query).distinct().order_by('title')


class UserRecipeListView(generics.ListAPIView):
    serializer_class = UserRecipeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            UserRecipe.objects
            .filter(user=self.request.user)
            .prefetch_related('base_recipes', 'ingredients__product')
            .order_by('-created_at')
        )


class UserRecipeCreateView(generics.CreateAPIView):
    serializer_class = CreateUserRecipeSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_recipe = serializer.save()
        return Response(
            UserRecipeSerializer(user_recipe, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )


class UserRecipeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserRecipeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            UserRecipe.objects
            .filter(user=self.request.user)
            .prefetch_related('base_recipes', 'ingredients__product')
        )

    def update(self, request, *args, **kwargs):
        user_recipe = self.get_object()

        user_recipe.name = request.data.get('name', user_recipe.name)
        user_recipe.description = request.data.get('description', user_recipe.description)
        user_recipe.save()

        base_recipe_ids = request.data.get('base_recipe_ids')
        if base_recipe_ids is not None:
            user_recipe.base_recipes.set(Recipe.objects.filter(id__in=base_recipe_ids))

        ingredients_data = request.data.get('ingredients')
        if ingredients_data is not None:
            user_recipe.ingredients.all().delete()
            for i_data in ingredients_data:
                product_id = i_data.get('product_id')
                if not product_id:
                    product_obj = i_data.get('product')
                    if isinstance(product_obj, dict):
                        product_id = product_obj.get('id')
                try:
                    qty = Decimal(str(i_data.get('quantity', 0)))
                except InvalidOperation:
                    qty = Decimal('0')
                UserRecipeIngredient.objects.create(
                    user_recipe=user_recipe,
                    product_id=product_id or None,
                    name=i_data.get('name', ''),
                    quantity=qty,
                    unit=i_data.get('unit', ''),
                    notes=i_data.get('notes', ''),
                    order=i_data.get('order', 0),
                )

        user_recipe.refresh_from_db()
        return Response(
            UserRecipeSerializer(user_recipe, context=self.get_serializer_context()).data
        )
