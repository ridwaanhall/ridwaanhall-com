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


STATUS_DISPLAY = {
    "planning_requirements": "Planning",
    "design": "Design",
    "development_in_progress": "In Development",
    "code_review": "Code Review",
    "testing_qa": "Testing",
    "deployment_released": "Released",
    "maintenance_support": "Maintenance",
    "completed": "Completed",
    "on_hold": "On Hold",
    "cancelled": "Cancelled",
    "reopened": "Reopened",
    "update_required": "Update Required",
}

STATUS_COLORS = {
    "planning_requirements": "bg-purple-400/90 text-purple-950",
    "design": "bg-violet-400/90 text-violet-950",
    "development_in_progress": "bg-blue-400/90 text-blue-950",
    "code_review": "bg-amber-400/90 text-amber-950",
    "testing_qa": "bg-orange-400/90 text-orange-950",
    "deployment_released": "bg-cyan-400/90 text-cyan-950",
    "maintenance_support": "bg-sky-400/90 text-sky-950",
    "completed": "bg-emerald-400/90 text-emerald-950",
    "on_hold": "bg-zinc-400/90 text-zinc-950",
    "cancelled": "bg-red-400/90 text-red-950",
    "reopened": "bg-yellow-400/90 text-yellow-950",
    "update_required": "bg-rose-400/90 text-rose-950",
}

STATUS_DOT_COLORS = {
    "planning_requirements": "bg-purple-400",
    "design": "bg-violet-400",
    "development_in_progress": "bg-blue-400",
    "code_review": "bg-amber-400",
    "testing_qa": "bg-orange-400",
    "deployment_released": "bg-cyan-400",
    "maintenance_support": "bg-sky-400",
    "completed": "bg-emerald-400",
    "on_hold": "bg-zinc-400",
    "cancelled": "bg-red-400",
    "reopened": "bg-yellow-400",
    "update_required": "bg-rose-400",
}


def _resolve_status(status):
    """Extract the plain status string, handling both enum members and raw strings."""
    if hasattr(status, 'value'):
        return status.value.lower()
    return str(status).lower()


@register.filter
def format_status(status):
    """
    Format a project status string for display.

    Usage:
    {{ project.status|format_status }}
    """
    if not status:
        return ""
    key = _resolve_status(status)
    return STATUS_DISPLAY.get(key, key.replace("_", " ").title())


@register.filter
def status_color(status):
    """
    Return Tailwind CSS classes for a project status badge.

    Usage:
    <span class="{{ project.status|status_color }}">...</span>
    """
    if not status:
        return "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
    return STATUS_COLORS.get(_resolve_status(status), "bg-zinc-500/20 text-zinc-300 border-zinc-500/30")


@register.filter
def status_dot_color(status):
    """
    Return Tailwind CSS class for the status indicator dot.

    Usage:
    <span class="{{ project.status|status_dot_color }}"></span>
    """
    if not status:
        return "bg-zinc-400"
    return STATUS_DOT_COLORS.get(_resolve_status(status), "bg-zinc-400")
