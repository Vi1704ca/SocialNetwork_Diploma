from django.shortcuts import render, redirect
from django.http import HttpRequest, JsonResponse
from django.views.generic.base import TemplateView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.contrib.auth import get_user_model



from .forms import MessageForm
from .models import Chat
from user_app.utils.friend_queries import get_user_by_section
# Create your views here.

User = get_user_model()


class ChatsPageView(LoginRequiredMixin, TemplateView):
    template_name = 'chat_app/chat.html'
    login_url = reverse_lazy("auth")
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["users"] = get_user_by_section(self.request.user, "friends")
        context["personal_chats"] = Chat.objects.filter(users= self.request.user, is_group= False).order_by("id")
        context["group_chats"] = Chat.objects.filter(users=self.request.user, is_group=True).order_by("-id")
        return context

class ChatWithView(LoginRequiredMixin, View):
    login_url = reverse_lazy("auth")
    
    def post(self, request, user_id, *args, **kwargs):
        other_user = User.objects.get(id= user_id)
        friends = get_user_by_section(request.user, "friends")

        if other_user not in friends:
            return JsonResponse({"success": False}, status= 403) 
        
        user_id_chats = Chat.objects.filter(users= request.user, is_group = False).values_list('id', flat = True)
        chat = Chat.objects.filter(id__in= user_id_chats, users= other_user, is_group= False).first()

        if chat is None:
            chat = Chat.objects.create(is_group=False)
            chat.users.add(request.user, other_user)

        messages = [
            {
                'id': message.id,
                'sender_id': message.sender.id,
                'sender_name': getattr(message.sender, 'nickname', message.sender.username),
                'message': message.text,
                'created_at': message.created_at.isoformat()
            }
            for message in chat.messages.order_by('created_at')
        ]

        return JsonResponse(
            {
                'success': True,
                'chat_id': chat.id,
                'username': other_user.username,
                'messages': messages
            }
        )


class ChatOpenView(LoginRequiredMixin, View):
    login_url = reverse_lazy("auth")

    def get(self, request, chat_id, *args, **kwargs):
        chat = Chat.objects.filter(id=chat_id, users=request.user).first()
        if not chat:
            return JsonResponse({'success': False}, status=404)

        messages = [
            {
                'id': message.id,
                'sender_id': message.sender.id,
                'sender_name': getattr(message.sender, 'nickname', message.sender.username),
                'message': message.text,
                'created_at': message.created_at.isoformat()
            }
            for message in chat.messages.order_by('created_at')
        ]

        return JsonResponse({
            'success': True,
            'chat_id': chat.id,
            'chat_name': chat.name or 'Груповий чат',
            'messages': messages
        })


class CreateGroupChatView(LoginRequiredMixin, View):
    login_url = reverse_lazy("auth")

    def post(self, request, *args, **kwargs):
        member_ids = request.POST.get('members', '')
        name = request.POST.get('name', '').strip()
        if not name:
            return redirect('chat')

        members = []
        if member_ids:
            for member_id in member_ids.split(','):
                try:
                    member = User.objects.get(id=int(member_id))
                    members.append(member)
                except (ValueError, User.DoesNotExist):
                    continue

        chat = Chat.objects.create(is_group=True, name=name, admin=request.user)
        chat.users.add(request.user)
        if members:
            chat.users.add(*members)

        return redirect('chat')