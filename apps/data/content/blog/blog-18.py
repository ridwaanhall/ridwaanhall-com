"""
Blog Post #18: Multi-Image Example Post  
Example of how to use multiple images in blog posts
"""

from datetime import datetime
from django.conf import settings

# Blog data for: Multi-Image Example Post
blog_data = {
    "id": 18,
    "title": """Multi-Image Example Post""",
    "description": """This is an example blog post demonstrating how to use multiple images with the new image system.""",
    "images": {
        "main-image.webp": f"{settings.BLOG_BASE_IMG_URL}/start_with_python.webp",
        "thumbnail2.webp": f"{settings.BLOG_BASE_IMG_URL}/deep_learning_with_tensorflow_and_keras.webp",
        "gallery-image.webp": f"{settings.BLOG_BASE_IMG_URL}/effective_time_management_for_developers.webp"
    },
    "created_at": datetime.strptime("2025-07-06T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-07-06T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "author": "Ridwan Halim",
    "username": "ridwaanhall",
    "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
    "content": [
        "<p class='mb-4 text-sm md:text-base lg:text-lg'>This blog post demonstrates the new multi-image functionality. You can now include multiple images in your blog posts and they will be displayed in an interactive gallery.</p>",
        "<h2 class='text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3'>How Multiple Images Work</h2>",
        "<p class='mb-4 text-sm md:text-base lg:text-lg'>The system automatically detects when you have multiple images and creates a gallery with thumbnails. Users can click on thumbnails to switch between images.</p>",
        "<p class='mb-4 text-sm md:text-base lg:text-lg'>For backward compatibility, if you only have one image, it displays normally without the gallery interface.</p>"
    ],
    "is_featured": False,
    "tags": ['Example', 'Multi-Image', 'Gallery'],
    "category": "Example",
    "read_time": 2,
    "views": 0,
    "slug": "multi-image-example"
}
