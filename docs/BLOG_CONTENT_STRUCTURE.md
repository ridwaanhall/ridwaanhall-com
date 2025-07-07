# Blog Content Structure Documentation

## Overview

The blog system uses a structured content format that allows for rich, semantic HTML generation with proper styling and accessibility. Each blog post is defined as a Python file with structured content blocks.

## Blog Data Structure

### Complete Blog Data Format

```python
from datetime import datetime
from django.conf import settings

blog_data = {
    # Basic Information
    "id": 1,
    "title": "Blog Post Title",
    "description": "SEO-friendly description for meta tags and previews",
    "slug": "blog-post-url-slug",
    
    # Images (Multi-image support)
    "images": {
        "main-hero.webp": f"{settings.BLOG_BASE_IMG_URL}/main-hero.webp",
        "gallery-1.webp": f"{settings.BLOG_BASE_IMG_URL}/gallery-1.webp",
        "thumbnail.webp": f"{settings.BLOG_BASE_IMG_URL}/thumbnail.webp"
    },
    
    # Timestamps
    "created_at": datetime.strptime("2024-01-01T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2024-01-01T12:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    
    # Author Information
    "author": "Author Full Name",
    "username": "author_username",
    "author_image": f"{settings.BASE_URL}/static/img/author.webp",
    
    # Content Structure (New Format)
    "content": [
        # Content blocks here...
    ],
    
    # Metadata
    "is_featured": False,
    "tags": ["Tag1", "Tag2", "Tag3"],
    "category": "Category Name",
    "read_time": 5,  # estimated reading time in minutes
    "views": 0
}
```

## Content Structure

The `content` field is an array of content blocks, where each block has:

- `type`: The HTML element type
- `class`: CSS classes for styling
- `text`: The content text (for simple elements)
- `items`: Nested items (for lists)

### Supported Content Types

#### 1. Paragraphs

```python
{
    "type": "p",
    "class": "mb-4 text-sm md:text-base lg:text-lg",
    "text": "Your paragraph content with <strong>HTML tags</strong> and <em>formatting</em>."
}
```

#### 2. Headings

```python
# H2 - Main sections
{
    "type": "h2",
    "class": "text-xl md:text-2xl lg:text-3xl font-bold mb-4 mt-8",
    "text": "Main Section Title"
}

# H3 - Sub-sections
{
    "type": "h3",
    "class": "text-lg md:text-xl lg:text-2xl font-semibold mb-3 mt-6",
    "text": "Sub-section Title"
}
```

#### 3. Unordered Lists

```python
{
    "type": "ul",
    "class": "mb-4 pl-6 list-disc",
    "items": [
        {
            "type": "li",
            "class": "text-sm md:text-base lg:text-lg",
            "text": "First list item with <strong>formatting</strong>"
        },
        {
            "type": "li",
            "class": "text-sm md:text-base lg:text-lg",
            "text": "Second list item"
        }
    ]
}
```

#### 4. Code Blocks

```python
{
    "type": "pre",
    "class": "bg-zinc-800 p-3 rounded-lg mb-4 overflow-x-auto",
    "text": "<code class=\"language-python\">print('Hello, World!')\nfor i in range(5):\n    print(f'Number: {i}')</code>"
}
```

#### 5. Inline Code

Use within text content:

```python
{
    "type": "p",
    "class": "mb-4 text-sm md:text-base lg:text-lg",
    "text": "Use the <code class=\"px-1 py-0.5 bg-gray-100 rounded text-sm\">print()</code> function to output text."
}
```

### Content Type Reference

| Type | Usage | Required Fields | Optional Fields |
|------|-------|----------------|-----------------|
| `p` | Paragraphs | `type`, `class`, `text` | - |
| `h2` | Main headings | `type`, `class`, `text` | - |
| `h3` | Sub-headings | `type`, `class`, `text` | - |
| `ul` | Unordered lists | `type`, `class`, `items` | - |
| `li` | List items | `type`, `class`, `text` | - |
| `pre` | Code blocks | `type`, `class`, `text` | - |

## CSS Classes Reference

### Typography Classes

```css
/* Paragraphs */
"mb-4 text-sm md:text-base lg:text-lg"

/* Main headings (H2) */
"text-xl md:text-2xl lg:text-3xl font-bold mb-4 mt-8"

/* Sub-headings (H3) */
"text-lg md:text-xl lg:text-2xl font-semibold mb-3 mt-6"

/* Lists */
"mb-4 pl-6 list-disc"

/* List items */
"text-sm md:text-base lg:text-lg"

/* Code blocks */
"bg-zinc-800 p-3 rounded-lg mb-4 overflow-x-auto"

/* Inline code */
"px-1 py-0.5 bg-gray-100 rounded text-sm"
```

## HTML Output Examples

### Paragraph

```html
<p class="mb-4 text-sm md:text-base lg:text-lg">
    Your paragraph content with <strong>HTML tags</strong> and <em>formatting</em>.
</p>
```

### Heading

```html
<h2 class="text-xl md:text-2xl lg:text-3xl font-bold mb-4 mt-8">
    Main Section Title
</h2>
```

### List

```html
<ul class="mb-4 pl-6 list-disc">
    <li class="text-sm md:text-base lg:text-lg">First list item with <strong>formatting</strong></li>
    <li class="text-sm md:text-base lg:text-lg">Second list item</li>
</ul>
```

### Code Block

```html
<pre class="bg-zinc-800 p-3 rounded-lg mb-4 overflow-x-auto">
    <code class="language-python">print('Hello, World!')</code>
</pre>
```

## Template Usage

The content is rendered in the blog detail template using:

```django
{% for item in blog.content %}
    {% if item.type == "p" %}
        <p class="{{ item.class }}">{{ item.text|safe }}</p>
    {% elif item.type == "h2" %}
        <h2 class="{{ item.class }}">{{ item.text|safe }}</h2>
    {% elif item.type == "h3" %}
        <h3 class="{{ item.class }}">{{ item.text|safe }}</h3>
    {% elif item.type == "ul" %}
        <ul class="{{ item.class }}">
            {% for list_item in item.items %}
                <li class="{{ list_item.class }}">{{ list_item.text|safe }}</li>
            {% endfor %}
        </ul>
    {% elif item.type == "pre" %}
        <pre class="{{ item.class }}">{{ item.text|safe }}</pre>
    {% endif %}
{% endfor %}
```

## Migration from Old Format

### Old Format (Deprecated)

```python
"content": "Plain text or HTML string content..."
```

### New Format (Current)

```python
"content": [
    {
        "type": "p",
        "class": "mb-4 text-sm md:text-base lg:text-lg",
        "text": "Structured content block..."
    }
]
```

## Best Practices

1. **Consistent Styling**: Use the predefined CSS classes for consistent design
2. **Semantic HTML**: Choose appropriate content types (h2 for main sections, h3 for subsections)
3. **Accessibility**: Proper heading hierarchy and meaningful content structure
4. **Responsive Design**: Classes include responsive breakpoints (sm, md, lg)
5. **Content Safety**: Use `|safe` filter only for trusted content
6. **SEO Optimization**: Proper heading structure helps with SEO

## Content Creation Tips

1. **Structure First**: Plan your content hierarchy before writing
2. **Use Lists**: Break down complex information into digestible lists
3. **Code Highlighting**: Use proper language classes for syntax highlighting
4. **Responsive Text**: Text scales appropriately across devices
5. **Visual Hierarchy**: Consistent spacing and typography create better readability

## File Naming Convention

Blog files should follow the pattern:

- `blog-1.py`, `blog-2.py`, etc.
- Each file contains one `blog_data` dictionary
- Files are auto-discovered by the content management system

## Example Complete Blog Post

```python
from datetime import datetime
from django.conf import settings

blog_data = {
    "id": 1,
    "title": "Getting Started with Python: A Beginner's Guide",
    "description": "Learn Python programming from scratch with practical examples and best practices for new developers.",
    "images": {
        "python-basics.webp": f"{settings.BLOG_BASE_IMG_URL}/python-basics.webp"
    },
    "created_at": datetime.strptime("2024-01-01T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2024-01-01T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "author": "John Doe",
    "username": "johndoe",
    "author_image": f"{settings.BASE_URL}/static/img/johndoe.webp",
    "content": [
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "Python is one of the most beginner-friendly programming languages, perfect for those starting their coding journey."
        },
        {
            "type": "h2",
            "class": "text-xl md:text-2xl lg:text-3xl font-bold mb-4 mt-8",
            "text": "Why Choose Python?"
        },
        {
            "type": "ul",
            "class": "mb-4 pl-6 list-disc",
            "items": [
                {
                    "type": "li",
                    "class": "text-sm md:text-base lg:text-lg",
                    "text": "<strong>Easy to read</strong>: Python's syntax is clean and intuitive"
                },
                {
                    "type": "li",
                    "class": "text-sm md:text-base lg:text-lg",
                    "text": "<strong>Versatile</strong>: Used for web development, data science, AI, and more"
                }
            ]
        },
        {
            "type": "h3",
            "class": "text-lg md:text-xl lg:text-2xl font-semibold mb-3 mt-6",
            "text": "Your First Python Program"
        },
        {
            "type": "pre",
            "class": "bg-zinc-800 p-3 rounded-lg mb-4 overflow-x-auto",
            "text": "<code class=\"language-python\">print(\"Hello, World!\")\nprint(\"Welcome to Python programming!\")</code>"
        }
    ],
    "is_featured": True,
    "tags": ["Python", "Programming", "Beginner", "Tutorial"],
    "category": "Programming",
    "read_time": 5,
    "views": 0,
    "slug": "getting-started-with-python-beginners-guide"
}
```

This structure provides a flexible, maintainable, and SEO-friendly approach to blog content management.
