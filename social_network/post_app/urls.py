from django.urls import path
from .views import *

urlpatterns = [
    path("", PostListView.as_view(), name="post"),
    path("create/", view=PostCreateView.as_view(), name='post_create'),
    path('tag/create/', TagCreateView.as_view(), name='tag_create'),
    path("detail/<int:post_id>/", PostDetailJsonView.as_view(), name="post_detail_json"),
    path("update/<int:post_id>/", PostUpdateView.as_view(), name="post_update"),
    path("delete/<int:post_id>/", PostDeleteView.as_view(), name="post_delete"),
    path("reaction/<int:post_id>/<str:reaction_type>/", PostReactionToggleView.as_view(), name="post_reaction_toggle"),
    path("view/<int:post_id>/", PostViewRegisterView.as_view(), name="post_view_register"),
]