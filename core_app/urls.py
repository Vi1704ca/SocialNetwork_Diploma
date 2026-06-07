from django.urls import path
from core_app.views import *

urlpatterns = [
    path("", CorePageView.as_view(), name="home"),
]
