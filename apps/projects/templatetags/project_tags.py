"""
Project template tags for handling multiple images and other project-specific functionality.
"""

from django import template
from django.utils.safestring import mark_safe

register = template.Library()


@register.filter
def get_project_image(project, image_name=None):
    """
    Get a specific image from the project's images dictionary.
    If no image_name is provided, returns the first image.
    
    Usage:
    {{ project|get_project_image:"screenshot.webp" }}
    {{ project|get_project_image }}  # Returns first image
    """
    if not project or 'images' not in project:
        return project.get('image_url', '') if project else ''
    
    images = project.get('images', {})
    if not images:
        return project.get('image_url', '')
    
    if image_name:
        return images.get(image_name, '')
    
    # Return first image if no specific name requested
    return list(images.values())[0] if images else ''


@register.filter
def get_project_image_name(project, index=0):
    """
    Get the name of an image at a specific index.
    
    Usage:
    {{ project|get_project_image_name:0 }}  # Returns first image name
    {{ project|get_project_image_name:1 }}  # Returns second image name
    """
    if not project or 'images' not in project:
        return project.get('img_name', '') if project else ''
    
    images = project.get('images', {})
    if not images:
        return project.get('img_name', '')
    
    image_names = list(images.keys())
    if 0 <= index < len(image_names):
        return image_names[index]
    
    return ''


@register.inclusion_tag('projects/partials/project_image_gallery.html')
def project_image_gallery(project, class_name=""):
    """
    Render a gallery of all project images with Mac-style styling.
    
    Usage:
    {% project_image_gallery project "gallery-class" %}
    """
    images = []
    if project and 'images' in project:
        for name, url in project['images'].items():
            images.append({
                'name': name,
                'url': url,
                'alt': f"{project.get('title', '')} - {name}"
            })
    
    return {
        'images': images,
        'project': project,
        'class_name': class_name
    }


@register.filter
def project_image_count(project):
    """
    Get the number of images in the project.
    
    Usage:
    {{ project|project_image_count }}
    """
    if project and 'images' in project:
        return len(project['images'])
    return 1 if project and project.get('image_url') else 0


@register.filter
def has_multiple_images(project):
    """
    Check if project has multiple images.
    
    Usage:
    {% if project|has_multiple_images %}...{% endif %}
    """
    if project and 'images' in project:
        return len(project['images']) > 1
    return False
