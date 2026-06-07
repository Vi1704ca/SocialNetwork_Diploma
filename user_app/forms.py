from django import forms
from django.contrib.auth import get_user_model, authenticate 
from .models import User
from django.contrib.auth.forms import AuthenticationForm


user = get_user_model() 


class UserCreationForm(forms.ModelForm):
    
    password1 = forms.CharField(label="Пароль", widget=forms.PasswordInput(attrs = {'placeholder' : 'Введи пароль'}))
    password2 = forms.CharField(label="Підвердження паролю", widget=forms.PasswordInput(attrs = {'placeholder' : 'Повтори пароль'}) )

    class Meta:
        model = user
        fields = ('email', )
        labels = {
            'email': 'Електронна пошта'
        }
        widgets = {
            'email': forms.EmailInput(attrs={
                'placeholder': 'you@example.com'
            })
        }

    def clean_email(self):
        email = self.cleaned_data['email']
        if user.objects.filter(email = email).exists():
            existing_user = user.objects.get(email=email)
            if existing_user.email_confirmed:
                raise forms.ValidationError('Користувач з такою електронною поштою вже існує')
        return email

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError('Паролі не співпадають')
        return cleaned_data
    
    def save(self, commit = True):
        email = self.cleaned_data['email']
        try:
            user_obj = user.objects.get(email=email)
            user_obj.set_password(self.cleaned_data['password1'])
            user_obj.is_active = False
            user_obj.email_confirmed = False
            user_obj.generate_code()
            if commit:
                user_obj.save()
            return user_obj
        except user.DoesNotExist:
            user_obj = super().save(commit = False) 
            user_obj.username = ''
            user_obj.set_password(self.cleaned_data['password1'])
            user_obj.is_active = False
            user_obj.email_confirmed = False
            
            if commit:
                user_obj.save()
                user_obj.generate_code()
            return user_obj

class LoginForm(AuthenticationForm):
    username = forms.EmailField(label='Електрона пошта', widget = forms.EmailInput(attrs = {'placeholder':'you@example.com'}))
    password = forms.CharField(label='Пароль', widget=forms.PasswordInput(attrs={'placeholder':'Введи пароль'}))
    
    def clean(self):
        email = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')
        if email and password:
            self.user_cache = authenticate(
                self.request, 
                username = email,
                password = password
            )
        
            if not self.user_cache:
                raise forms.ValidationError('Логін або пароль не співпадають')
        
            self.confirm_login_allowed(self.user_cache)

        return self.cleaned_data

class EmailVerificationForm(forms.Form):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for i in range(1, 7):
            self.fields[f'digit{i}'] = forms.CharField(
                max_length=1,
                min_length=1,
                label=False, 
            
                widget=forms.TextInput(attrs={
                    'inputmode': 'numeric',
                    'maxlength': '1',
                    'placeholder': '_',
                })
            )
    def clean(self):
        cleaned_data = super().clean()
        code = ''.join([cleaned_data.get(f'digit{i}', '') for i in range(1, 7)])
        cleaned_data["code"] = code
        return cleaned_data