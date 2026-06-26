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
from django.core.files.base import ContentFile

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

<<<<<<< HEAD
        participants = list(chat.users.all())
        participants_count = len(participants)
        online_count = sum(1 for user in participants if user.id in global_online_users)
        members = [
            {
                "id": user.id,
                "name": getattr(user, "nickname", None) or user.username,
            }
            for user in participants
        ]
=======
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
        return JsonResponse({
            "success": True,
            "chat_id": chat.id,
            "chat_name": chat.name or "Груповий чат",
            "messages": messages,
<<<<<<< HEAD
            "is_group": chat.is_group,
            "is_admin": chat.admin_id == request.user.id,
            "participants_count": participants_count,
            "online_count": online_count,
            "members": members,
            "avatar_url": chat.avatar.url if chat.avatar else "",
=======
            "is_group": chat.is_group
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
        })


class CreateGroupChatView(LoginRequiredMixin, View):
    login_url = reverse_lazy("auth")

    def post(self, request, *args, **kwargs):
        member_ids = request.POST.get("members", "")
        name = request.POST.get("name", "").strip()
        selected_avatar_image_id = request.POST.get("selected_avatar_image_id", "").strip()

        selected_member_ids = [
            member_id.strip()
            for member_id in member_ids.split(",")
            if member_id.strip()
        ]

        if not name:
            return redirect("chat")

        if len(selected_member_ids) < 2:
            return redirect("chat")

        chat = Chat.objects.create(
            is_group=True,
            name=name,
            admin=request.user
        )

        chat.users.add(request.user)

        for member_id in selected_member_ids:
            try:
                user = User.objects.get(id=int(member_id))
                chat.users.add(user)
            except (ValueError, User.DoesNotExist):
                continue

        if "avatar" in request.FILES:
            chat.avatar = request.FILES["avatar"]
            chat.save()
        elif selected_avatar_image_id.startswith("group_avatar_"):
            avatar_chat_id = selected_avatar_image_id.replace("group_avatar_", "")

            selected_chat = Chat.objects.filter(
                id=avatar_chat_id,
                users=request.user,
                is_group=True,
                avatar__isnull=False
            ).exclude(avatar="").first()

            if selected_chat and selected_chat.avatar:
                selected_chat.avatar.open("rb")
                file_name = selected_chat.avatar.name.split("/")[-1]

                chat.avatar.save(
                    file_name,
                    ContentFile(selected_chat.avatar.read()),
                    save=False
                )

                selected_chat.avatar.close()
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
    
class LeaveGroupChatView(LoginRequiredMixin, View):
    login_url = reverse_lazy("auth")

    def post(self, request, chat_id, *args, **kwargs):
        chat = Chat.objects.filter(
            id=chat_id,
            users=request.user,
            is_group=True
        ).first()

        if not chat:
            return JsonResponse({
                "success": False,
                "error": "chat_not_found"
            }, status=404)

        if chat.admin_id == request.user.id:
            return JsonResponse({
                "success": False,
                "error": "admin_cannot_leave"
            }, status=403)

        chat.users.remove(request.user)

        return JsonResponse({"success": True})


class DeleteGroupChatView(LoginRequiredMixin, View):
    login_url = reverse_lazy("auth")

    def post(self, request, chat_id, *args, **kwargs):
        chat = Chat.objects.filter(
            id=chat_id,
            is_group=True
        ).first()

        if not chat:
            return JsonResponse({
                "success": False,
                "error": "chat_not_found"
            }, status=404)

        if chat.admin_id != request.user.id:
            return JsonResponse({
                "success": False,
                "error": "only_admin_can_delete"
            }, status=403)

        chat.delete()

        return JsonResponse({"success": True})

class EditGroupChatView(LoginRequiredMixin, View):
    login_url = reverse_lazy("auth")

    def post(self, request, chat_id, *args, **kwargs):
        chat = Chat.objects.filter(id=chat_id, is_group=True).first()

        if not chat:
            return JsonResponse({"success": False, "error": "chat_not_found"}, status=404)

        if chat.admin_id != request.user.id:
            return JsonResponse({"success": False, "error": "only_admin_can_edit"}, status=403)

        name = request.POST.get("name", "").strip()
        member_ids = request.POST.get("members", "")
        selected_avatar_image_id = request.POST.get("selected_avatar_image_id", "").strip()

        selected_member_ids = [
            member_id.strip()
            for member_id in member_ids.split(",")
            if member_id.strip()
        ]

        if not name:
            return JsonResponse({"success": False, "error": "empty_name"}, status=400)

        if len(selected_member_ids) < 2:
            return JsonResponse({"success": False, "error": "not_enough_members"}, status=400)

        chat.name = name

        if "avatar" in request.FILES:
            chat.avatar = request.FILES["avatar"]

        elif selected_avatar_image_id.startswith("group_avatar_"):
            avatar_chat_id = selected_avatar_image_id.replace("group_avatar_", "")

            selected_chat = Chat.objects.filter(
                id=avatar_chat_id,
                users=request.user,
                is_group=True,
                avatar__isnull=False
            ).exclude(avatar="").first()

            if selected_chat and selected_chat.avatar:
                selected_chat.avatar.open("rb")
                file_name = selected_chat.avatar.name.split("/")[-1]

                chat.avatar.save(
                    file_name,
                    ContentFile(selected_chat.avatar.read()),
                    save=False
                )

                selected_chat.avatar.close()

        elif selected_avatar_image_id:
            selected_image = MessageImage.objects.filter(
                id=selected_avatar_image_id,
                message__chat=chat
            ).first()

            if selected_image:
                selected_image.image.open("rb")
                file_name = selected_image.image.name.split("/")[-1]

                chat.avatar.save(
                    file_name,
                    ContentFile(selected_image.image.read()),
                    save=False
                )

                selected_image.image.close()

        chat.save()

        users = User.objects.filter(id__in=selected_member_ids)
        chat.users.set([request.user, *users])

        members = [
            {
                "id": user.id,
                "name": getattr(user, "nickname", None) or user.username,
            }
            for user in chat.users.all()
        ]

        return JsonResponse({
            "success": True,
            "chat_id": chat.id,
            "chat_name": chat.name,
            "is_group": True,
            "is_admin": chat.admin_id == request.user.id,
            "avatar_url": chat.avatar.url if chat.avatar else "",
            "participants_count": chat.users.count(),
            "members": members,
        })
    
class GroupMediaImagesView(LoginRequiredMixin, View):
    login_url = reverse_lazy("auth")

    def get(self, request, chat_id, *args, **kwargs):
        chat = Chat.objects.filter(
            id=chat_id,
            users=request.user,
            is_group=True
        ).first()

        if not chat:
            return JsonResponse({
                "success": False,
                "error": "chat_not_found"
            }, status=404)

        images = MessageImage.objects.filter(
            message__chat=chat
        ).order_by("-id")

        return JsonResponse({
            "success": True,
            "images": [
                {
                    "id": image.id,
                    "url": image.image.url,
                }
                for image in images
            ]
        })
    
class GroupAvatarImagesView(LoginRequiredMixin, View):
    login_url = reverse_lazy("auth")

    def get(self, request, *args, **kwargs):
        chats = Chat.objects.filter(
            users=request.user,
            is_group=True,
            avatar__isnull=False
        ).exclude(avatar="").order_by("-id")

        return JsonResponse({
            "success": True,
            "images": [
                {
                    "id": f"group_avatar_{chat.id}",
                    "url": chat.avatar.url,
                }
                for chat in chats
                if chat.avatar
            ]
        })