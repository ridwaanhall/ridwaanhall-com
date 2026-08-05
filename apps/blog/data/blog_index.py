"""
Blog data index - imports all individual blog files
"""

from pathlib import Path

from apps.core.dynamic_loader import add_image_compat_fields, load_items_from_dir


class BlogDataIndex:
    """Dynamic loader for individual blog files."""

    @classmethod
    def load_all_blogs(cls):
        """Load all blog data from individual files."""
        blog_dir = Path(__file__).parent / "blog"
        return load_items_from_dir(blog_dir, "blog-*.py", "blog_data", add_image_compat_fields)

    @classmethod
    def get_blogs(cls):
        """Get all blog data."""
        return cls.load_all_blogs()

# For backward compatibility
blogs = BlogDataIndex.load_all_blogs()
