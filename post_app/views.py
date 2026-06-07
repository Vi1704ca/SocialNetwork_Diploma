from django.shortcuts import render
from django.views.generic import ListView, FormView
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy

from .models import Post, Tag
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
        context['form_tag'] = TagForm() # Добавьте это
        context['posts'] = Post.objects.filter(author_id=self.request.user)[:self.paginate_by]
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
        post = form.save(author= self.request.user)
        print(post)
        return JsonResponse(
            {
                'success': True,
                'message': 'Публікацію створено успішно',
                'redirect_url': str(self.success_url),
                'post_id': post.id
            }
        )
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
    
    