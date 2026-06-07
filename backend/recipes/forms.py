from django import forms
from .models import RecipeStep, RecipeIngredient


class RecipeStepForm(forms.ModelForm):
    class Meta:
        model = RecipeStep
        fields = '__all__'

    def clean_instruction(self):
        instruction = self.cleaned_data.get('instruction', '')
        empty_patterns = ['<p></p>', '<p>&nbsp;</p>', '<p> </p>', '']
        cleaned = instruction.strip()
        if cleaned in empty_patterns:
            return ''
        return cleaned
