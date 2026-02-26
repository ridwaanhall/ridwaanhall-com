from django.test import TestCase

from apps.blog.types import BlogContentItem, BlogData
from apps.data.data_service import DataService


class BlogTypesTest(TestCase):
    """Tests for OOP type classes in apps/blog/types/."""

    def test_blog_content_item_to_dict(self):
        item = BlogContentItem(type="paragraph", text="Hello world")
        d = item.to_dict()
        self.assertEqual(d["type"], "paragraph")
        self.assertEqual(d["text"], "Hello world")
        self.assertEqual(d["items"], [])

    def test_blog_content_item_defaults(self):
        item = BlogContentItem(type="list")
        self.assertEqual(item.text, "")
        self.assertEqual(item.class_, "")

    def test_blog_data_to_dict(self):
        from datetime import datetime, timezone
        blog = BlogData(
            id=1, title="Test Blog", description="A test blog post",
            author="Test Author", username="testauthor", author_image="img.png",
            created_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
            is_featured=True,
        )
        d = blog.to_dict()
        self.assertEqual(d["id"], 1)
        self.assertEqual(d["title"], "Test Blog")
        self.assertTrue(d["is_featured"])

    def test_blog_data_defaults(self):
        blog = BlogData(id=2, title="Blog 2", description="desc", author="A", username="u", author_image="img.png")
        self.assertEqual(blog.category, "")
        self.assertEqual(blog.slug, "")
        self.assertFalse(blog.is_featured)


class BlogDataServiceTest(TestCase):
    """Tests that DataService correctly loads blog data from apps/blog/data/."""

    def test_get_blogs_returns_list(self):
        result = DataService.get_blogs()
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_get_blogs_sorted_by_created_at(self):
        blogs = DataService.get_blogs(sort_by_id=True)
        dates = [b.get("created_at") for b in blogs if b.get("created_at")]
        self.assertEqual(dates, sorted(dates, reverse=True))

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

