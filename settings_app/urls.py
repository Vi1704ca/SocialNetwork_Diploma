from settings_app.views import SettingsPageView
from django.urls import path

urlpatterns = [
    path("settings/", SettingsPageView.as_view(), name = 'settings')
]