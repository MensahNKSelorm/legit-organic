from django import forms
from django.core.exceptions import ValidationError
from django.utils.html import strip_tags

from .models import RecipeStep, RecipeIngredient


class RecipeStepForm(forms.ModelForm):
    class Meta:
        model = RecipeStep
        fields = '__all__'

        labels = {
            'source_instruction_text': 'Original source wording',
            'instruction': 'Published instruction',
        }
        help_texts = {
            'source_instruction_text': 'Reference only.',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['source_instruction_text'].widget.attrs['readonly'] = True

    def clean_instruction(self):
        instruction = self.cleaned_data.get('instruction', '')
        empty_patterns = ['<p></p>', '<p>&nbsp;</p>', '<p> </p>', '']
        cleaned = instruction.strip()
        if cleaned in empty_patterns:
            return ''
        return cleaned

    def clean(self):
        cleaned_data = super().clean()
        instruction = strip_tags(cleaned_data.get('instruction') or '').replace('&nbsp;', ' ')
        if not instruction.strip():
            self.add_error(
                'instruction',
                ValidationError('Add the published instruction for this step.'),
            )
        return cleaned_data
