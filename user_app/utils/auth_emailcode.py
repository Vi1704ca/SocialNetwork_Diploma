from django.core.mail import send_mail
from django.conf import settings

def send_verification_code_email(user):
    subject = "Підтвердження e-mail адреси"
    message = f"Ваш код підтвердження: {user.confirmed_code}"
    send_mail (
        subject = subject,
        message = message,
        from_email = settings.DEFAULT_FROM_EMAIL, 
        recipient_list = [user.email], 
    )
    
