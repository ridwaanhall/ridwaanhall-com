from dataclasses import asdict
from datetime import datetime
from django.conf import settings
from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


# SEO-Optimized Project Data
project_data = asdict(ProjectData(
    # Core Identity
    id=61,
    title="Wilayah Indonesia API",
    headline="Complete REST API for Indonesian administrative regions with 83,000+ villages, districts, regencies, and provinces using official government codes.",
    
    # Detailed Description (SEO: Rich content with keywords)
    description=[
        "Built with Django 6.0 and Python 3.14, providing a scalable and maintainable architecture for hierarchical geographical data modeling.",
        "Comprehensive REST API covering all 38 provinces, 514 regencies/cities, 7,277 districts, and 83,731 villages in Indonesia with official administrative codes.",
        "Implements efficient relational database design using PostgreSQL in production and SQLite for development, optimized for complex hierarchical queries.",
        "RESTful endpoints with DRF (Django REST Framework) supporting JSON responses and browsable HTML interface for developer-friendly integration.",
        "Advanced filtering capabilities with relational validation ensuring data consistency across administrative hierarchy levels.",
        "Zero-downtime deployment on Vercel with serverless architecture, automatic scaling, and environment-based configuration.",
        "Modular Django app structure enabling easy extension for electoral districts (dapil), postal codes, or statistical data integration.",
        "Production-ready with WhiteNoise for static file serving, CORS configuration, and comprehensive error handling.",
        "Open-source under MIT license, actively maintained with regular data updates from official Indonesian government sources.",
    ],
    
    # Key Features (SEO: Structured data for rich snippets)
    features=[
        Feature(
            title="Complete Administrative Hierarchy",
            description="Access all 4 levels of Indonesian administrative divisions: 38 provinces, 514 regencies, 7,277 districts, and 83,731 villages with official BPS codes."
        ),
        Feature(
            title="Efficient Relational Database Design",
            description="Optimized PostgreSQL schema with foreign key relationships ensuring data integrity and fast queries across hierarchical levels."
        ),
        Feature(
            title="RESTful API with DRF",
            description="Clean REST endpoints built with Django REST Framework, supporting JSON format, pagination, and browsable API interface."
        ),
        Feature(
            title="Advanced Filtering & Validation",
            description="Query by region codes, filter by parent regions, with automatic validation to prevent invalid administrative relationships."
        ),
        Feature(
            title="Serverless Deployment",
            description="Production deployment on Vercel with automatic scaling, CDN caching, and sub-100ms response times globally."
        ),
        Feature(
            title="Management Commands",
            description="Built-in Django commands for data import/export from official sources, with validation and error handling."
        ),
        Feature(
            title="Modular & Extensible",
            description="Clean app structure allowing integration of additional datasets like postal codes, coordinates, or population statistics."
        ),
        Feature(
            title="Production Ready",
            description="Includes security best practices, WhiteNoise static serving, CORS support, and comprehensive error handling."
        ),
    ],
    
    # Media (SEO: Descriptive image filenames)
    images={
        "wilayah_indonesia_api_dashboard.webp": f"{settings.PROJECT_BASE_IMG_URL}/wilayah_indonesia_api_dashboard.webp",
        "wilayah_indonesia_api_endpoints.webp": f"{settings.PROJECT_BASE_IMG_URL}/wilayah_indonesia_api_endpoints.webp",
        "wilayah_indonesia_api_response.webp": f"{settings.PROJECT_BASE_IMG_URL}/wilayah_indonesia_api_response.webp",
    },
    
    # Tech Stack
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["django_rest_framework"],
        SkillsData.tech_stack["vercel"],
    ],
    
    # Links
    github_url="https://github.com/ridwaanhall/wilayah-indonesia",
    demo_url="https://api-wilayah.rone.dev",
    
    # SEO & Categorization
    category="web-development",
    tags=[
        # Primary keywords
        "django", "python", "rest-api", "indonesia",
        # Secondary keywords
        "administrative-data", "geographical-api", "regional-data",
        "django-rest-framework", "postgresql", "vercel",
        # Long-tail keywords
        "indonesian-provinces-api", "kabupaten-api", "kecamatan-api",
        "desa-kelurahan-data", "bps-codes", "wilayah-indonesia",
    ],
    
    # Status
    is_featured=False,
    featured_priority=None,
    status="completed",
    
    # Timestamps
    created_at=datetime.strptime("2026-03-08T02:52:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2026-03-08T17:03:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
