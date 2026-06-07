from django.urls import path
from .views import *

urlpatterns = [
    path(route='', view= AuthTemplateView.as_view(), name= 'auth'),
    path(route='register/', view= RegisterView.as_view(), name= 'register'),
    path(route='login/', view= LoginView.as_view(), name= 'login'),
    path('logout/', LogoutView.as_callable() if hasattr(LogoutView, 'as_callable') else LogoutView.as_view(), name='logout'),
    path(route='confirm/', view= ConfirmEmailView.as_view(), name= 'confirm'),
    path(route="friends/", view = FriendsView.as_view(), name="friends"),
    path(route="friends/<str:section>/", view = FriendSectionView.as_view(), name="friend_section"),
    path(route="friends/action/<int:other_user_id>/<str:action>/", view = FriendActionView.as_view(), name="friend_action")
]
