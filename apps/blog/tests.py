from datetime import UTC

from django.test import TestCase

from apps.core.data_service import DataService


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


class BlogDataServiceTest(TestCase):
    """Tests that DataService correctly loads blog data (ORM-backed)."""

    @classmethod
    def setUpTestData(cls):
        from datetime import datetime

        from apps.blog.models import BlogImage, BlogPost

        featured = BlogPost.objects.create(
            title="Featured Post", slug="featured-post", description="desc", author="A", username="a",
            is_featured=True, created_at=datetime(2026, 1, 2, tzinfo=UTC),
            updated_at=datetime(2026, 1, 2, tzinfo=UTC),
        )
        BlogImage.objects.create(blog=featured, image="blog/fake.webp", original_filename="fake.webp")
        BlogPost.objects.create(
            title="Older Post", slug="older-post", description="desc", author="A", username="a",
            is_featured=False, created_at=datetime(2026, 1, 1, tzinfo=UTC),
            updated_at=datetime(2026, 1, 1, tzinfo=UTC),
        )

    def test_get_blogs_returns_list(self):
        result = DataService.get_blogs()
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_get_blogs_sorted_by_created_at(self):
        blogs = DataService.get_blogs(sort_by_id=True)
        dates = [b.get("created_at") for b in blogs if b.get("created_at")]
        self.assertEqual(dates, sorted([d for d in dates if d is not None], reverse=True))

    def test_get_blogs_featured_only(self):
        featured = DataService.get_blogs(featured_only=True)
        self.assertIsInstance(featured, list)
        for blog in featured:
            self.assertTrue(blog.get("is_featured"))

    def test_blog_has_required_fields(self):
        blogs = DataService.get_blogs()
        first = blogs[0]
        self.assertIn("id", first)
        self.assertIn("title", first)
        self.assertIn("description", first)
        self.assertIn("author", first)

    def test_blog_has_image_url_field(self):
        blogs = DataService.get_blogs()
        first = blogs[0]
        self.assertIn("image_url", first)
        self.assertIn("img_name", first)

