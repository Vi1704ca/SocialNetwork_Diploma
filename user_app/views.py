from django.shortcuts import render, redirect
from django.views.generic import TemplateView, FormView, View
from .forms import *
from django.urls import reverse_lazy
from django.http import JsonResponse, HttpResponse
from django.contrib.auth import login, logout 
from django.shortcuts import get_object_or_404
from .utils.auth_emailcode import send_verification_code_email
from django.contrib.auth.mixins import LoginRequiredMixin
from django.template.loader import render_to_string
from django.core.paginator import Paginator
from .utils.friend_queries import *
from .utils.friend_actions import *
from .models import User

# Create your views here.
class AuthTemplateView(TemplateView):
    template_name = 'user_app/auth.html'
    
    def get_context_data(self, **kwargs) -> dict:
        context = super().get_context_data(**kwargs)
        context["form_register"] = UserCreationForm()
        context["form_login"] = LoginForm()
        context["form_confirm"] = EmailVerificationForm()
        return context

class RegisterView(View):
    def post(self, request, *args, **kwargs):
        form = UserCreationForm(self.request.POST)
        print('Користувач був збережений')
        if form.is_valid():
            user = form.save()

            try:
                send_verification_code_email(user)
                email_sent = True
            except:
                email_sent = False

            return JsonResponse({
                "success": True,
                "message": "Реєстрація успішна"
            })
        
        return JsonResponse(
            {
                "success": False,
                "errors": form.errors.get_json_data(),
            },
            status = 400
            )
    
class LoginView(View):
    def post(self, request, *args, **kwargs):
        form = LoginForm(request=request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            print(user)
            login(request, user)

            return JsonResponse({
                "success": True,
                "message": "Користувач успішно залогінився",
                "redirect": "/"
            })
        return JsonResponse({
            "success": False,
            "errors": form.errors.get_json_data()
        }, status=400)
    
class ConfirmEmailView(View):
    def post(self, request, *args, **kwargs):
        form = EmailVerificationForm(request.POST) 
        email = request.POST.get("email")
        user = get_object_or_404(User, email = email)
        if user.email_confirmed:
            return JsonResponse({
                "success": False,
                "message": "E-mail вже підтверджено."
            }, status = 400 )
        if form.is_valid():
            entered_code = form.cleaned_data["code"]
            if user.confirmed_code == entered_code:
                user.email_confirmed = True
                user.is_active = True
                user.confirmed_code = None
                user.save()
                login(request, user)
                return JsonResponse({
                "success": True,
                "message": "E-mail підтверджено.",
                "redirect": "/"
            }) 
            else:
                return JsonResponse({
                "success": False,
                "message": "Код пітвердження невірний."
            }, status = 400 ) 

class LogoutView(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        logout(request)
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                "success": True,
                "message": "Ви успішно вийшли із системи",
                "redirect": "/auth/"
            })
        return redirect('auth')


class FriendsView(TemplateView):
    template_name = "user_app/friends.html"
    login_url = reverse_lazy("auth")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        current_user = self.request.user

        context["sections"] = {
            "requests": {
                "title": "Запити",
                "users": get_user_by_section(current_user, "requests")[:6]
            },

            "recommendations": {
                "title": "Рекомендації",
                "users": get_user_by_section(current_user, "recommendations")[:6]
            },

            "friends": {
                "title": "Всі друзі",
                "users": get_user_by_section(current_user, "friends")[:6]
            }
        }

        return context



class FriendSectionView(LoginRequiredMixin, View):
    def get(self, request, section, *args, **kwargs):
        users = get_user_by_section(request.user, section)

        page_obj = Paginator(users, 6).get_page(
            request.GET.get("page", 1)
        )

        html = render_to_string(
            "user_app/particles/friends/friends_cards.html",
            {
                "users": page_obj.object_list,
                "section": section
            },
            request=request
        )

        return JsonResponse({
            "html": html,
            "has_next_page": page_obj.has_next()
        })

class FriendActionView(LoginRequiredMixin, View):
    login_url = reverse_lazy("auth")

    def post(self, request, other_user_id, action, *args, **kwargs):
        other_user = User.objects.get(id=other_user_id)
        current_user = request.user

        if action == "add":
            return JsonResponse(add_friend_request(current_user, other_user))
        
        if action == "dismiss":
            return JsonResponse(dismiss_recommendation(current_user, other_user))
        
        if action == "delete":
            return JsonResponse(delete_friendship(current_user, other_user))
        
        if action == "accept":
            action_result = accept_friend_request(current_user, other_user)
            action_result["friend_html"] = render_to_string(
                "user_app/particles/friends/friends_cards.html",
                {"users": [action_result["friend"]], "section": "friends"},
                request=request
            )
            del action_result["friend"]
            return JsonResponse(action_result)