from .views import *
from django.urls import path


urlpatterns = [
    path(route="", view=ChatsPageView.as_view(), name = "chat"),
    path(route="chat_with/<int:user_id>/", view=ChatWithView.as_view(), name="chat_with"),
    path(route="chat_open/<int:chat_id>/", view=ChatOpenView.as_view(), name="chat_open"),
    path(route="group/create/", view=CreateGroupChatView.as_view(), name="chat_group_create"),
    path(route="upload_images/<int:chat_id>/", view=MessageImagesUploadView.as_view(), name='message_images_upload'),
    path(route="group/<int:chat_id>/leave/", view=LeaveGroupChatView.as_view(), name="chat_group_leave"),
    path(route="group/<int:chat_id>/delete/", view=DeleteGroupChatView.as_view(), name="chat_group_delete"),
    path(route="group/<int:chat_id>/edit/", view=EditGroupChatView.as_view(), name="chat_group_edit"),
    path(route="group/<int:chat_id>/media/", view=GroupMediaImagesView.as_view(), name="chat_group_media"),
    path(route="group/avatars/", view=GroupAvatarImagesView.as_view(), name="chat_group_avatars"),
]