from django.db import models
from django.contrib.auth import get_user_model
# Create your models here.

user = get_user_model()

class Chat(models.Model):
    # 
    users = models.ManyToManyField(to= user, related_name= "chats")
    admin = models.ForeignKey(to= user, blank= True, null= True, on_delete= models.CASCADE)
    
    name = models.CharField(max_length= 30, blank= True, null= True)
    is_group = models.BooleanField(default= False)
    avatar = models.ImageField(upload_to= "chat_app/chat_avatars/", blank= True, null= True)

    def __str__(self):
        return self.name or f"Chat: {self.id}"

    @property
    def last_message(self):
        return self.messages.order_by('-created_at').first()

    @property
    def last_message_text(self):
        msg = self.last_message
        return msg.text if msg else ''

    @property
    def last_message_time(self):
        msg = self.last_message
        return msg.created_at.strftime('%H:%M') if msg else ''

    @property
    def last_message_date(self):
        msg = self.last_message
        return msg.created_at.strftime('%d.%m.%Y') if msg else ''


class Message(models.Model):
    chat = models.ForeignKey(to=Chat, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(to=user, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} @ {self.chat}: {self.text[:30]}"


class Message(models.Model):
    chat = models.ForeignKey(to=Chat, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(to=user, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} @ {self.chat}: {self.text[:30]}"