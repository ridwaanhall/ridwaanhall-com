"""
SEO Schema Generator
Handles structured data (JSON-LD) generation for search engines.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from django.utils.text import slugify
from .config import SEOConfig


class SEOSchemaGenerator:
    """Generate structured data for different content types."""
    
    @staticmethod
    def generate_person_schema(about_data: Dict) -> Dict:
        """Generate Person schema for about pages."""
        social_links = []
        social_media = about_data.get('social_media', {})
        
        for platform, url in social_media.items():
            if url:
                social_links.append(url)
        
        schema = SEOConfig.SCHEMA_TEMPLATES['person'].copy()
        schema.update({
            "name": about_data.get('name', ''),
            "url": SEOConfig.SITE_URL,
            "image": about_data.get('image_url', ''),
            "sameAs": social_links,
            "jobTitle": about_data.get('role', 'Software Developer'),
            "description": about_data.get('short_description', ''),
            "email": about_data.get('email', ''),
            "alumniOf": about_data.get('education', []),
            "knowsAbout": about_data.get('skills', [])
        })
        
        return schema
    
    @staticmethod
    def generate_website_schema() -> Dict:
        """Generate WebSite schema."""
        schema = SEOConfig.SCHEMA_TEMPLATES['website'].copy()
        schema.update({
            "potentialAction": {
                "@type": "SearchAction",
                "target": f"{SEOConfig.SITE_URL}/search?q={{search_term_string}}",
                "query-input": "required name=search_term_string"
            }
        })
        return schema
    
    @staticmethod
    def generate_blog_schema(about_data: Dict, blogs: List[Dict] = None) -> Dict:
        """Generate Blog schema for blog listing."""
        schema = SEOConfig.SCHEMA_TEMPLATES['blog'].copy()
        
        if blogs:
            blog_posts = []
            for blog in blogs[:10]:  # Limit to recent posts
                blog_post = {
                    "@type": "BlogPosting",
                    "headline": blog.get('title', ''),
                    "description": blog.get('description', ''),
                    "image": blog.get('image_url', ''),
                    "datePublished": blog.get('created_at', ''),
                    "dateModified": blog.get('updated_at', ''),
                    "author": {
                        "@type": "Person",
                        "name": about_data.get('name', ''),
                        "url": SEOConfig.SITE_URL
                    },
                    "url": f"{SEOConfig.SITE_URL}/blog/{slugify(blog.get('title', ''))}/",
                    "keywords": blog.get('tags', [])
                }
                blog_posts.append(blog_post)
            
            schema["blogPost"] = blog_posts
        
        return schema

    @staticmethod
    def generate_blog_posting_schema(blog_data: Dict, about_data: Dict) -> Dict:
        """Generate BlogPosting schema for individual blog post."""
        # Convert datetime objects to ISO format strings
        created_at = blog_data.get('created_at', '')
        if hasattr(created_at, 'isoformat'):
            created_at = created_at.isoformat()
        
        updated_at = blog_data.get('updated_at', '')
        if hasattr(updated_at, 'isoformat'):
            updated_at = updated_at.isoformat()
        
        return {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": f"{SEOConfig.SITE_URL}/blog/{slugify(blog_data.get('title', ''))}/"
            },
            "headline": blog_data.get('title', ''),
            "description": blog_data.get('description', ''),
            "image": blog_data.get('image_url', ''),
            "datePublished": created_at,
            "dateModified": updated_at,
            "author": {
                "@type": "Person",
                "name": about_data.get('name', ''),
                "url": SEOConfig.SITE_URL,
                "image": about_data.get('image_url', '')
            },
            "publisher": {
                "@type": "Person",
                "name": about_data.get('name', ''),
                "logo": {
                    "@type": "ImageObject",
                    "url": about_data.get('image_url', '')
                }
            },
            "keywords": blog_data.get('tags', []),
            "wordCount": blog_data.get('word_count', 0),
            "inLanguage": "en"
        }
    
    @staticmethod
    def generate_software_source_code_schema(project_data: Dict, about_data: Dict) -> Dict:
        """Generate SoftwareSourceCode schema for projects."""
        tech_stack = [tech.get('name', '') for tech in project_data.get('tech_stack', [])]
        
        # Convert datetime objects to ISO format strings
        created_at = project_data.get('created_at', '')
        if hasattr(created_at, 'isoformat'):
            created_at = created_at.isoformat()
        
        updated_at = project_data.get('updated_at', '')
        if hasattr(updated_at, 'isoformat'):
            updated_at = updated_at.isoformat()
        
        return {
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            "name": project_data.get('title', ''),
            "description": ' '.join(project_data.get('description', [])),
            "url": project_data.get('demo_url', ''),
            "codeRepository": project_data.get('github_url', ''),
            "programmingLanguage": tech_stack,
            "author": {
                "@type": "Person",
                "name": about_data.get('name', ''),
                "url": SEOConfig.SITE_URL
            },
            "dateCreated": created_at,
            "dateModified": updated_at,
            "license": "MIT",
            "applicationCategory": "DeveloperApplication"
        }
    
    @staticmethod
    def generate_collection_page_schema(items: List[Dict], about_data: Dict, collection_type: str = "projects") -> Dict:
        """Generate CollectionPage schema for project/blog listings."""
        return {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": f"{about_data.get('name', '')}'s {collection_type.title()}",
            "description": f"Browse through {about_data.get('name', '')}'s {collection_type}",
            "url": f"{SEOConfig.SITE_URL}/{collection_type}/",
            "author": {
                "@type": "Person",
                "name": about_data.get('name', ''),
                "url": SEOConfig.SITE_URL
            },
            "numberOfItems": len(items),
            "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": len(items),
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": i + 1,
                        "name": item.get('title', ''),
                        "url": f"{SEOConfig.SITE_URL}/{collection_type}/{slugify(item.get('title', ''))}/"
                    }
                    for i, item in enumerate(items[:10])  # Limit to first 10 items
                ]
            }
        }
    
    @staticmethod
    def generate_breadcrumb_schema(breadcrumbs: List[Dict]) -> Dict:
        """Generate BreadcrumbList schema."""
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": i + 1,
                    "name": crumb.get('name', ''),
                    "item": crumb.get('url', '')
                }
                for i, crumb in enumerate(breadcrumbs)
            ]
        }
    
    @staticmethod
    def generate_organization_schema(about_data: Dict) -> Dict:
        """Generate Organization schema if applicable."""
        return {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": about_data.get('name', ''),
            "url": SEOConfig.SITE_URL,
            "logo": about_data.get('image_url', ''),
            "sameAs": [
                url for url in about_data.get('social_media', {}).values() if url
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "email": about_data.get('email', ''),
                "contactType": "customer service"
            }
        }
