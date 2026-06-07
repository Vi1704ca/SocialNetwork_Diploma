from django.db import models
from django.contrib.auth.models import AbstractUser
import secrets
# Create your models here.
class User(AbstractUser):
    # Додаємо це поле для псевдоніма автора:
    nickname = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        verbose_name="Псевдонім автора"
    )
    
    username = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )
    email = models.EmailField(
        unique=True
    )
    email_confirmed = models.BooleanField(default=False)
    confirmed_code = models.CharField(max_length=6, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def generate_code(self):
        code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        self.confirmed_code = code
        self.save()
        return code
     
class Friendship(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_friendships")
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_friendships")
    status = models.CharField(max_length=50, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("from_user", "to_user")