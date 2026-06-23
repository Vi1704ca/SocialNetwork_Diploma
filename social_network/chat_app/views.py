from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpRequest
from django.views.generic.base import TemplateView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from django.utils import timezone
from channels.layers import get_channel_layer

from .models import Chat, Message, MessageImage
from user_app.utils.friend_queries import get_user_by_section

User = get_user_model()


class ChatsPageView(LoginRequiredMixin, TemplateView):
    template_name = 'chat_app/chat.html'
    login_url = reverse_lazy("auth")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        friends = get_user_by_section(self.request.user, "friends")

        sorted_friends = sorted(
            friends,
            key=lambda u: (getattr(u, "nickname", "") or u.username).lower()
        )

        grouped_users = {}
        for friend in sorted_friends:
            name = getattr(friend, "nickname", "") or friend.username
            letter = name.strip()[0].upper() if name else "#"
            grouped_users.setdefault(letter, []).append(friend)

        context["users"] = sorted_friends
        context["grouped_users"] = grouped_users

        context["personal_chats"] = Chat.objects.filter(
            users=self.request.user,
            is_group=False
        ).order_by("-id")

        context["group_chats"] = Chat.objects.filter(
            users=self.request.user,
            is_group=True
        ).order_by("-id")

        return context


class ChatWithView(LoginRequiredMixin, View):
    login_url = reverse_lazy("auth")

    def post(self, request, user_id, *args, **kwargs):
        other_user = User.objects.filter(id=user_id).first()
        friends = get_user_by_section(request.user, "friends")

        if not other_user or other_user not in friends:
            return JsonResponse({"success": False}, status=403)

        chat = Chat.objects.filter(
            users=request.user,
            is_group=False
        ).filter(users=other_user).first()

        if chat is None:
            chat = Chat.objects.create(is_group=False)
            chat.users.add(request.user, other_user)

        messages = []
        for m in chat.messages.order_by("created_at"):
            messages.append({
                "id": m.id,
                "sender_id": m.sender.id,
                "sender_name": getattr(m.sender, "nickname", m.sender.username),
                "message": m.text,
                "created_at": m.created_at.isoformat(),
                "images": [img.image.url for img in m.images.all()],
                "is_read": m.read_by.exclude(pk=m.sender_id).exists(),
            })

        return JsonResponse({
            "success": True,
            "chat_id": chat.id,
            "chat_name": f"Чат з {other_user.nickname or other_user.username}",
            "messages": messages,
            "is_group": chat.is_group
        })


class ChatOpenView(LoginRequiredMixin, View):
    login_url = reverse_lazy("auth")

    def get(self, request, chat_id, *args, **kwargs):
        chat = Chat.objects.filter(id=chat_id, users=request.user).first()

        if not chat:
            return JsonResponse({"success": False}, status=404)

        messages = []
        for m in chat.messages.order_by("created_at"):
            messages.append({
                "id": m.id,
                "sender_id": m.sender.id,
                "sender_name": getattr(m.sender, "nickname", m.sender.username),
                "message": m.text,
                "created_at": m.created_at.isoformat(),
                "images": [img.image.url for img in m.images.all()]
            })

        return JsonResponse({
            "success": True,
            "chat_id": chat.id,
            "chat_name": chat.name or "Груповий чат",
            "messages": messages,
            "is_group": chat.is_group
        })


class CreateGroupChatView(LoginRequiredMixin, View):
    login_url = reverse_lazy("auth")

    def post(self, request, *args, **kwargs):
        member_ids = request.POST.get("members", "")
        name = request.POST.get("name", "").strip()

        if not name:
            return redirect("chat")

        chat = Chat.objects.create(
            is_group=True,
            name=name,
            admin=request.user
        )

        chat.users.add(request.user)

        if member_ids:
            for member_id in member_ids.split(","):
                try:
                    user = User.objects.get(id=int(member_id))
                    chat.users.add(user)
                except (ValueError, User.DoesNotExist):
                    continue

        if "avatar" in request.FILES:
            chat.avatar = request.FILES["avatar"]
            chat.save()

        return redirect("chat")


class MessageImagesUploadView(LoginRequiredMixin, View):
    login_url = reverse_lazy('auth')

    def post(self, request, chat_id):
        chat = Chat.objects.filter(id=chat_id, users=request.user).first()

        if not chat:
            return JsonResponse({"success": False, "error": "chat_not_found"}, status=403)

        text = request.POST.get("text", "").strip()
        images = request.FILES.getlist("images")

        if not text and not images:
            return JsonResponse({"success": False, "error": "empty_message"}, status=400)

        message = Message.objects.create(
            chat=chat,
            sender=request.user,
            text=text
        )

        for img in images:
            MessageImage.objects.create(message=message, image=img)

        try:
            image_urls = [img.image.url for img in message.images.all()]
        except Exception:
            image_urls = []

        sender_name = getattr(request.user, "nickname", None) or request.user.username

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_{chat_id}",
            {
                "type": "chat_message",
                "chat_id": chat.id,
                "message": text,
                "message_id": message.id,
                "sender_id": request.user.id,
                "sender_name": sender_name,
                "created_at": message.created_at.strftime("%H:%M"),
                "images": image_urls,
            }
        )

        return JsonResponse({
            "success": True,
            "message": text,
            "images": image_urls
        })