from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: rone.dev - RoneAI
project_data = {
    # Identity
    "id": 57,
    "title": "rone.dev - RoneAI",
    "headline": "A modern Django landing page showcasing AI, web solutions, and open APIs with professional SEO optimization.",

    # Core Content
    "description": [
        "RoneAI is a professional Django-based landing page designed to showcase cutting-edge technology products.",
        "The platform focuses on AI-powered solutions, modern web development, and open API integrations.",
        "Built with Django 5.2.9 and optimized for production deployment on Vercel with Python 3.12.",
        "Features a modular architecture with separate apps for landing pages and comprehensive SEO management.",
        "Includes responsive design with light/dark mode support and clean, maintainable code structure.",
        "Implements security best practices with HSTS, XSS protection, and secure cookie configuration.",
        "Uses Whitenoise for efficient static file management and compressed manifest storage."
    ],
    "features": [
        {
            "title": "Modern Django Architecture",
            "description": "Built on Django 5.2.9 with a clean, modular app structure separating concerns between landing and SEO components."
        },
        {
            "title": "Professional SEO Optimization",
            "description": "Comprehensive SEO implementation including meta tags, Open Graph, Twitter Cards, structured data, and sitemap management."
        },
        {
            "title": "Production-Ready Deployment",
            "description": "Configured for Vercel deployment with ASGI/WSGI support, environment-based settings, and security hardening."
        },
        {
            "title": "Responsive & Theme-Aware UI",
            "description": "Clean, modern interface with support for both light and dark themes and responsive design across all devices."
        },
        {
            "title": "Modular Content Management",
            "description": "Well-organized data classes for managing hero, features, team, FAQ, reviews, pricing, and contact sections."
        },
        {
            "title": "Email Integration",
            "description": "Built-in email handling with SMTP configuration for contact forms and notifications."
        },
        {
            "title": "Security First",
            "description": "Implements Django security best practices including HSTS, XSS filters, secure cookies, and CSRF protection."
        },
        {
            "title": "Static File Optimization",
            "description": "Whitenoise integration for compressed manifest storage ensuring fast static file delivery."
        }
    ],
    "images": {
        "roneai.webp": f"{settings.PROJECT_BASE_IMG_URL}/roneai.webp",
    },

    # Tech & Resources
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["vercel"],
    ],
    "github_url": None,
    "demo_url": "https://rone.dev",

    # Classification
    "category": "landing-page",
    "tags": [
        "django",
        "landing-page",
        "seo",
        "python",
        "vercel",
        "responsive-design",
        "whitenoise",
        "modern-web",
        "ai-solutions",
        "open-api",
        "portfolio",
        "production-ready",
        "security",
        "asgi",
        "wsgi"
    ],

    # Status & Meta
    "is_featured": False,
    "featured_priority": None,
    "status": "completed",
    "created_at": datetime.strptime("2025-12-28T09:15:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2026-01-04T08:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
}