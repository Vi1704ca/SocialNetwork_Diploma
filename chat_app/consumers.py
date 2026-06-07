# """
#     Відповідає за обробку подій WebSocket-з`єднань.
#     Цей файл є аналогом views.py і працює в асинхронному режимі обробки подій.
# """
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from .forms import MessageForm
from .models import Chat, Message
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        chat_id = self.scope['url_route']['kwargs'].get('chat_id')
        self.room_group_name = f'chat_{chat_id}'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        # await self.send(json.dumps({
        #     'message': 'hello, world!'
        # }))
        # await self.send(json.dumps({
        #     'message': 'msg from server'
        # }))
        
        
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        form = MessageForm(data)
        if not form.is_valid():
            return

        message = form.cleaned_data['message']
        user = self.scope['user']
        client_id = data.get('client_id')
        chat_id = self.scope['url_route']['kwargs'].get('chat_id')

        chat = await database_sync_to_async(Chat.objects.filter(id=chat_id, users=user).first)()
        if not chat:
            return

        created_message = await database_sync_to_async(Message.objects.create)(chat=chat, sender=user, text=message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': user.id,
                'sender_name': getattr(user, 'nickname', user.username),
                'created_at': created_message.created_at.isoformat(),
                'client_id': client_id
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event.get('sender_id'),
            'sender_name': event.get('sender_name'),
            'created_at': event.get('created_at'),
            'client_id': event.get('client_id')
        }))
        
        
