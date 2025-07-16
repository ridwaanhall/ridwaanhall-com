# Blog Multi-Image System Documentation

## Overview

The blog system now supports multiple images per blog post using an enhanced `images` dictionary format. This provides backward compatibility while enabling rich image galleries. This documentation focuses specifically on the image system - for complete blog content structure including the new structured content format, see [BLOG_CONTENT_STRUCTURE.md](./BLOG_CONTENT_STRUCTURE.md).

## Image Data Structure

### New Format (Recommended)

```python
blog_data = {
    "images": {
        "main-hero.webp": f"{settings.BLOG_BASE_IMG_URL}/main-hero.webp",
        "gallery-1.webp": f"{settings.BLOG_BASE_IMG_URL}/gallery-1.webp", 
        "gallery-2.webp": f"{settings.BLOG_BASE_IMG_URL}/gallery-2.webp",
        "thumbnail.webp": f"{settings.BLOG_BASE_IMG_URL}/thumbnail.webp"
    },
    # ... other blog data
}
```

### Legacy Format (Still Supported)

```python
blog_data = {
    "image_url": f"{settings.BLOG_BASE_IMG_URL}/single-image.webp",
    "img_name": "single-image.webp",
    # ... other blog data
}
```

## Available Template Features

### 1. Backward Compatibility Fields

The system automatically generates these fields for existing templates:

- `{{ blog.image_url }}` - First image URL
- `{{ blog.img_name }}` - First image name
- `{{ blog.image_list }}` - List of all image URLs
- `{{ blog.image_names }}` - List of all image names
- `{{ blog.image_count }}` - Number of images

### 2. Template Tags

Load the template tags in your template:

```django
{% load blog_tags %}
```

#### Get Specific Image

```django
<!-- Get image by name -->
{{ blog|get_blog_image:"thumbnail.webp" }}

<!-- Get first image (default) -->
{{ blog|get_blog_image }}
```

#### Check Multiple Images

```django
{% if blog|has_multiple_images %}
    <p>This blog has {{ blog|blog_image_count }} images</p>
{% endif %}
```

#### Image Gallery

```django
<!-- Automatic gallery with thumbnails for multiple images -->
{% blog_image_gallery blog "custom-css-class" %}
```

### 3. Template Usage Examples

#### Basic Single Image (Current Templates)

```django
<img src="https://wsrv.nl/?url={{ blog.image_url }}" alt="{{ blog.title }}" />
```

#### Enhanced Multi-Image Support

```django
{% if blog|has_multiple_images %}
    {% blog_image_gallery blog "mb-4" %}
    <p>Gallery with {{ blog|blog_image_count }} images</p>
{% else %}
    <img src="https://wsrv.nl/?url={{ blog.image_url }}" alt="{{ blog.title }}" />
{% endif %}
```

#### Custom Image Handling

```django
{% for image_name in blog.image_names %}
    <img src="{{ blog|get_blog_image:image_name }}" alt="{{ blog.title }} - {{ image_name }}" />
{% endfor %}
```

## Gallery Features

### Single Image

- Displays as a standard responsive image
- Same behavior as before for backward compatibility

### Multiple Images

- Main image display with thumbnail strip below
- Click thumbnails to switch main image
- Responsive design with horizontal scroll for thumbnails
- Smooth transitions between images

## File Naming Conventions

Recommended image naming patterns:

- `main-hero.webp` - Primary/featured image
- `gallery-1.webp`, `gallery-2.webp` - Additional gallery images
- `thumbnail.webp` - Specific thumbnail if needed
- `diagram-1.webp` - Content-specific images

## Migration Guide

### For Existing Templates

No changes needed! The system maintains backward compatibility:

- `{{ blog.image_url }}` still works
- `{{ blog.img_name }}` still works

### For New Multi-Image Templates

1. Load the template tags: `{% load blog_tags %}`
2. Use conditional rendering:

   ```django
   {% if blog|has_multiple_images %}
       {% blog_image_gallery blog %}
   {% else %}
       <img src="https://wsrv.nl/?url={{ blog.image_url }}" alt="{{ blog.title }}" />
   {% endif %}
   ```

### For Blog Data Files

Update your blog data to use the new `images` format:

```python
# Old format
"image_url": f"{settings.BLOG_BASE_IMG_URL}/image.webp",
"img_name": "image.webp",

# New format  
"images": {
    "main.webp": f"{settings.BLOG_BASE_IMG_URL}/image.webp",
    # Add more images as needed
},
```

## Technical Implementation

The `BlogDataIndex.load_all_blogs()` method automatically:

1. Processes the `images` dictionary
2. Generates backward compatibility fields
3. Adds helper fields for template use
4. Maintains performance with minimal overhead

## SEO Considerations

- First image in the `images` dictionary is used for SEO meta tags
- All image URLs are preserved for schema markup
- Alt text is automatically generated from blog title and image name
