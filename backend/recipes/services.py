import hashlib
import json
import logging
import re
from decimal import Decimal, InvalidOperation

import requests
from django.conf import settings
from django.db import transaction
from django.db.models import Case, IntegerField, Q, Value, When
from django.utils import timezone

from products.models import Product
from .models import (
    IngredientAlias,
    IngredientMeasurementConversion,
    IngredientNutritionProfile,
    NutritionSourceRecord,
    RecipeIngredientProductMatch,
    RecipeNutrition,
    RegionalNutritionCandidate,
    USDANutritionCandidate,
)
from .wafct import profile_values_from_record

UNIT_ALIASES = {
    't': 'tablespoon',
    'tbsp': 'tablespoon',
    'tbs': 'tablespoon',
    'tablespoons': 'tablespoon',
    'tsp': 'teaspoon',
    'teaspoons': 'teaspoon',
    'g': 'gram',
    'grams': 'gram',
    'kg': 'kilogram',
    'kgs': 'kilogram',
    'ml': 'millilitre',
    'millilitres': 'millilitre',
    'l': 'litre',
    'litres': 'litre',
    'cups': 'cup',
    'pieces': 'piece',
    'pcs': 'piece',
}
UNICODE_FRACTIONS = {
    '½': Decimal('0.5'),
    '¼': Decimal('0.25'),
    '¾': Decimal('0.75'),
    '⅓': Decimal('0.333'),
    '⅔': Decimal('0.667'),
}
USDA_NUTRIENTS = {
    '1008': 'calories',
    '1003': 'protein_g',
    '1005': 'carbohydrate_g',
    '1004': 'fat_g',
    '1258': 'saturated_fat_g',
    '1079': 'fibre_g',
    '2000': 'sugar_g',
    '1093': 'sodium_mg',
    '1253': 'cholesterol_mg',
}
logger = logging.getLogger(__name__)

SOURCE_PRIORITY = {
    'manual_verified': 1,
    'wafct_2019': 2,
    'usda': 3,
    'fao_infoods': 4,
    'ghana_csir': 5,
    'ghanaian_food_composition': 5,
    'academic_source': 5,
    'manufacturer': 5,
    'laboratory': 5,
    'other': 6,
}


class NutritionConfigurationError(RuntimeError):
    pass


class NutritionProviderError(RuntimeError):
    pass


def normalize_unit(value):
    cleaned = re.sub(r'[.]$', '', (value or '').strip().lower())
    return UNIT_ALIASES.get(cleaned, cleaned)


def parse_quantity(value):
    text = (value or '').strip().replace('–', '-').replace('—', '-')
    if not text:
        return None, None
    for glyph, amount in UNICODE_FRACTIONS.items():
        if glyph in text:
            whole = text.replace(glyph, '').strip()
            return (Decimal(whole) if whole else Decimal('0')) + amount, None
    match = re.fullmatch(r'(.+?)\s*(?:-|to)\s*(.+)', text, re.I)
    if match:
        return _single_quantity(match.group(1)), _single_quantity(match.group(2))
    return _single_quantity(text), None


def _single_quantity(text):
    parts = text.strip().split()
    try:
        if len(parts) == 2 and '/' in parts[1]:
            return Decimal(parts[0]) + _fraction(parts[1])
        return _fraction(text) if '/' in text else Decimal(text)
    except (InvalidOperation, ValueError, ZeroDivisionError):
        return None


def _fraction(text):
    numerator, denominator = text.split('/', 1)
    return Decimal(numerator) / Decimal(denominator)


def normalize_ingredient(ingredient):
    name = re.sub(r'\s+', ' ', ingredient.name.strip().lower())
    alias = IngredientAlias.objects.filter(alias__iexact=name).first()
    canonical = alias.canonical_name.strip().lower() if alias else name
    _, quantity_max = parse_quantity(ingredient.quantity)
    ingredient.normalized_ingredient_name = canonical
    ingredient.normalized_unit = normalize_unit(ingredient.unit)
    ingredient.quantity_max = quantity_max
    if not ingredient.raw_text:
        ingredient.raw_text = ' '.join(
            filter(None, [ingredient.quantity, ingredient.unit, ingredient.name])
        )
    profile = (
        ingredient.nutrition_profile
        if (ingredient.nutrition_profile_id and ingredient.nutrition_profile.verified)
        else preferred_verified_profile(canonical)
    )
    ingredient.nutrition_profile = profile
    if profile:
        if profile.source == 'wafct_2019':
            ingredient.nutrition_match_status = 'wafct_verified'
        elif profile.source == 'usda':
            ingredient.nutrition_match_status = 'usda_verified'
        else:
            ingredient.nutrition_match_status = 'local_verified'
    else:
        ingredient.nutrition_match_status = 'normalized'
    ingredient.save(
        update_fields=[
            'normalized_ingredient_name',
            'normalized_unit',
            'quantity_max',
            'nutrition_match_status',
            'nutrition_profile',
            'raw_text',
        ]
    )


def preferred_verified_profile(normalized_name):
    whens = [
        When(source=source, then=Value(priority)) for source, priority in SOURCE_PRIORITY.items()
    ]
    return (
        IngredientNutritionProfile.objects.filter(
            normalized_name__iexact=normalized_name,
            verified=True,
        )
        .order_by(
            Case(*whens, default=Value(99), output_field=IntegerField()),
            '-updated_at',
        )
        .first()
    )


def search_regional_candidates(ingredient, limit=12):
    alias = IngredientAlias.objects.filter(alias__iexact=ingredient.name.strip()).first()
    terms = [ingredient.normalized_ingredient_name, ingredient.name]
    if alias:
        terms.extend([alias.canonical_name, alias.lookup_name])
    terms = list(dict.fromkeys(term.strip() for term in terms if term and term.strip()))
    queryset = NutritionSourceRecord.objects.filter(status='unverified')
    matches = []
    for term in terms:
        tokens = [
            token
            for token in re.findall(r'[a-z0-9]+', term.casefold())
            if token not in {'and', 'or', 'the', 'fresh'}
        ]
        lookup = Q()
        for token in tokens:
            lookup &= Q(original_food_name__icontains=token) | Q(scientific_name__icontains=token)
        for record in queryset.filter(lookup)[:limit]:
            if record.pk not in {item.source_record_id for item in matches}:
                candidate, _ = RegionalNutritionCandidate.objects.get_or_create(
                    recipe_ingredient=ingredient,
                    source_record=record,
                )
                matches.append(candidate)
                if len(matches) >= limit:
                    return matches
    return matches


@transaction.atomic
def confirm_regional_candidate(candidate, user):
    record = candidate.source_record
    dataset = record.dataset
    if not settings.DEBUG and (
        dataset.commercial_permission_status != 'granted'
        or not dataset.commercial_permission_reference.strip()
    ):
        raise NutritionConfigurationError(
            f'Commercial-use permission is not recorded for {dataset.code}.'
        )
    canonical = (
        (
            record.canonical_name
            or candidate.recipe_ingredient.normalized_ingredient_name
            or candidate.recipe_ingredient.name
        )
        .strip()
        .lower()
    )
    values = profile_values_from_record(record)
    profile, _ = IngredientNutritionProfile.objects.update_or_create(
        source='wafct_2019',
        normalized_name=canonical,
        defaults={
            'ingredient_name': record.original_food_name,
            'source_reference': dataset.citation,
            'source_metadata': {
                'dataset_code': dataset.code,
                'dataset_version': dataset.version,
                'food_code': record.food_code,
                'original_food_name': record.original_food_name,
                'preparation_state': record.preparation_state,
                'source_identifiers': record.source_identifiers,
                'quality_indicators': record.quality_indicators,
                'workbook_sha256': dataset.workbook_sha256,
            },
            'verified': True,
            'verified_by': user,
            'verified_at': timezone.now(),
            **values,
        },
    )
    record.status = 'verified'
    record.verified_by = user
    record.verified_at = timezone.now()
    record.nutrition_profile = profile
    record.save(
        update_fields=[
            'status',
            'verified_by',
            'verified_at',
            'nutrition_profile',
            'updated_at',
        ]
    )
    candidate.status = 'accepted'
    candidate.save(update_fields=['status'])
    ingredient = candidate.recipe_ingredient
    ingredient.nutrition_profile = profile
    ingredient.nutrition_match_status = 'wafct_verified'
    ingredient.save(update_fields=['nutrition_profile', 'nutrition_match_status'])
    return profile


def normalize_recipe(recipe):
    for ingredient in recipe.ingredients.all():
        normalize_ingredient(ingredient)
    return recipe.current_ingredients_hash()


def review_warnings(recipe):
    warnings = []
    ingredients = list(recipe.ingredients.all())
    if not recipe.servings:
        warnings.append('Missing servings')
    if not ingredients:
        warnings.append('No ingredients')
    if not recipe.steps.exists():
        warnings.append('No instructions')
    if any(not item.quantity for item in ingredients):
        warnings.append('Ingredient quantity missing')
    if any(item.quantity and parse_quantity(item.quantity)[0] is None for item in ingredients):
        warnings.append('Unparseable ingredient quantity')
    known_units = {
        'gram',
        'kilogram',
        'millilitre',
        'litre',
        'cup',
        'tablespoon',
        'teaspoon',
        'piece',
        'small',
        'medium',
        'large',
        'bunch',
        'tin',
        'can',
    }
    if any(item.unit and normalize_unit(item.unit) not in known_units for item in ingredients):
        warnings.append('Ambiguous ingredient unit')
    if any(
        (parse_quantity(item.quantity)[0] or 0) > 1000
        and normalize_unit(item.unit) not in {'gram', 'millilitre'}
        for item in ingredients
    ):
        warnings.append('Unusually large ingredient quantity')
    names = [item.normalized_ingredient_name or item.name.lower() for item in ingredients]
    if len(names) != len(set(names)):
        warnings.append('Possible duplicate ingredients')
    unresolved = sum(not item.nutrition_profile_id for item in ingredients)
    if unresolved:
        warnings.append(f'{unresolved} ingredient(s) need a verified nutrition mapping')
    if recipe.extraction_confidence is not None and recipe.extraction_confidence < Decimal('0.600'):
        warnings.append('Low extraction confidence')
    recipe.review_warnings = warnings
    recipe.save(update_fields=['review_warnings', 'updated_at'])
    return warnings


def match_products(recipe):
    candidate_count = 0
    for ingredient in recipe.ingredients.all():
        normalized = ingredient.normalized_ingredient_name or ingredient.name.lower().strip()
        candidates = list(Product.objects.filter(is_available=True, name__icontains=normalized)[:5])
        for product in candidates:
            candidate_count += 1
            exact = product.name.lower().strip() == normalized
            RecipeIngredientProductMatch.objects.update_or_create(
                recipe_ingredient=ingredient,
                product=product,
                defaults={
                    'match_type': 'exact' if exact else 'alias',
                    'confidence': Decimal('1') if exact else Decimal('0.75'),
                },
            )
    logger.info(
        'Recipe product matching completed',
        extra={
            'recipe_id': recipe.pk,
            'candidate_count': candidate_count,
        },
    )


def search_usda_candidates(ingredient, page_size=8):
    api_key = getattr(settings, 'USDA_FDC_API_KEY', '').strip()
    if not api_key:
        raise NutritionConfigurationError('USDA FoodData Central API key is not configured.')
    alias = IngredientAlias.objects.filter(alias__iexact=ingredient.name.strip()).first()
    query = (alias.lookup_name if alias and alias.lookup_name else None) or (
        ingredient.normalized_ingredient_name or ingredient.name
    )
    try:
        response = requests.post(
            'https://api.nal.usda.gov/fdc/v1/foods/search',
            params={'api_key': api_key},
            json={
                'query': query,
                'pageSize': min(page_size, 20),
                'dataType': ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],
            },
            timeout=15,
        )
        response.raise_for_status()
        foods = response.json().get('foods', [])
    except (requests.RequestException, ValueError) as exc:
        raise NutritionProviderError('USDA candidate search failed. Try again later.') from exc
    candidates = []
    for food in foods:
        candidate, _ = USDANutritionCandidate.objects.update_or_create(
            recipe_ingredient=ingredient,
            fdc_id=food['fdcId'],
            defaults={
                'description': food.get('description', '')[:500],
                'data_type': food.get('dataType', ''),
                'score': food.get('score'),
                'payload': food,
            },
        )
        candidates.append(candidate)
    logger.info(
        'USDA candidate search completed',
        extra={
            'recipe_ingredient_id': ingredient.pk,
            'candidate_count': len(candidates),
        },
    )
    return candidates


def _usda_nutrients(food):
    values = {field: None for field in USDA_NUTRIENTS.values()}
    micronutrients = {}
    for entry in food.get('foodNutrients', []):
        nutrient = entry.get('nutrient', entry)
        number = str(nutrient.get('number') or nutrient.get('nutrientNumber') or '')
        amount = entry.get('amount', entry.get('value'))
        if amount is None:
            continue
        if number in USDA_NUTRIENTS:
            values[USDA_NUTRIENTS[number]] = Decimal(str(amount))
        micronutrients[number or str(nutrient.get('id', ''))] = {
            'name': nutrient.get('name', entry.get('nutrientName', '')),
            'amount': amount,
            'unit': nutrient.get('unitName', entry.get('unitName', '')),
        }
    return values, micronutrients


@transaction.atomic
def confirm_usda_candidate(candidate, user):
    api_key = getattr(settings, 'USDA_FDC_API_KEY', '').strip()
    if not api_key:
        raise NutritionConfigurationError('USDA FoodData Central API key is not configured.')
    try:
        response = requests.get(
            f'https://api.nal.usda.gov/fdc/v1/food/{candidate.fdc_id}',
            params={'api_key': api_key},
            timeout=15,
        )
        response.raise_for_status()
        food = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise NutritionProviderError('USDA food details could not be retrieved.') from exc
    nutrients, micronutrients = _usda_nutrients(food)
    ingredient = candidate.recipe_ingredient
    profile, _ = IngredientNutritionProfile.objects.update_or_create(
        fdc_id=candidate.fdc_id,
        defaults={
            'ingredient_name': food.get('description', candidate.description),
            'normalized_name': ingredient.normalized_ingredient_name,
            'source': 'usda',
            'source_reference': f'https://fdc.nal.usda.gov/fdc-app.html#/food-details/{candidate.fdc_id}/nutrients',
            'source_metadata': {
                'fdc_id': candidate.fdc_id,
                'data_type': food.get('dataType'),
                'publication_date': food.get('publicationDate'),
            },
            'micronutrients_json': micronutrients,
            'verified': True,
            'verified_by': user,
            'verified_at': timezone.now(),
            **{f'{key}_per_100g': value for key, value in nutrients.items()},
        },
    )
    candidate.status = 'accepted'
    candidate.save(update_fields=['status'])
    ingredient.usda_candidates.exclude(pk=candidate.pk).update(status='rejected')
    ingredient.nutrition_profile = profile
    ingredient.nutrition_match_status = 'usda_verified'
    ingredient.save(update_fields=['nutrition_profile', 'nutrition_match_status'])
    logger.info(
        'USDA nutrition mapping confirmed',
        extra={
            'recipe_ingredient_id': ingredient.pk,
            'fdc_id': candidate.fdc_id,
        },
    )
    return profile


def resolve_grams(ingredient):
    quantity, quantity_max = parse_quantity(ingredient.quantity)
    if quantity is None:
        return None, 'quantity could not be parsed'
    if quantity_max is not None:
        return None, 'quantity range needs a reviewed gram weight'
    unit = normalize_unit(ingredient.unit)
    if unit == 'gram':
        return quantity, ''
    if unit == 'kilogram':
        return quantity * Decimal('1000'), ''
    if not ingredient.nutrition_profile_id:
        return None, 'no verified nutrition profile'
    conversion = (
        IngredientMeasurementConversion.objects.filter(
            profile=ingredient.nutrition_profile,
            unit=unit,
            verified=True,
        )
        .order_by('-confidence')
        .first()
    )
    if not conversion:
        return None, f'no verified {unit or "unit"}-to-gram conversion'
    grams = quantity * conversion.grams / conversion.quantity
    ingredient.grams_estimate = grams
    ingredient.grams_source = conversion.source_reference
    ingredient.grams_confidence = conversion.confidence
    ingredient.save(update_fields=['grams_estimate', 'grams_source', 'grams_confidence'])
    return grams, ''


def _calculation_fingerprint(recipe, rows):
    payload = {
        'servings': recipe.servings,
        'ingredients': [
            [
                item.pk,
                item.normalized_ingredient_name,
                item.quantity,
                item.normalized_unit,
                str(grams),
                item.nutrition_profile_id,
                item.nutrition_profile.version,
            ]
            for item, grams in rows
        ],
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()


@transaction.atomic
def calculate_nutrition(recipe, force=False):
    normalize_recipe(recipe)
    rows, warnings = [], []
    for ingredient in recipe.ingredients.select_related('nutrition_profile'):
        grams, warning = resolve_grams(ingredient)
        if not ingredient.nutrition_profile_id:
            warning = warning or 'no verified nutrition profile'
        if warning:
            warnings.append(f'{ingredient.name}: {warning}')
        else:
            rows.append((ingredient, grams))
    fingerprint = _calculation_fingerprint(recipe, rows)
    existing = RecipeNutrition.objects.filter(recipe=recipe, ingredients_hash=fingerprint).first()
    if existing and not force:
        recipe.nutrition_status = 'ready' if existing.is_complete else 'partial'
        recipe.ingredients_hash = fingerprint
        recipe.save(update_fields=['nutrition_status', 'ingredients_hash', 'updated_at'])
        return existing
    fields = [
        'calories',
        'protein_g',
        'carbohydrate_g',
        'fat_g',
        'saturated_fat_g',
        'fibre_g',
        'sugar_g',
        'sodium_mg',
        'cholesterol_mg',
    ]
    totals = {field: Decimal('0') for field in fields}
    observed = {field: False for field in fields}
    for ingredient, grams in rows:
        for field in fields:
            value = getattr(ingredient.nutrition_profile, f'{field}_per_100g')
            if value is not None:
                totals[field] += value * grams / Decimal('100')
                observed[field] = True
    servings = Decimal(max(recipe.servings, 1))
    totals = {field: value if observed[field] else None for field, value in totals.items()}
    per_serving = {
        field: (value / servings if value is not None else None) for field, value in totals.items()
    }
    nutrition, _ = RecipeNutrition.objects.update_or_create(
        recipe=recipe,
        defaults={
            'source': 'legitorganic',
            'is_complete': not warnings,
            'calculation_warnings': warnings,
            'ingredients_hash': fingerprint,
            'total_recipe_values_json': {
                k: (str(v) if v is not None else None) for k, v in totals.items()
            },
            'per_serving_values_json': {
                k: (str(v) if v is not None else None) for k, v in per_serving.items()
            },
            **per_serving,
        },
    )
    recipe.nutrition_status = 'ready' if not warnings else 'partial'
    recipe.nutrition_calculated_at = timezone.now()
    if recipe.status == 'nutrition_pending':
        recipe.status = 'ready'
    recipe.ingredients_hash = fingerprint
    recipe.save(
        update_fields=[
            'nutrition_status',
            'nutrition_calculated_at',
            'status',
            'ingredients_hash',
            'updated_at',
        ]
    )
    logger.info(
        'Recipe nutrition calculated',
        extra={
            'recipe_id': recipe.pk,
            'complete': not warnings,
            'warning_count': len(warnings),
        },
    )
    return nutrition
