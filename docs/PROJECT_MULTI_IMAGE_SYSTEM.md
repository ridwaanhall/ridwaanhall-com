# Multi-Image System Documentation for Projects

## Overview

Projects now support multiple images with a Mac-style interface featuring window controls and filename display.

## Usage

### Single Image (Backward Compatible)

```python
project_data = {
    "images": {
        "main-screenshot.webp": f"{settings.PROJECT_BASE_IMG_URL}/main-screenshot.webp"
    }
}
```

### Multiple Images

```python
project_data = {
    "images": {
        "main-screenshot.webp": f"{settings.PROJECT_BASE_IMG_URL}/main-screenshot.webp",
        "dashboard-view.webp": f"{settings.PROJECT_BASE_IMG_URL}/dashboard-view.webp",
        "mobile-interface.webp": f"{settings.PROJECT_BASE_IMG_URL}/mobile-interface.webp"
    }
}
```

## Template Tags

### Loading Template Tags

```django
{% load project_tags %}
```

### Available Filters

- `{{ project|get_project_image }}` - Get first image URL
- `{{ project|get_project_image:"filename.webp" }}` - Get specific image URL
- `{{ project|get_project_image_name:0 }}` - Get image name by index
- `{{ project|project_image_count }}` - Get number of images
- `{{ project|has_multiple_images }}` - Check if project has multiple images

### Gallery Component

```django
{% project_image_gallery project %}
```

## Features

### Mac-Style Interface

- Red, yellow, green window control dots (top-left)
- Current filename display (top-right)
- Consistent with existing project design

### Navigation

- Left/Right arrow buttons
- Dot indicators at bottom
- Auto-play with 5-second intervals
- Pause on hover

### Responsive Design

- Mobile-friendly controls
- Aspect ratio maintained (16:9)
- Smooth transitions

## Backward Compatibility

- All existing projects continue to work
- Old `image_url` and `img_name` fields still available
- Automatic conversion from `images` dict to legacy fields
