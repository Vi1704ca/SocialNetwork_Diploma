from django import forms
from django.contrib.auth import get_user_model, authenticate 


user = get_user_model() 

class UserDetailsForm(forms.ModelForm):
    nickname = forms.CharField(
        label="Псевдонім автора",
        max_length=50,
        required=True,
        widget=forms.TextInput(attrs={
            'placeholder': 'Введіть Псевдонім автора',
            'class': 'modal-input'
        })
    )
    username = forms.CharField(
        label="Ім’я користувача",
        max_length=50,
        required=True,
        widget=forms.TextInput(attrs={
            'placeholder': '@',
            'class': 'modal-input username-field'
        })
    )

    class Meta:
        model = user
        fields = ('nickname', 'username')

    def clean_nickname(self):
        nickname = self.cleaned_data.get('nickname')
        if user.objects.filter(nickname=nickname).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError("Цей псевдонім уже зайнятий.")
        return nickname

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if username.startswith('@'):
            username = username[1:]
        
        if not username:
            raise forms.ValidationError("Ім'я користувача не може бути порожнім.")

        if user.objects.filter(username=username).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError("Це ім'я користувача вже зайняте. Оберіть інше.")
            
        return username