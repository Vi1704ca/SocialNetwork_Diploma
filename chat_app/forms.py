from django import forms 

# ! сделай placeholder (через виджет) и чтобы поле было обязательным 
class MessageForm(forms.Form):
    message = forms.CharField(
        max_length=100,
        required=True,
        widget=forms.TextInput(
            attrs={
                'placeholder': 'Напишіть повідомлення...',
                'required': 'required'
            }
        )
    )