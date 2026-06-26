from django.http import JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, View
from django.core.paginator import Paginator
from django.template.loader import render_to_string
from django.shortcuts import redirect, get_object_or_404
from django.urls import reverse_lazy

from post_app.forms import PostForm, TagForm
from post_app.models import Post, PostView
from chat_app.models import Chat
from user_app.models import Friendship, User

from .forms import UserDetailsForm


class ShowAllPost(LoginRequiredMixin, ListView):
    model = Post
    template_name = 'core_app/core.html'
    context_object_name = 'posts'
    paginate_by = 5
    login_url = reverse_lazy('auth')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_create_post'] = PostForm()
        context['form_tag'] = TagForm()

        context["personal_chats"] = Chat.objects.filter(
            users=self.request.user,
            is_group=False
        ).order_by("id")

        friend_requests = Friendship.objects.filter(
            to_user=self.request.user,
            status='pending'
        ).select_related('from_user')

        context["followers"] = [fr.from_user for fr in friend_requests]
        context['form_details'] = UserDetailsForm(instance=self.request.user)

        session_flag = self.request.session.get('show_details_modal', False)

        if session_flag:
            context['show_details_modal'] = True

        context["sidebar_views_count"] = PostView.objects.filter(
            post__author=self.request.user
        ).count()

        return context

    def get(self, request, *args, **kwargs):
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            queryset = self.get_queryset()
            paginator = Paginator(queryset, self.paginate_by)
            page_number = request.GET.get('page', 1)
            page_obj = paginator.get_page(page_number)

            if int(page_number) > paginator.num_pages:
                return JsonResponse({'success': False})

            return JsonResponse({
                'success': True,
                'html': render_to_string(
                    'particles/show_post.html',
                    {'posts': page_obj.object_list},
                    request=request
                )
            })

        return super().get(request, *args, **kwargs)
    
    def get_queryset(self):
        return Post.objects.all().order_by('-created_at')


class ShowDetailsModalView(LoginRequiredMixin, View):
    login_url = reverse_lazy('auth')

    def get(self, request, *args, **kwargs):
        request.session['show_details_modal'] = True
        print("SESSION SET:", request.session.get('show_details_modal'))  # Отладка
        return redirect('home')

    def post(self, request, *args, **kwargs):
        form = UserDetailsForm(request.POST, instance=request.user)

        if form.is_valid():
            user = form.save()
            request.session.pop('show_details_modal', None)

            return JsonResponse({
                'success': True,
                'message': 'Дані успішно збережені',
                'user': {
                    'nickname': user.nickname,
                    'username': user.username,
                    'email': user.email,
                }
            })

        return JsonResponse({
            'success': False,
            'errors': form.errors,
        }, status=400)
    
class UserProfileView(LoginRequiredMixin, ListView):
    model = Post
    template_name = 'core_app/profile.html'
    context_object_name = 'posts'
    paginate_by = 5
    login_url = reverse_lazy('auth')

    def get_queryset(self):
        self.profile_user = get_object_or_404(User, id=self.kwargs['user_id'])
        return Post.objects.filter(author=self.profile_user).order_by('-id')

    def get_friends_count(self, user):
        sent_count = user.sent_friendships.filter(status="accepted").count()
        received_count = user.received_friendships.filter(status="accepted").count()
        return sent_count + received_count

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        current_user = self.request.user
        profile_user = self.profile_user
        is_own_profile = current_user.id == profile_user.id

        friendship_status = None
        friendship_is_incoming = False

        if not is_own_profile:
            friendship = (
                Friendship.objects.filter(from_user=current_user, to_user=profile_user).first()
                or Friendship.objects.filter(from_user=profile_user, to_user=current_user).first()
            )

            if friendship:
                friendship_status = friendship.status
                friendship_is_incoming = (
                    friendship.status == "pending"
                    and friendship.from_user_id == profile_user.id
                )

        context["profile_user"] = profile_user
        context["is_own_profile"] = is_own_profile
        context["sidebar_user"] = profile_user
        context["sidebar_posts_count"] = Post.objects.filter(author=profile_user).count()
        context["sidebar_friends_count"] = self.get_friends_count(profile_user)
        context["show_friend_actions"] = not is_own_profile
        context["friendship_status"] = friendship_status
        context["friendship_is_incoming"] = friendship_is_incoming
        context["sidebar_views_count"] = PostView.objects.filter(
            post__author=profile_user
        ).count()

        return context

    def get(self, request, *args, **kwargs):
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            queryset = self.get_queryset()
            paginator = Paginator(queryset, self.paginate_by)
            page_number = request.GET.get('page', 1)
            page_obj = paginator.get_page(page_number)

            if int(page_number) > paginator.num_pages:
                return JsonResponse({'success': False})

            return JsonResponse({
                'success': True,
                'html': render_to_string(
                    'particles/show_post.html',
                    {'posts': page_obj.object_list},
                    request=request
                )
            })

        return super().get(request, *args, **kwargs)