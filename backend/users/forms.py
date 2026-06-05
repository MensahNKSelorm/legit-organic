from django.contrib.auth.forms import UserCreationForm as BaseCreationForm
from django.contrib.auth.forms import UserChangeForm as BaseChangeForm
from .models import User


class UserCreationForm(BaseCreationForm):
    class Meta(BaseCreationForm.Meta):
        model = User
        fields = ('email', 'first_name', 'last_name')


class UserChangeForm(BaseChangeForm):
    class Meta(BaseChangeForm.Meta):
        model = User
