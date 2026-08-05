"""
Blog template tags for handling multiple images and other blog-specific functionality.
"""

from django import template

register = template.Library()


@register.inclusion_tag('blog/components/image_gallery.html')
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
