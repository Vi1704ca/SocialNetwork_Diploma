from django.db import models

from django.conf import settings
# Create your models here.

class Post(models.Model):
    ''''''
    author = models.ForeignKey(
        to = settings.AUTH_USER_MODEL,
        on_delete= models.CASCADE,
        related_name= "posts"
    )
    
    title = models.CharField(max_length= 150)
    topic = models.CharField(max_length= 150, blank= True, null= True)
    content = models.TextField()
    tags = models.ManyToManyField("Tag", related_name= "posts", blank= True)
    created_at = models.DateTimeField(auto_now_add= True)
    updated_at = models.DateTimeField(auto_now= True)
    
    def __str__(self):
        return f"{self.author.username}: {self.title}"
# 
class Tag(models.Model):
    ''''''
    name = models.CharField(max_length= 100, unique= True)
    
    def __str__(self):
        return f"#{self.name}"
#  
class PostLinks(models.Model):
    ''''''
    post = models.ForeignKey(
        to = Post,
        on_delete= models.CASCADE,
        related_name= "links"
    )
    url = models.URLField(max_length= 500)

    def __str__(self):
        return f"Link: {self.url}"
# 
class PostImage(models.Model):
    ''''''
    post = models.ForeignKey(
        to = Post,
        on_delete= models.CASCADE,
        related_name= "images"
    )
    original_image = models.ImageField(upload_to= "post_app/original_image/")
    compressed_image = models.ImageField(upload_to= "post_app/compressed_image/")
    
    def __str__(self):
        return f"Image: {self.original_image}"
# 
class PostView(models.Model):
    ''''''
    user = models.ForeignKey(
        to= settings.AUTH_USER_MODEL,
        on_delete= models.CASCADE
    )
    post = models.ForeignKey(
        to= Post,
        on_delete= models.CASCADE,
        related_name= "views"
    )