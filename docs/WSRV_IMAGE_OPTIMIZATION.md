# WSRV Image Optimization System

This document explains how to use and configure the WSRV image optimization system in FlexForge.

## Overview

The WSRV image optimization system provides a configurable way to optimize images using the [wsrv.nl](https://wsrv.nl) service. This system allows you to:

- Enable/disable WSRV optimization globally
- Automatically resize and optimize images
- Convert images to modern formats
- Maintain backward compatibility when disabled

## Configuration

### Environment Variable

Add the following to your `.env` file:

```env
# Enable/disable WSRV image optimization
WSRV_IMAGE_OPTIMIZATION=True   # Default: True
```

### Settings

The setting is automatically loaded in `settings.py`:

```python
WSRV_IMAGE_OPTIMIZATION = config('WSRV_IMAGE_OPTIMIZATION', default=True, cast=bool)
```

## Usage in Templates

### Loading the Template Tags

Add this to the top of your template:

```django
{% load image_filters %}
```

### Using the Filter

#### Basic Usage

```django
<!-- Without optimization parameters -->
<img src="{{ image_url|wsrv_image }}" alt="Image">

<!-- With width and height -->
<img src="{{ image_url|wsrv_image:'300x300' }}" alt="Image">

<!-- With width only -->
<img src="{{ image_url|wsrv_image:'300' }}" alt="Image">

<!-- With height only -->
<img src="{{ image_url|wsrv_image:'x300' }}" alt="Image">
```

#### Template Tag Usage

```django
<!-- More flexible usage -->
{% wsrv_img image_url width=300 height=300 %}
{% wsrv_img image_url width=300 %}
{% wsrv_img image_url height=300 format_type="webp" %}
```

### Examples from Current Templates

#### Blog Images

```django
<!-- Featured blog image -->
<img src="{{ blog.image_url|wsrv_image }}" alt="{{ blog.title }}">

<!-- Blog card image -->
<img src="{{ blog.image_url|wsrv_image:'300x300' }}" alt="{{ blog.title }}">

<!-- Author avatar -->
<img src="{{ blog.author_image|wsrv_image:'50x50' }}" alt="{{ blog.author }}">
```

#### Project Images

```django
<!-- Project thumbnail -->
<img src="{{ project.image_url|wsrv_image:'300x300' }}" alt="{{ project.title }}">

<!-- Tech stack icons -->
<img src="{{ tech.icon_svg|wsrv_image:'25x25' }}" alt="{{ tech.name }}">
```

#### Profile Images

```django
<!-- Profile photo -->
<img src="{{ about.image_url|wsrv_image:'100x100' }}" alt="{{ about.name }}">
```

## Python Usage

### Direct Function Calls

```python
from apps.core.image_utils import get_optimized_image_url, get_wsrv_status

# Basic optimization
optimized_url = get_optimized_image_url('https://example.com/image.jpg')

# With dimensions
optimized_url = get_optimized_image_url(
    'https://example.com/image.jpg', 
    width=300, 
    height=300
)

# With format conversion
optimized_url = get_optimized_image_url(
    'https://example.com/image.jpg', 
    width=300, 
    height=300, 
    format_type='webp'
)

# Check if WSRV is enabled
is_enabled = get_wsrv_status()
```

## Management Command

Use the management command to test and check WSRV configuration:

```bash
# Check current status
python manage.py wsrv_config --status

# Test URL optimization
python manage.py wsrv_config --test-url "https://example.com/image.jpg"

# Test with dimensions
python manage.py wsrv_config --test-url "https://example.com/image.jpg" --width 300 --height 300
```

## How It Works

### When WSRV_IMAGE_OPTIMIZATION = True (Default)

- Images are processed through wsrv.nl
- URLs are converted from: `https://example.com/image.jpg`
- To: `https://wsrv.nl/?url=https://example.com/image.jpg&w=300&h=300`

### When WSRV_IMAGE_OPTIMIZATION = False

- Images are returned as-is
- No processing or URL modification occurs
- Maintains full backward compatibility

## Supported WSRV Parameters

The system supports the following wsrv.nl parameters:

- `w` (width): Resize image width
- `h` (height): Resize image height  
- `output`: Convert to format (webp, jpg, png)

## Benefits

1. **Performance**: Automatic image optimization and resizing
2. **Bandwidth**: Reduced file sizes through compression
3. **Modern Formats**: Automatic WebP conversion when supported
4. **CDN**: Global CDN delivery through wsrv.nl
5. **Flexibility**: Easy to enable/disable globally
6. **Compatibility**: Graceful fallback when disabled

## Template Files Updated

The following template files have been updated to use the new WSRV system:

### Core Templates

- `templates/base_seo.html`
- `templates/sidebar.html`

### Blog Templates

- `apps/blog/templates/blog/blog.html`
- `apps/blog/templates/blog/latest-blogs.html`
- `apps/blog/templates/blog/partials/image_gallery.html`

### Project Templates

- `apps/projects/templates/projects/projects.html`
- `apps/projects/templates/projects/projects-detail.html`
- `apps/projects/templates/projects/partials/project_image_gallery.html`

## Migration from Hard-coded WSRV URLs

The system automatically replaces hard-coded WSRV URLs like:

```django
<!-- Old way -->
<img src="https://wsrv.nl/?url={{ image_url }}&w=300&h=300">

<!-- New way -->
<img src="{{ image_url|wsrv_image:'300x300' }}">
```

## Best Practices

1. **Use appropriate dimensions**: Don't over-optimize small images
2. **Test both modes**: Ensure your site works with WSRV enabled and disabled
3. **Monitor performance**: Check if WSRV improves your site's loading times
4. **Use WebP when possible**: Consider using `format_type="webp"` for modern browsers

## Troubleshooting

### Images not loading?

1. Check if WSRV_IMAGE_OPTIMIZATION is set correctly
2. Verify the original image URLs are accessible
3. Use the management command to test specific URLs

### Performance issues?

1. Try disabling WSRV temporarily: `WSRV_IMAGE_OPTIMIZATION=False`
2. Check if your original images are already optimized
3. Monitor network requests in browser dev tools

### Template errors?

1. Ensure `{% load image_filters %}` is at the top of your templates
2. Check that the core app is installed in INSTALLED_APPS
3. Verify template syntax is correct
