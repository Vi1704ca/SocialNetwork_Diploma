from .views import *
from django.urls import path


urlpatterns = [
    path(route="", view=ChatsPageView.as_view(), name = "chat"),
    path(route="chat_with/<int:user_id>/", view=ChatWithView.as_view(), name="chat_with"),
    path(route="chat_open/<int:chat_id>/", view=ChatOpenView.as_view(), name="chat_open"),
    path(route="group/create/", view=CreateGroupChatView.as_view(), name="chat_group_create"),
]