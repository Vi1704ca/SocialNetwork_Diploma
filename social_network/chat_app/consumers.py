import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .forms import MessageForm
from .models import Chat, Message


global_online_users = {}

class ChatConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.chat_id = self.scope["url_route"]["kwargs"].get("chat_id")
        self.room_group_name = f"chat_{self.chat_id}"
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        read_message_ids = await self.mark_all_read()
        await self.broadcast_read_receipts(read_message_ids)
        await self.broadcast_unread_counts()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return
        
        if data.get("type") == "mark_read":
            read_message_ids = await self.mark_all_read()
            await self.broadcast_read_receipts(read_message_ids)
            await self.broadcast_unread_counts()
            return

        form = MessageForm(data)
        if not form.is_valid():
            return

        message_text = form.cleaned_data["message"]
        user = self.scope["user"]
        client_id = data.get("client_id")

        chat = await database_sync_to_async(
            Chat.objects.filter(id=self.chat_id, users=user).first
        )()

        if not chat:
            return

        created_message = await database_sync_to_async(
            Message.objects.create
        )(chat=chat, sender=user, text=message_text)

        await database_sync_to_async(
            created_message.read_by.add
        )(user)

        is_read = await self.check_if_read_by_others(created_message)
        

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "chat_id": chat.id,
                "message": message_text,
                "message_id": created_message.id,
                "sender_id": user.id,
                "sender_name": getattr(user, "nickname", user.username),
                "created_at": created_message.created_at.strftime("%H:%M"),
                "client_id": client_id,
                "is_read": is_read,
            }
        )

        await self.broadcast_unread_counts()

    async def chat_message(self, event):
        
        await self.send(text_data=json.dumps(event))

    async def unread_update(self, event):
        """Отправляет клиенту обновление счётчика непрочитанных по всем чатам."""
        await self.send(text_data=json.dumps({
            "type": "unread_update",
            "unread_counts": event["unread_counts"],
        }))

    async def read_receipt(self, event):
        """Сообщает отправителю, что его сообщение прочитано."""
        await self.send(text_data=json.dumps({
            "type": "read_receipt",
            "message_id": event["message_id"],
        }))


    @database_sync_to_async
    def mark_all_read(self):
        user = self.user
        unread = Message.objects.filter(
            chat_id=self.chat_id
        ).exclude(sender=user).exclude(read_by=user)

        message_ids = list(unread.values_list('id', flat=True))

        for msg in unread:
            msg.read_by.add(user)

        return message_ids  
    
    @database_sync_to_async
    def get_unread_counts(self, user):
        chats = Chat.objects.filter(users=user).prefetch_related('messages')
        result = {}
        for chat in chats:
            count = chat.messages.exclude(sender=user).exclude(read_by=user).count()
            result[str(chat.id)] = count
        return result

    @database_sync_to_async
    def get_chat_users(self):
        chat = Chat.objects.filter(id=self.chat_id).first()
        if not chat:
            return []
        return list(chat.users.values_list('id', flat=True))

    @database_sync_to_async
    def check_if_read_by_others(self, message):
        return message.read_by.exclude(pk=message.sender.pk).exists()

    async def broadcast_unread_counts(self):
        
        user_ids = await self.get_chat_users()
        for uid in user_ids:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                u = await database_sync_to_async(User.objects.get)(pk=uid)
            except User.DoesNotExist:
                continue
            counts = await self.get_unread_counts(u)
            await self.channel_layer.group_send(
                f"presence_user_{uid}",
                {
                    "type": "unread_update",
                    "unread_counts": counts,
                }
            )
    async def broadcast_read_receipts(self, message_ids):
        for message_id in message_ids:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "read_receipt",
                    "message_id": message_id,
                }
            )


class PresenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add("presence_global", self.channel_name)
        await self.channel_layer.group_add(f"presence_user_{self.user.id}", self.channel_name)
        await self.accept()

        was_offline = self.user.id not in global_online_users
        global_online_users[self.user.id] = global_online_users.get(self.user.id, 0) + 1

        await self.send_presence_sync()

        if was_offline:
            await self.channel_layer.group_send(
                "presence_global",
                {
                    "type": "presence_update",
                    "user_id": self.user.id,
                    "is_online": True,
                }
            )

        counts = await self.get_unread_counts()
        await self.send(text_data=json.dumps({
            "type": "unread_update",
            "unread_counts": counts,
        }))

    async def disconnect(self, close_code):
        user = self.scope["user"]

        if user.is_authenticated:
            current_count = global_online_users.get(user.id, 0)

            if current_count <= 1:
                global_online_users.pop(user.id, None)

                await self.channel_layer.group_send(
                    "presence_global",
                    {
                        "type": "presence_update",
                        "user_id": user.id,
                        "is_online": False,
                    }
                )
            else:
                global_online_users[user.id] = current_count - 1

        await self.channel_layer.group_discard("presence_global", self.channel_name)
        await self.channel_layer.group_discard(f"presence_user_{self.user.id}", self.channel_name)

    async def send_presence_sync(self):
        await self.send(text_data=json.dumps({
            "type": "presence_sync",
            "online_users": list(global_online_users.keys()),
        }))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "presence_update",
            "user_id": event["user_id"],
            "is_online": event["is_online"],
        }))

    async def unread_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "unread_update",
            "unread_counts": event["unread_counts"],
        }))

    @database_sync_to_async
    def get_unread_counts(self):
        user = self.user
        chats = Chat.objects.filter(users=user)
        result = {}

        for chat in chats:
            count = chat.messages.exclude(sender=user).exclude(read_by=user).count()
            result[str(chat.id)] = count

        return result