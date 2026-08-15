"""BlogPost and BlogImage model behaviour."""

from datetime import UTC

from django.test import TestCase


class BlogModelsTest(TestCase):
    """Tests for the ORM models in apps/blog/models.py."""

    def test_blog_post_defaults(self):
        from datetime import datetime

        from apps.blog.models import BlogPost

        blog = BlogPost.objects.create(
            title="Blog 2", slug="blog-2", description="desc", author="A", username="u",
            created_at=datetime(2025, 1, 1, tzinfo=UTC), updated_at=datetime(2025, 1, 1, tzinfo=UTC),
        )
        self.assertEqual(blog.category, "")
        self.assertFalse(blog.is_featured)
        self.assertEqual(blog.views, 0)

    def test_blog_image_ordering(self):
        from datetime import datetime

        from apps.blog.models import BlogImage, BlogPost

        blog = BlogPost.objects.create(
            title="Gallery Post", slug="gallery-post", description="desc", author="A", username="u",
            created_at=datetime(2025, 1, 1, tzinfo=UTC), updated_at=datetime(2025, 1, 1, tzinfo=UTC),
        )
        BlogImage.objects.create(blog=blog, image="blog/b.webp", original_filename="b.webp", order=1)
        BlogImage.objects.create(blog=blog, image="blog/a.webp", original_filename="a.webp", order=0)
        self.assertEqual([img.original_filename for img in blog.images.all()], ["a.webp", "b.webp"])
