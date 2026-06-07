from django.views.generic.base import TemplateView

# Create your views here. 

class SettingsPageView(TemplateView):
    template_name = "settings_app/settings.html"