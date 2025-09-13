# Data App Documentation

## Overview

The Data app implements the revolutionary **Individual File System (IFS)** - a groundbreaking approach to content management where each blog post and project exists as a separate Python file. This system provides superior maintainability, version control, and performance compared to traditional database-driven approaches.

## Table of Contents

- [Individual File System Architecture](#individual-file-system-architecture)
- [App Structure](#app-structure)
- [Content Manager System](#content-manager-system)
- [File Organization](#file-organization)
- [Data Service Layer](#data-service-layer)
- [Content Creation Guide](#content-creation-guide)
- [Data Validation and Processing](#data-validation-and-processing)
- [Caching Mechanisms](#caching-mechanisms)
- [Migration from Database](#migration-from-database)
- [Best Practices](#best-practices)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Individual File System Architecture

### Revolutionary Concept

Instead of storing content in a traditional database, the Individual File System stores each piece of content as a separate Python file:

```txt
apps/data/content/
├── blog/                  # Individual blog files
│   ├── blog-1.py         # "Python 101: Your Chill Guide"
│   ├── blog-2.py         # "Django Web App Development"
│   ├── blog-3.py         # "Git & GitHub Mastery"
│   └── ...
├── projects/             # Individual project files
│   ├── project-1.py      # Portfolio website
│   ├── project-2.py      # E-commerce platform
│   ├── project-3.py      # Data analytics tool
│   └── ...
├── blog_index.py         # Blog file index and loader
└── projects_index.py     # Project file index and loader
```

### Benefits of Individual Files

#### Version Control Excellence
- **Individual history**: Each content piece has its own Git history
- **Granular changes**: Track changes at content level
- **Collaboration**: Multiple developers can work on different content simultaneously
- **Rollback capability**: Easy rollback of individual content pieces

#### Maintainability Advantages
- **Direct editing**: Edit content directly in code editors
- **Syntax highlighting**: Full Python syntax support
- **Structure validation**: Python syntax ensures data structure integrity
- **IDE support**: Full IDE features (autocomplete, error detection)

#### Performance Benefits
- **Efficient loading**: Load only required content
- **Caching friendly**: Individual file caching strategies
- **Parallel processing**: Load multiple files concurrently
- **Memory efficiency**: No database connection overhead

#### Development Workflow
- **No migrations**: Content changes don't require database migrations
- **Instant deployment**: Content updates deploy with code
- **Environment consistency**: Content identical across all environments
- **Backup simplicity**: Content backed up with code repository

## App Structure

```txt
apps/data/
├── __init__.py
├── apps.py
├── content_manager.py     # Central content controller
├── about_manager.py       # About data management
├── data_service.py       # Service layer for data access
├── about/                # Personal information files
│   ├── about_data.py     # Basic personal info
│   ├── experiences_data.py # Work experience
│   ├── education_data.py  # Educational background
│   ├── certifications_data.py # Certifications
│   ├── skills_data.py    # Technical skills
│   ├── awards_data.py    # Awards and recognition
│   └── applications_data.py # Created applications
├── privacy/              # Privacy policy data
│   └── privacy_policy_data.py
└── content/              # Blog and project content
    ├── __init__.py
    ├── blog_index.py     # Blog file manager
    ├── projects_index.py # Project file manager
    ├── blog/             # Individual blog files
    │   ├── blog-1.py
    │   ├── blog-2.py
    │   └── ...
    └── projects/         # Individual project files
        ├── project-1.py
        ├── project-2.py
        └── ...
```

## Content Manager System

### ContentManager Class

The central coordinator for all content operations:

```python
# apps/data/content_manager.py
class ContentManager:
    """
    Central data manager that loads data from individual files.
    """
    
    @classmethod
    def get_blogs(cls):
        """Get all blog data from individual files."""
        from .content.blog_index import BlogDataIndex
        return BlogDataIndex.load_all_blogs()
    
    @classmethod
    def get_projects(cls):
        """Get all project data from individual files."""
        from .content.projects_index import ProjectsDataIndex
        return ProjectsDataIndex.load_all_projects()
    
    @classmethod
    def get_blog_by_id(cls, blog_id):
        """Get a specific blog by ID."""
        blogs = cls.get_blogs()
        for blog in blogs:
            if blog.get('id') == blog_id:
                return blog
        return None
    
    @classmethod
    def get_project_by_id(cls, project_id):
        """Get a specific project by ID."""
        projects = cls.get_projects()
        for project in projects:
            if project.get('id') == project_id:
                return project
        return None
    
    @classmethod
    def get_featured_blogs(cls, limit=None):
        """Get featured blog posts."""
        blogs = cls.get_blogs()
        featured = [blog for blog in blogs if blog.get('is_featured', False)]
        
        if limit:
            featured = featured[:limit]
            
        return featured
    
    @classmethod
    def get_featured_projects(cls, limit=None):
        """Get featured projects."""
        projects = cls.get_projects()
        featured = [project for project in projects if project.get('featured', False)]
        
        if limit:
            featured = featured[:limit]
            
        return featured
```

### AboutManager Class

Manages personal and professional information:

```python
# apps/data/about_manager.py
class AboutManager:
    """
    Central about data manager that loads data from individual files.
    """
    
    @classmethod
    def get_about_data(cls):
        """Get about data."""
        from .about.about_data import AboutData
        about_data = AboutData.get_about_data()
        return about_data if about_data else None
    
    @classmethod
    def get_experiences(cls, current_only=False):
        """Get experience data with optional filtering for current positions."""
        from .about.experiences_data import ExperiencesData
        experiences = ExperiencesData.experiences
        
        if current_only:
            experiences = [exp for exp in experiences if exp.get('is_current')]
            
        return experiences
    
    @classmethod
    def get_education(cls, last_only=False):
        """Get education data with optional filtering for most recent."""
        from .about.education_data import EducationData
        education = EducationData.education
        
        if last_only:
            education = [edu for edu in education if edu.get('is_last')]
            
        return education
```

## File Organization

### Blog Index System

```python
# apps/data/content/blog_index.py
import importlib
import logging

logger = logging.getLogger(__name__)

class BlogDataIndex:
    """
    Index and loader for individual blog files.
    Manages dynamic loading of blog content from separate Python files.
    """
    
    @staticmethod
    def load_all_blogs():
        """Dynamically load all blog data from individual files."""
        blogs = []
        
        # List of blog files (manually maintained for control)
        blog_files = [
            'blog-1',   # Python 101: Your Chill Guide
            'blog-2',   # Django Web App Development
            'blog-3',   # Git & GitHub Mastery
            'blog-4',   # React Fundamentals
            'blog-5',   # API Development Best Practices
            'blog-6',   # Database Design Principles
            'blog-7',   # Docker Containerization
            'blog-8',   # Cloud Deployment Strategies
            'blog-9',   # Testing Best Practices
            'blog-10',  # Performance Optimization
            'blog-11',  # Security Implementation
            'blog-12',  # Mobile Development
            'blog-13',  # DevOps Automation
            'blog-14',  # AI/ML Integration
        ]
        
        for blog_file in blog_files:
            try:
                # Dynamic import of blog file
                module_name = f'apps.data.content.blog.{blog_file}'
                module = importlib.import_module(module_name)
                
                # Extract blog data from module
                if hasattr(module, 'blog_data'):
                    blog_data = module.blog_data
                    
                    # Validate required fields
                    if cls._validate_blog_data(blog_data):
                        blogs.append(blog_data)
                    else:
                        logger.warning(f'Invalid blog data structure in {blog_file}')
                else:
                    logger.warning(f'No blog_data found in {blog_file}')
                    
            except ImportError as e:
                logger.warning(f'Blog file {blog_file} not found: {e}')
            except Exception as e:
                logger.error(f'Error loading {blog_file}: {e}')
        
        # Sort blogs by ID (descending)
        blogs.sort(key=lambda x: x.get('id', 0), reverse=True)
        
        return blogs
    
    @staticmethod
    def _validate_blog_data(blog_data):
        """Validate blog data structure."""
        required_fields = ['id', 'title', 'description', 'content']
        return all(field in blog_data for field in required_fields)
```

### Project Index System

```python
# apps/data/content/projects_index.py
class ProjectsDataIndex:
    """
    Index and loader for individual project files.
    """
    
    @staticmethod
    def load_all_projects():
        """Dynamically load all project data from individual files."""
        projects = []
        
        # List of project files
        project_files = [
            'project-1',   # Portfolio Website
            'project-2',   # E-commerce Platform
            'project-3',   # Task Management App
            'project-4',   # Data Analytics Tool
            'project-5',   # Social Media Dashboard
            # ... more projects
        ]
        
        for project_file in project_files:
            try:
                module_name = f'apps.data.content.projects.{project_file}'
                module = importlib.import_module(module_name)
                
                if hasattr(module, 'project_data'):
                    project_data = module.project_data
                    
                    if cls._validate_project_data(project_data):
                        projects.append(project_data)
                    else:
                        logger.warning(f'Invalid project data in {project_file}')
                        
            except ImportError as e:
                logger.warning(f'Project file {project_file} not found: {e}')
            except Exception as e:
                logger.error(f'Error loading {project_file}: {e}')
        
        # Sort projects: featured first, then by ID
        projects.sort(key=lambda x: (not x.get('featured', False), -x.get('id', 0)))
        
        return projects
    
    @staticmethod
    def _validate_project_data(project_data):
        """Validate project data structure."""
        required_fields = ['id', 'title', 'description']
        return all(field in project_data for field in required_fields)
```

## Data Service Layer

### DataService Class

Provides a clean interface for data access across the application:

```python
# apps/data/data_service.py
import logging
from typing import List, Dict, Any, Optional
from django.core.cache import cache

from apps.data.content_manager import ContentManager
from apps.data.about_manager import AboutManager

logger = logging.getLogger(__name__)

class DataService:
    """
    Centralized service for accessing portfolio data with consistent patterns.
    Provides caching, sorting, and filtering capabilities.
    """
    
    @staticmethod
    def get_about_data() -> Optional[Dict[str, Any]]:
        """Get about data with error handling."""
        try:
            return AboutManager.get_about_data()
        except Exception as e:
            logger.error(f"Error fetching about data: {e}")
            return None
            
    @staticmethod
    def get_blogs(sort_by_id: bool = True, featured_only: bool = False) -> List[Dict[str, Any]]:
        """Get blog data with optional sorting and filtering."""
        try:
            blogs = ContentManager.get_blogs()
            
            if featured_only:
                blogs = [blog for blog in blogs if blog.get('is_featured')]
            
            if sort_by_id:
                blogs = sorted(blogs, key=lambda x: -x.get('id', 0))
                
            return blogs
        except Exception as e:
            logger.error(f"Error fetching blog data: {e}")
            return []
            
    @staticmethod
    def get_projects(sort_by_featured: bool = True) -> List[Dict[str, Any]]:
        """Get project data with optional sorting by featured status."""
        try:
            projects = ContentManager.get_projects()
            
            if sort_by_featured:
                # Sort by featured status, then by ID
                projects = sorted(
                    projects,
                    key=lambda x: (not x.get('featured', False), -x.get('id', 0))
                )
                
            return projects
        except Exception as e:
            logger.error(f"Error fetching project data: {e}")
            return []
    
    @staticmethod
    def get_experiences(current_only: bool = False) -> List[Dict[str, Any]]:
        """Get experience data."""
        try:
            return AboutManager.get_experiences(current_only=current_only)
        except Exception as e:
            logger.error(f"Error fetching experience data: {e}")
            return []
    
    @staticmethod
    def get_education(last_only: bool = False) -> List[Dict[str, Any]]:
        """Get education data."""
        try:
            return AboutManager.get_education(last_only=last_only)
        except Exception as e:
            logger.error(f"Error fetching education data: {e}")
            return []
    
    @staticmethod
    def get_certifications() -> List[Dict[str, Any]]:
        """Get certification data."""
        try:
            return AboutManager.get_certifications()
        except Exception as e:
            logger.error(f"Error fetching certification data: {e}")
            return []
    
    @staticmethod
    def get_skills() -> List[Dict[str, Any]]:
        """Get skills data - only returns skills with valid icon_svg."""
        try:
            return AboutManager.get_skills()
        except Exception as e:
            logger.error(f"Error fetching skills data: {e}")
            return []
    
    @staticmethod
    def get_awards() -> List[Dict[str, Any]]:
        """Get awards data."""
        try:
            return AboutManager.get_awards()
        except Exception as e:
            logger.error(f"Error fetching awards data: {e}")
            return []
    
    @staticmethod
    def get_applications() -> List[Dict[str, Any]]:
        """Get applications data."""
        try:
            return AboutManager.get_applications()
        except Exception as e:
            logger.error(f"Error fetching applications data: {e}")
            return []
    
    @staticmethod
    def get_privacy_policy() -> Optional[Dict[str, Any]]:
        """Get privacy policy data."""
        try:
            return AboutManager.get_privacy_policy()
        except Exception as e:
            logger.error(f"Error fetching privacy policy: {e}")
            return None
```

## Content Creation Guide

### Creating a New Blog Post

#### Step 1: Create the Blog File

```python
# apps/data/content/blog/blog-15.py
from datetime import datetime
from django.conf import settings

blog_data = {
    "id": 15,
    "title": "Advanced Python Patterns for Web Development",
    "description": "Explore advanced Python design patterns and techniques that will elevate your web development skills to the next level.",
    "images": {
        "main-hero.webp": f"{settings.BLOG_BASE_IMG_URL}/blog-15/main-hero.webp",
        "pattern-diagram.webp": f"{settings.BLOG_BASE_IMG_URL}/blog-15/pattern-diagram.webp",
        "code-example.webp": f"{settings.BLOG_BASE_IMG_URL}/blog-15/code-example.webp",
    },
    "created_at": datetime.strptime("2024-03-15T09:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2024-03-15T09:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "author": "Ridwan Hall",
    "username": "ridwaanhall",
    "author_image": f"{settings.BASE_URL}/static/img/author/ridwaanhall_20250913_2.webp",
    "is_featured": True,
    "tags": ["python", "design-patterns", "web-development", "advanced", "architecture"],
    "category": "Web Development",
    "reading_time": "12 min read",
    "content": [
        {
            "type": "h2",
            "text": "Introduction to Python Design Patterns"
        },
        {
            "type": "p",
            "class": "mb-4 text-gray-700",
            "text": "Design patterns are reusable solutions to common problems in software design. In web development, understanding and applying these patterns can significantly improve code maintainability and scalability."
        },
        {
            "type": "img",
            "src": "pattern-diagram.webp",
            "alt": "Python design patterns diagram",
            "class": "w-full rounded-lg shadow-md my-6"
        },
        {
            "type": "h3",
            "text": "The Singleton Pattern in Django"
        },
        {
            "type": "code",
            "language": "python",
            "code": '''
class DatabaseManager:
    _instance = None
    _connection = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_connection(self):
        if self._connection is None:
            self._connection = self._create_connection()
        return self._connection
    
    def _create_connection(self):
        # Database connection logic here
        pass

# Usage
db_manager = DatabaseManager()
connection = db_manager.get_connection()
            '''
        },
        {
            "type": "h3",
            "text": "Factory Pattern for Model Creation"
        },
        {
            "type": "code",
            "language": "python",
            "code": '''
class ContentFactory:
    @staticmethod
    def create_content(content_type, **kwargs):
        if content_type == 'blog':
            return BlogContent(**kwargs)
        elif content_type == 'project':
            return ProjectContent(**kwargs)
        elif content_type == 'page':
            return PageContent(**kwargs)
        else:
            raise ValueError(f"Unknown content type: {content_type}")

# Usage
blog = ContentFactory.create_content('blog', title='My Blog', content='...')
project = ContentFactory.create_content('project', title='My Project', description='...')
            '''
        },
        {
            "type": "blockquote",
            "text": "Good code is like a good joke - it needs no explanation, but when you understand it, you appreciate its elegance.",
            "author": "Ridwan Hall"
        }
    ]
}
```

#### Step 2: Update Blog Index

```python
# In apps/data/content/blog_index.py
blog_files = [
    'blog-1', 'blog-2', 'blog-3', 'blog-4', 'blog-5',
    'blog-6', 'blog-7', 'blog-8', 'blog-9', 'blog-10',
    'blog-11', 'blog-12', 'blog-13', 'blog-14',
    'blog-15',  # Add new blog file here
]
```

### Creating a New Project

#### Step 1: Create the Project File

```python
# apps/data/content/projects/project-25.py
from django.conf import settings

project_data = {
    "id": 25,
    "title": "AI-Powered Task Management Platform",
    "headline": "Intelligent task prioritization with machine learning",
    "description": [
        "Revolutionary task management platform that uses artificial intelligence to automatically prioritize tasks, predict completion times, and optimize team workflows.",
        "Features smart scheduling, resource allocation, and performance analytics to boost productivity by up to 40%."
    ],
    "features": [
        {
            "title": "AI Task Prioritization",
            "description": "Machine learning algorithms analyze task importance and urgency automatically"
        },
        {
            "title": "Predictive Analytics",
            "description": "Accurate completion time predictions based on historical data"
        },
        {
            "title": "Team Collaboration",
            "description": "Real-time collaboration tools with smart notification system"
        },
        {
            "title": "Performance Insights",
            "description": "Comprehensive analytics dashboard with actionable insights"
        }
    ],
    "tech_stack": [
        {
            "name": "Python",
            "description": "Backend development with Django framework",
            "icon_svg": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg"
        },
        {
            "name": "TensorFlow",
            "description": "Machine learning model development",
            "icon_svg": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg"
        },
        {
            "name": "React",
            "description": "Modern frontend interface",
            "icon_svg": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg"
        },
        {
            "name": "PostgreSQL",
            "description": "Robust database management",
            "icon_svg": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg"
        }
    ],
    "images": {
        "main_image": f"{settings.PROJECT_BASE_IMG_URL}/project-25/main-dashboard.webp",
        "gallery": [
            f"{settings.PROJECT_BASE_IMG_URL}/project-25/task-board.webp",
            f"{settings.PROJECT_BASE_IMG_URL}/project-25/analytics-dashboard.webp",
            f"{settings.PROJECT_BASE_IMG_URL}/project-25/mobile-interface.webp"
        ]
    },
    "github_url": "https://github.com/ridwaanhall/ai-task-management",
    "demo_url": "https://ai-tasks.ridwaanhall.com",
    "case_study_url": None,
    "status": "completed",
    "featured": True,
    "category": "Artificial Intelligence",
    "tags": ["ai", "machine-learning", "task-management", "productivity", "django", "react"],
    "created_at": None,
    "completion_date": "2024-02",
}
```

#### Step 2: Update Project Index

```python
# In apps/data/content/projects_index.py
project_files = [
    'project-1', 'project-2', 'project-3', 'project-4', 'project-5',
    # ... existing projects
    'project-25',  # Add new project file here
]
```

## Data Validation and Processing

### Content Validation System

```python
# apps/data/validators.py
import logging
from datetime import datetime
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class ContentValidator:
    """Validator for Individual File System content."""
    
    @staticmethod
    def validate_blog_data(blog_data: Dict[str, Any]) -> bool:
        """Validate blog data structure and content."""
        required_fields = [
            'id', 'title', 'description', 'content',
            'created_at', 'author', 'username'
        ]
        
        # Check required fields
        for field in required_fields:
            if field not in blog_data:
                logger.error(f"Missing required field in blog: {field}")
                return False
        
        # Validate data types
        if not isinstance(blog_data['id'], int):
            logger.error("Blog ID must be an integer")
            return False
        
        if not isinstance(blog_data['content'], list):
            logger.error("Blog content must be a list")
            return False
        
        if blog_data.get('created_at') and not isinstance(blog_data['created_at'], datetime):
            logger.error("Blog created_at must be a datetime object")
            return False
        
        # Validate content structure
        return ContentValidator._validate_content_structure(blog_data['content'])
    
    @staticmethod
    def validate_project_data(project_data: Dict[str, Any]) -> bool:
        """Validate project data structure and content."""
        required_fields = ['id', 'title', 'description']
        
        for field in required_fields:
            if field not in project_data:
                logger.error(f"Missing required field in project: {field}")
                return False
        
        # Validate tech stack if present
        if 'tech_stack' in project_data:
            if not isinstance(project_data['tech_stack'], list):
                logger.error("Project tech_stack must be a list")
                return False
        
        return True
    
    @staticmethod
    def _validate_content_structure(content: List[Dict[str, Any]]) -> bool:
        """Validate blog content structure."""
        for item in content:
            if not isinstance(item, dict):
                logger.error("Content item must be a dictionary")
                return False
            
            if 'type' not in item:
                logger.error("Content item must have a 'type' field")
                return False
            
            content_type = item['type']
            
            # Validate specific content types
            if content_type in ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                if 'text' not in item:
                    logger.error(f"Content type '{content_type}' requires 'text' field")
                    return False
            
            elif content_type == 'img':
                if 'src' not in item or 'alt' not in item:
                    logger.error("Image content requires 'src' and 'alt' fields")
                    return False
            
            elif content_type == 'code':
                if 'code' not in item:
                    logger.error("Code content requires 'code' field")
                    return False
        
        return True
```

### Data Processing Utilities

```python
# apps/data/processors.py
from django.utils.text import slugify
from django.utils.html import strip_tags
import re

class ContentProcessor:
    """Process and enhance content data."""
    
    @staticmethod
    def process_blog_data(blog_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process blog data for display."""
        processed_data = blog_data.copy()
        
        # Generate slug from title
        processed_data['slug'] = slugify(blog_data['title'])
        
        # Calculate reading time
        if 'reading_time' not in processed_data:
            processed_data['reading_time'] = ContentProcessor._calculate_reading_time(blog_data)
        
        # Generate excerpt
        if 'excerpt' not in processed_data:
            processed_data['excerpt'] = ContentProcessor._generate_excerpt(blog_data)
        
        # Process images
        if 'images' in processed_data:
            processed_data['main_image'] = ContentProcessor._get_main_image(processed_data['images'])
        
        return processed_data
    
    @staticmethod
    def process_project_data(project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process project data for display."""
        processed_data = project_data.copy()
        
        # Generate slug from title
        processed_data['slug'] = slugify(project_data['title'])
        
        # Process description for excerpt
        if isinstance(processed_data['description'], list):
            processed_data['excerpt'] = processed_data['description'][0][:200] + "..."
        else:
            processed_data['excerpt'] = processed_data['description'][:200] + "..."
        
        return processed_data
    
    @staticmethod
    def _calculate_reading_time(blog_data: Dict[str, Any]) -> str:
        """Calculate estimated reading time."""
        word_count = 0
        
        # Count words in content
        for item in blog_data.get('content', []):
            if item.get('type') in ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                text = strip_tags(item.get('text', ''))
                word_count += len(text.split())
            elif item.get('type') == 'code':
                # Code blocks are read slower
                code_text = item.get('code', '')
                word_count += len(code_text.split()) * 0.5
        
        # Average reading speed: 200 words per minute
        reading_minutes = max(1, round(word_count / 200))
        return f"{reading_minutes} min read"
    
    @staticmethod
    def _generate_excerpt(blog_data: Dict[str, Any]) -> str:
        """Generate excerpt from blog content."""
        for item in blog_data.get('content', []):
            if item.get('type') == 'p':
                text = strip_tags(item.get('text', ''))
                return text[:200] + "..." if len(text) > 200 else text
        
        return blog_data.get('description', '')[:200] + "..."
    
    @staticmethod
    def _get_main_image(images: Dict[str, str]) -> str:
        """Get main image from images dictionary."""
        # Priority order for main image
        priority_keys = ['main-hero.webp', 'hero.webp', 'main.webp']
        
        for key in priority_keys:
            if key in images:
                return images[key]
        
        # Return first image if no priority match
        return next(iter(images.values())) if images else ""
```

## Caching Mechanisms

### Content Caching Strategy

```python
# apps/data/cache.py
from django.core.cache import cache
from django.conf import settings
import hashlib
import json

class ContentCache:
    """Caching utilities for Individual File System content."""
    
    CACHE_TIMEOUT = getattr(settings, 'CONTENT_CACHE_TIMEOUT', 3600)  # 1 hour
    
    @staticmethod
    def get_blogs_cache_key():
        """Get cache key for all blogs."""
        return 'ifs_blogs_all'
    
    @staticmethod
    def get_projects_cache_key():
        """Get cache key for all projects."""
        return 'ifs_projects_all'
    
    @staticmethod
    def get_blog_cache_key(blog_id: int):
        """Get cache key for specific blog."""
        return f'ifs_blog_{blog_id}'
    
    @staticmethod
    def get_project_cache_key(project_id: int):
        """Get cache key for specific project."""
        return f'ifs_project_{project_id}'
    
    @classmethod
    def cache_blogs(cls, blogs: list):
        """Cache all blogs data."""
        cache_key = cls.get_blogs_cache_key()
        cache.set(cache_key, blogs, cls.CACHE_TIMEOUT)
        
        # Cache individual blogs
        for blog in blogs:
            blog_cache_key = cls.get_blog_cache_key(blog['id'])
            cache.set(blog_cache_key, blog, cls.CACHE_TIMEOUT)
    
    @classmethod
    def get_cached_blogs(cls):
        """Get cached blogs data."""
        cache_key = cls.get_blogs_cache_key()
        return cache.get(cache_key)
    
    @classmethod
    def cache_projects(cls, projects: list):
        """Cache all projects data."""
        cache_key = cls.get_projects_cache_key()
        cache.set(cache_key, projects, cls.CACHE_TIMEOUT)
        
        # Cache individual projects
        for project in projects:
            project_cache_key = cls.get_project_cache_key(project['id'])
            cache.set(project_cache_key, project, cls.CACHE_TIMEOUT)
    
    @classmethod
    def get_cached_projects(cls):
        """Get cached projects data."""
        cache_key = cls.get_projects_cache_key()
        return cache.get(cache_key)
    
    @classmethod
    def invalidate_content_cache(cls):
        """Invalidate all content caches."""
        cache.delete_many([
            cls.get_blogs_cache_key(),
            cls.get_projects_cache_key()
        ])
    
    @staticmethod
    def generate_content_hash(content: dict) -> str:
        """Generate hash for content to detect changes."""
        content_str = json.dumps(content, sort_keys=True, default=str)
        return hashlib.md5(content_str.encode()).hexdigest()
```

### Enhanced Content Manager with Caching

```python
# Enhanced ContentManager with caching
class ContentManager:
    """Enhanced content manager with caching support."""
    
    @classmethod
    def get_blogs(cls):
        """Get all blog data with caching."""
        # Try to get from cache first
        cached_blogs = ContentCache.get_cached_blogs()
        if cached_blogs:
            return cached_blogs
        
        # Load from files if not cached
        from .content.blog_index import BlogDataIndex
        blogs = BlogDataIndex.load_all_blogs()
        
        # Process and cache the blogs
        processed_blogs = [ContentProcessor.process_blog_data(blog) for blog in blogs]
        ContentCache.cache_blogs(processed_blogs)
        
        return processed_blogs
    
    @classmethod
    def get_projects(cls):
        """Get all project data with caching."""
        # Try to get from cache first
        cached_projects = ContentCache.get_cached_projects()
        if cached_projects:
            return cached_projects
        
        # Load from files if not cached
        from .content.projects_index import ProjectsDataIndex
        projects = ProjectsDataIndex.load_all_projects()
        
        # Process and cache the projects
        processed_projects = [ContentProcessor.process_project_data(project) for project in projects]
        ContentCache.cache_projects(processed_projects)
        
        return processed_projects
```

## Migration from Database

### Database to Individual Files Migration

For those migrating from a traditional database-driven system:

#### Step 1: Export Database Content

```python
# migration_scripts/export_from_db.py
import json
from datetime import datetime
from django.core.management.base import BaseCommand
from your_old_app.models import BlogPost, Project

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Export blog posts
        self.export_blog_posts()
        
        # Export projects
        self.export_projects()
    
    def export_blog_posts(self):
        """Export blog posts from database to JSON."""
        blog_posts = BlogPost.objects.all().order_by('id')
        
        for post in blog_posts:
            blog_data = {
                "id": post.id,
                "title": post.title,
                "description": post.meta_description or post.content[:200],
                "content": self.convert_html_to_structure(post.content),
                "created_at": post.created_at.isoformat(),
                "updated_at": post.updated_at.isoformat(),
                "author": post.author.get_full_name(),
                "username": post.author.username,
                "is_featured": post.is_featured,
                "tags": [tag.name for tag in post.tags.all()],
                "category": post.category.name if post.category else "",
            }
            
            # Save as Python file
            self.save_blog_file(post.id, blog_data)
    
    def convert_html_to_structure(self, html_content):
        """Convert HTML content to structured format."""
        # Implementation to parse HTML and convert to structured format
        # This is a simplified example
        from bs4 import BeautifulSoup
        
        soup = BeautifulSoup(html_content, 'html.parser')
        structured_content = []
        
        for element in soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'pre']):
            if element.name in ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                structured_content.append({
                    "type": element.name,
                    "text": element.get_text().strip(),
                    "class": "mb-4 text-gray-700" if element.name == 'p' else f"text-{self.get_heading_size(element.name)} font-bold mb-4"
                })
            elif element.name == 'img':
                structured_content.append({
                    "type": "img",
                    "src": element.get('src', ''),
                    "alt": element.get('alt', ''),
                    "class": "w-full rounded-lg shadow-md my-6"
                })
            elif element.name == 'pre':
                structured_content.append({
                    "type": "code",
                    "language": "python",  # Default or detect
                    "code": element.get_text().strip()
                })
        
        return structured_content
    
    def save_blog_file(self, blog_id, blog_data):
        """Save blog data as Python file."""
        file_content = f'''from datetime import datetime
from django.conf import settings

blog_data = {blog_data}
'''
        
        file_path = f'apps/data/content/blog/blog-{blog_id}.py'
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(file_content)
        
        self.stdout.write(f'Created {file_path}')
```

#### Step 2: Update Index Files

After creating individual files, update the index files to include all migrated content:

```python
# Update blog_index.py
blog_files = [f'blog-{i}' for i in range(1, max_blog_id + 1)]

# Update projects_index.py  
project_files = [f'project-{i}' for i in range(1, max_project_id + 1)]
```

#### Step 3: Validate Migration

```python
# validation_script.py
from apps.data.content_manager import ContentManager
from apps.data.validators import ContentValidator

def validate_migration():
    """Validate migrated content."""
    blogs = ContentManager.get_blogs()
    projects = ContentManager.get_projects()
    
    print(f"Loaded {len(blogs)} blogs")
    print(f"Loaded {len(projects)} projects")
    
    # Validate each blog
    for blog in blogs:
        if not ContentValidator.validate_blog_data(blog):
            print(f"Invalid blog: {blog.get('title', 'Unknown')}")
    
    # Validate each project
    for project in projects:
        if not ContentValidator.validate_project_data(project):
            print(f"Invalid project: {project.get('title', 'Unknown')}")
```

## Best Practices

### File Organization
1. **Consistent naming**: Use `blog-N.py` and `project-N.py` patterns
2. **Sequential IDs**: Maintain sequential ID numbering
3. **Descriptive comments**: Add file comments with content titles
4. **Index maintenance**: Keep index files updated and organized

### Content Structure
1. **Consistent data structure**: Follow established data schemas
2. **Required fields**: Always include required fields
3. **Data validation**: Validate content before deployment
4. **Image organization**: Use consistent image naming and structure

### Version Control
1. **Meaningful commits**: Use descriptive commit messages for content changes
2. **File-level tracking**: Leverage Git's file-level change tracking
3. **Content reviews**: Use pull requests for content review process
4. **Branch strategy**: Use feature branches for major content updates

### Performance Optimization
1. **Caching strategy**: Implement appropriate caching for content
2. **Lazy loading**: Load content only when needed
3. **Index optimization**: Keep index files efficient
4. **Memory management**: Consider memory usage for large content sets

### Development Workflow
1. **Content templates**: Create templates for new content creation
2. **Validation scripts**: Use validation scripts before deployment
3. **Testing procedures**: Test content loading and display
4. **Documentation**: Document content creation procedures

### Security Considerations
1. **Input validation**: Validate all content data
2. **XSS prevention**: Sanitize content for display
3. **File permissions**: Set appropriate file permissions
4. **Content review**: Review content before publication

## Performance Optimization

### Loading Optimization

```python
# Optimized content loading with async support
import asyncio
import concurrent.futures
from typing import List

class OptimizedContentManager:
    """Performance-optimized content manager."""
    
    @classmethod
    def load_content_parallel(cls, content_type: str) -> List[dict]:
        """Load content files in parallel."""
        if content_type == 'blogs':
            file_list = cls._get_blog_files()
            loader_func = cls._load_blog_file
        elif content_type == 'projects':
            file_list = cls._get_project_files()
            loader_func = cls._load_project_file
        else:
            raise ValueError(f"Unknown content type: {content_type}")
        
        # Load files in parallel using ThreadPoolExecutor
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            future_to_file = {
                executor.submit(loader_func, file_name): file_name 
                for file_name in file_list
            }
            
            content_items = []
            for future in concurrent.futures.as_completed(future_to_file):
                file_name = future_to_file[future]
                try:
                    content_data = future.result()
                    if content_data:
                        content_items.append(content_data)
                except Exception as e:
                    logger.error(f"Error loading {file_name}: {e}")
        
        return content_items
    
    @staticmethod
    def _load_blog_file(file_name: str) -> dict:
        """Load individual blog file."""
        try:
            module_name = f'apps.data.content.blog.{file_name}'
            module = importlib.import_module(module_name)
            return getattr(module, 'blog_data', None)
        except ImportError:
            return None
    
    @staticmethod
    def _load_project_file(file_name: str) -> dict:
        """Load individual project file."""
        try:
            module_name = f'apps.data.content.projects.{file_name}'
            module = importlib.import_module(module_name)
            return getattr(module, 'project_data', None)
        except ImportError:
            return None
```

### Memory Optimization

```python
# Memory-efficient content handling
class MemoryEfficientContentManager:
    """Memory-efficient content management."""
    
    @classmethod
    def get_content_iterator(cls, content_type: str):
        """Get iterator for content to save memory."""
        if content_type == 'blogs':
            file_list = cls._get_blog_files()
            loader_func = cls._load_blog_file
        else:
            file_list = cls._get_project_files()
            loader_func = cls._load_project_file
        
        for file_name in file_list:
            content = loader_func(file_name)
            if content:
                yield content
    
    @classmethod
    def get_paginated_content(cls, content_type: str, page: int, per_page: int):
        """Get paginated content without loading all data."""
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        content_items = []
        current_idx = 0
        
        for content in cls.get_content_iterator(content_type):
            if current_idx >= end_idx:
                break
            if current_idx >= start_idx:
                content_items.append(content)
            current_idx += 1
        
        return content_items
```

## Troubleshooting

### Common Issues

#### Import Errors
**Problem**: `ImportError` when loading content files
**Solution**:
1. Check file exists in correct directory
2. Verify Python syntax in content file
3. Ensure file is added to index

```bash
# Debug import issues
python manage.py shell
>>> import importlib
>>> module = importlib.import_module('apps.data.content.blog.blog-1')
>>> print(hasattr(module, 'blog_data'))
```

#### Data Structure Errors
**Problem**: Invalid data structure causing display issues
**Solution**:
1. Use validation scripts to check data structure
2. Verify all required fields are present
3. Check data types match expected format

#### Performance Issues
**Problem**: Slow content loading
**Solution**:
1. Implement caching for frequently accessed content
2. Use parallel loading for multiple files
3. Consider pagination for large content sets

#### Cache Problems
**Problem**: Content not updating despite file changes
**Solution**:
1. Clear content caches
2. Check cache timeout settings
3. Verify cache invalidation logic

### Debug Commands

```bash
# Test content loading
python manage.py shell
>>> from apps.data.content_manager import ContentManager
>>> blogs = ContentManager.get_blogs()
>>> print(f"Loaded {len(blogs)} blogs")

# Validate content
>>> from apps.data.validators import ContentValidator
>>> for blog in blogs[:3]:  # Check first 3 blogs
...     valid = ContentValidator.validate_blog_data(blog)
...     print(f"Blog {blog['id']}: {'Valid' if valid else 'Invalid'}")

# Test caching
>>> from apps.data.cache import ContentCache
>>> ContentCache.invalidate_content_cache()
>>> print("Cache cleared")
```

The Individual File System represents a revolutionary approach to content management, providing superior maintainability, version control capabilities, and performance compared to traditional database approaches. This system is particularly well-suited for developer portfolios, documentation sites, and content-focused applications where version control and direct content editing are valuable.