"""
Content Manager - Central controller for blog and project data.
ORM-backed (previously read from apps/blog/data/ and apps/projects/data/ IFS
files) -- builds the same plain dict shapes the old dynamic_loader produced,
so templates and DataService's sorting logic need no changes.
"""


def _add_image_compat_fields(data: dict) -> dict:
    """Inject the same derived single-image/multi-image fields the old
    apps/core/dynamic_loader.py::add_image_compat_fields did. The `get_image`
    lambda it also used to inject is dropped -- confirmed unused anywhere in
    templates/tags, and it can't be stored on a dict built from ORM data
    the way it was on a static, request-independent module-level literal."""
    if data.get("images"):
        urls = list(data["images"].values())
        names = list(data["images"].keys())
        data["image_url"] = urls[0]
        data["img_name"] = names[0]
        data["image_list"] = urls
        data["image_names"] = names
        data["image_count"] = len(data["images"])
    return data


class ContentManager:
    """Central data manager, backed by the ORM."""

    @staticmethod
    def blog_to_dict(post) -> dict:
        data = {
            "id": post.id, "title": post.title, "slug": post.slug,
            "description": post.description, "author": post.author, "username": post.username,
            "author_image": post.author_image.url if post.author_image else "",
            "images": {img.original_filename: img.image.url for img in post.images.all() if img.image},
            "created_at": post.created_at, "updated_at": post.updated_at,
            "content": post.content, "tags": post.tags, "category": post.category,
            "is_featured": post.is_featured, "read_time": post.read_time, "views": post.views,
        }
        return _add_image_compat_fields(data)

    @staticmethod
    def project_to_dict(project) -> dict:
        data = {
            "id": project.id, "title": project.title, "slug": project.slug,
            "headline": project.headline, "description": project.description,
            "features": [
                {"title": f.title, "description": f.description} for f in project.features.all()
            ],
            "images": {img.original_filename: img.image.url for img in project.images.all() if img.image},
            "tech_stack": [
                {"name": s.name, "description": s.description, "icon_svg": s.icon_svg, "category": s.category}
                for s in project.tech_stack.all()
            ],
            "github_url": project.github_url, "demo_url": project.demo_url,
            "category": project.category, "tags": project.tags,
            "is_featured": project.is_featured, "featured_priority": project.featured_priority,
            "status": project.status,
            "created_at": project.created_at, "updated_at": project.updated_at,
        }
        return _add_image_compat_fields(data)

    @classmethod
    def get_blogs(cls):
        """Get all blog posts."""
        from apps.blog.models import BlogPost

        posts = BlogPost.objects.prefetch_related("images")
        return [cls.blog_to_dict(post) for post in posts]

    @classmethod
    def get_projects(cls):
        """Get all projects."""
        from apps.projects.models import Project

        projects = Project.objects.prefetch_related("features", "images", "tech_stack")
        return [cls.project_to_dict(project) for project in projects]

    @classmethod
    def blog_queryset(cls):
        """Queryset for indexed single-item lookups (e.g. by slug)."""
        from apps.blog.models import BlogPost

        return BlogPost.objects.prefetch_related("images")

    @classmethod
    def project_queryset(cls):
        """Queryset for indexed single-item lookups (e.g. by slug)."""
        from apps.projects.models import Project

        return Project.objects.prefetch_related("features", "images", "tech_stack")
