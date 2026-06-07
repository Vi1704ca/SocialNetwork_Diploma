from django.views.generic import TemplateView

# Create your views here.

class CorePageView(TemplateView):
    template_name = "core_app/core.html"

