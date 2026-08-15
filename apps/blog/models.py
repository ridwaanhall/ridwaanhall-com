from django.db import models


class BlogPost(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    description = models.TextField(blank=True)
    author = models.CharField(max_length=100)
    username = models.CharField(max_length=100, blank=True)
    author_image = models.ImageField(upload_to="profile/", blank=True, null=True)

    content = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    category = models.CharField(max_length=100, blank=True)
    is_featured = models.BooleanField(default=False)
    read_time = models.IntegerField(blank=True, null=True)
    views = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_featured"]),
        ]

    def __str__(self):
        return self.title


class BlogImage(models.Model):
    blog = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="blog/")
    original_filename = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.original_filename or f"image #{self.pk}"
