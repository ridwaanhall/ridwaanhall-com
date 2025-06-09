"""
Blog data index - imports all individual blog files
"""

from pathlib import Path
import importlib.util
import os

class BlogDataIndex:
    """Dynamic loader for individual blog files."""
    
    @classmethod
    def load_all_blogs(cls):
        """Load all blog data from individual files."""
        blogs = []
        blog_dir = Path(__file__).parent / "blog"
        
        if not blog_dir.exists():
            return []
        
        # Get all blog files and sort them
        blog_files = sorted([f for f in blog_dir.glob("blog-*.py")])
        
        for blog_file in blog_files:
            try:
                # Import the module
                spec = importlib.util.spec_from_file_location(
                    f"blog_{blog_file.stem}", blog_file
                )
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Get the blog data
                if hasattr(module, 'blog_data'):
                    blogs.append(module.blog_data)
                    
            except Exception as e:
                print(f"Error loading {blog_file}: {e}")
                continue
        
        return blogs
    
    @classmethod
    def get_blogs(cls):
        """Get all blog data."""
        return cls.load_all_blogs()

# For backward compatibility
blogs = BlogDataIndex.load_all_blogs()
