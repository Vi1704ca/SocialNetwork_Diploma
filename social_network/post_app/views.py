from django.shortcuts import render, get_object_or_404
from django.views.generic import ListView, FormView, View
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy

from .models import Post, Tag, PostReaction, PostView
from .forms import PostForm, TagForm

# Create your views here.
class PostListView(LoginRequiredMixin, ListView):
    # model = Post
    template_name = 'post_app/all_posts.html'
    # context_object_name = 'posts'
    paginate_by = 5
    # 
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_create_post'] = PostForm()
        context['form_tag'] = TagForm()
        context['posts'] = Post.objects.filter(author_id=self.request.user)[:self.paginate_by]
        context["sidebar_views_count"] = PostView.objects.filter(
            post__author=self.request.user
        ).count()
        return context
    # 
    def get_queryset(self):
        return Post.objects.filter(author_id = self.request.user)
    
    def get(self, request, *args, **kwargs):
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            # із моделі Post отримуємо всі пости у змінну queryset
            queryset = self.get_queryset()        
            paginator = Paginator(queryset, self.paginate_by)
            page_number = request.GET.get('page')
            page_obj = paginator.get_page(page_number)
            if int(page_number) > paginator.num_pages:
                return JsonResponse({'success': False})
            return JsonResponse({
                'success': True,
                'html': render_to_string('particles/show_post.html', {'posts': page_obj.object_list})
            })
        
        return super().get(request, *args, **kwargs)
    
class PostCreateView(LoginRequiredMixin, FormView):
    form_class = PostForm
    success_url = reverse_lazy('post')
    login_url = reverse_lazy('auth')
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        if self.request.method == 'POST':
            # print(self.request.FILES.getlist('images'))
            kwargs['links'] = self.request.POST.getlist('links')
            kwargs['images'] = self.request.FILES.getlist('images')
            
        return kwargs
    def form_valid(self, form: PostForm):
        post = form.save(author=self.request.user)

        post_html = render_to_string(
            'particles/show_post.html',
            {'posts': [post]},
            request=self.request
        )

        return JsonResponse({
            'success': True,
            'message': 'Публікацію створено успішно',
            'post_id': post.id,
            'post_html': post_html
        })
    
    def form_invalid(self, form: PostForm):
        return JsonResponse(
            {
                "success" : False,
                'errors': form.errors.get_json_data()
            },
            status = 400
        )

class TagCreateView(LoginRequiredMixin, FormView):
    form_class = TagForm

    def form_valid(self, form):
        name = form.cleaned_data['name']
        tag, created = Tag.objects.get_or_create(name=name)
        
        return JsonResponse({
            'success': True,
            'tag_id': tag.id,
            'tag_name': tag.name,
            'created': created
        })

    def form_invalid(self, form):
        return JsonResponse({
            'success': False,
            'errors': form.errors
        }, status=400)
    
    
class PostDetailJsonView(LoginRequiredMixin, View):
    login_url = reverse_lazy('auth')

    def get(self, request, post_id, *args, **kwargs):
        post = get_object_or_404(
            Post.objects.prefetch_related('tags', 'links'),
            id=post_id,
            author=request.user
        )

        return JsonResponse({
            'success': True,
            'post': {
                'id': post.id,
                'title': post.title,
                'topic': post.topic or '',
                'content': post.content,
                'tags': list(post.tags.values_list('id', flat=True)),
                'links': list(post.links.values_list('url', flat=True)),
            }
        })


class PostUpdateView(LoginRequiredMixin, View):
    login_url = reverse_lazy('auth')

    def post(self, request, post_id, *args, **kwargs):
        post = get_object_or_404(Post, id=post_id, author=request.user)

        form = PostForm(
            request.POST,
            instance=post,
            links=request.POST.getlist('links'),
            images=[]
        )

        if form.is_valid():
            post = form.save(author=request.user)

            post.links.all().delete()

            for url in form.links_list:
                post.links.create(url=url)

            post_html = render_to_string(
                'particles/show_post.html',
                {'posts': [post]},
                request=request
            )

            return JsonResponse({
                'success': True,
                'message': 'Публікацію оновлено',
                'post_html': post_html,
                'post_id': post.id,
            })

        return JsonResponse({
            'success': False,
            'errors': form.errors.get_json_data()
        }, status=400)


class PostDeleteView(LoginRequiredMixin, View):
    login_url = reverse_lazy('auth')

    def post(self, request, post_id, *args, **kwargs):
        post = get_object_or_404(Post, id=post_id, author=request.user)
        post.delete()

        return JsonResponse({
            'success': True,
            'post_id': post_id,
        })
    
class PostReactionToggleView(LoginRequiredMixin, View):
    login_url = reverse_lazy('auth')

    def post(self, request, post_id, reaction_type, *args, **kwargs):
        post = get_object_or_404(Post, id=post_id)

        if reaction_type not in ["heart", "like"]:
            return JsonResponse({"success": False}, status=400)

        reaction, created = PostReaction.objects.get_or_create(
            user=request.user,
            post=post,
            reaction_type=reaction_type
        )

        if not created:
            reaction.delete()
            reacted = False
        else:
            reacted = True

        return JsonResponse({
            "success": True,
            "reacted": reacted,
            "reaction_type": reaction_type,
            "heart_count": post.reactions.filter(reaction_type="heart").count(),
            "like_count": post.reactions.filter(reaction_type="like").count(),
            "views_count": post.views.count(),
        })


class PostViewRegisterView(LoginRequiredMixin, View):
    login_url = reverse_lazy('auth')

    def post(self, request, post_id, *args, **kwargs):
        post = get_object_or_404(Post, id=post_id)

        PostView.objects.get_or_create(
            user=request.user,
            post=post
        )

        return JsonResponse({
            "success": True,
            "views_count": post.views.count(),
        })