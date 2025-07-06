"""
Blog template tags for handling multiple images and other blog-specific functionality.
"""

from django import template
from django.utils.safestring import mark_safe

register = template.Library()


@register.filter
def get_blog_image(blog, image_name=None):
    """
    Get a specific image from the blog's images dictionary.
    If no image_name is provided, returns the first image.
    
    Usage:
    {{ blog|get_blog_image:"thumbnail.webp" }}
    {{ blog|get_blog_image }}  # Returns first image
    """
    if not blog or 'images' not in blog:
        return blog.get('image_url', '') if blog else ''
    
    images = blog.get('images', {})
    if not images:
        return blog.get('image_url', '')
    
    if image_name:
        return images.get(image_name, '')
    
    # Return first image if no specific name requested
    return list(images.values())[0] if images else ''


@register.filter
def get_blog_image_name(blog, index=0):
    """
    Get the name of an image at a specific index.
    
    Usage:
    {{ blog|get_blog_image_name:0 }}  # Returns first image name
    {{ blog|get_blog_image_name:1 }}  # Returns second image name
    """
    if not blog or 'images' not in blog:
        return blog.get('img_name', '') if blog else ''
    
    images = blog.get('images', {})
    if not images:
        return blog.get('img_name', '')
    
    image_names = list(images.keys())
    if 0 <= index < len(image_names):
        return image_names[index]
    
    return ''


@register.inclusion_tag('blog/partials/image_gallery.html')
def blog_image_gallery(blog, class_name=""):
    """
    Render a gallery of all blog images.
    
    Usage:
    {% blog_image_gallery blog "gallery-class" %}
    """
    images = []
    if blog and 'images' in blog:
        for name, url in blog['images'].items():
            images.append({
                'name': name,
                'url': url,
                'alt': f"{blog.get('title', '')} - {name}"
            })
    
    return {
        'images': images,
        'blog': blog,
        'class_name': class_name
    }


@register.filter
def blog_image_count(blog):
    """
    Get the number of images in the blog.
    
    Usage:
    {{ blog|blog_image_count }}
    """
    if blog and 'images' in blog:
        return len(blog['images'])
    return 1 if blog and blog.get('image_url') else 0


@register.filter
def has_multiple_images(blog):
    """
    Check if blog has multiple images.
    
    Usage:
    {% if blog|has_multiple_images %}...{% endif %}
    """
    if blog and 'images' in blog:
        return len(blog['images']) > 1
    return False
