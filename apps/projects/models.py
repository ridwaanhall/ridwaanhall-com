from django.db import models

from apps.projects.types.project import ProjectStatus


class Project(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    headline = models.CharField(max_length=500, blank=True)
    description = models.JSONField(default=list, blank=True)

    github_url = models.URLField(blank=True, null=True)
    demo_url = models.URLField(blank=True, null=True)
    category = models.CharField(max_length=255, blank=True)
    tags = models.JSONField(default=list, blank=True)

    is_featured = models.BooleanField(default=False)
    featured_priority = models.IntegerField(blank=True, null=True)
    status = models.CharField(
        max_length=32,
        choices=[(s.value, s.name.replace("_", " ").title()) for s in ProjectStatus],
        default=ProjectStatus.COMPLETED.value,
    )

    tech_stack = models.ManyToManyField("about.Skill", related_name="projects", blank=True)

    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["id"]
        indexes = [
            models.Index(fields=["is_featured"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return self.title


class Feature(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="features")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class ProjectImage(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="project/")
    original_filename = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.original_filename or f"image #{self.pk}"
