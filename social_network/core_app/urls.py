from django.urls import path
from .views import *

urlpatterns = [
    path("", ShowAllPost.as_view(), name="home"),
    path('profile/<int:user_id>/', view=UserProfileView.as_view(), name='user_profile'),
    path('show-details-modal/', view=ShowDetailsModalView.as_view(), name='show_details_modal'),
    path('save-details/', view=ShowDetailsModalView.as_view(), name='save_details'),
]