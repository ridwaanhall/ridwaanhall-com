from dataclasses import asdict
from datetime import datetime
from django.conf import settings
from apps.projects.types import Feature, ProjectData, ProjectStatus
from apps.about.data.skills_data import SkillsData

# SEO-Optimized Project Data
project_data = asdict(ProjectData(
    # Core Identity
    id=41,
    title="MLBB API & Web Platform",
    headline="FastAPI-powered API and web hub delivering Mobile Legends hero stats, meta analytics, academy resources, and player utilities.",

    # Detailed Description
    description=[
        "A comprehensive public API and web platform designed for Mobile Legends: Bang Bang (MLBB), offering developers and players access to structured hero data, skill breakdowns, rankings, and meta insights.",
        "Built with FastAPI and Python, deployed seamlessly on Vercel, and optimized with reproducible installs via uv for consistent developer environments.",
        "Provides academy resources including guides, tutorials, and documentation to help developers integrate MLBB data into their own tools, bots, or dashboards.",
        "Includes JWT-based authentication flows, enabling secure access to personalized endpoints and player-specific utilities.",
        "Features a web playground with interactive forms at /web/*, allowing users to test endpoints directly in the browser without writing code.",
        "Supports multiple SDKs: Python (OpenMLBB via PyPI) and TypeScript/JavaScript (mlbb-sdk via npm), ensuring cross-language integration for diverse developer needs.",
        "Designed with modular components and visualization utilities, making it easy to extend functionality for new data sources, meta analysis, or game modes.",
        "SEO-ready blog and documentation pages powered by OpenAPI schema, ensuring discoverability and clarity for both casual players and technical audiences.",
    ],

    # Key Features
    features=[
        Feature(
            title="Hero & Skill API",
            description="REST endpoints delivering hero stats, skill data, and rankings with flexible identifiers."
        ),
        Feature(
            title="Academy Resources",
            description="Guides, tutorials, and developer docs for building MLBB tools and integrations."
        ),
        Feature(
            title="Player Hub",
            description="JWT-authenticated hub offering personalized insights, utilities, and account-linked features."
        ),
        Feature(
            title="Analytics Tools",
            description="Meta analysis, hero counters, build recommendations, and visualization utilities for players and analysts."
        ),
        Feature(
            title="Web Playground",
            description="Interactive forms at /web/* for testing API endpoints directly in the browser."
        ),
        Feature(
            title="SDK Support",
            description="Python (OpenMLBB) and TypeScript (mlbb-sdk) SDKs for seamless integration across projects."
        ),
    ],

    # Media
    images={
        "mlbb_landing.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_landing.webp",
        "mlbb_interactive_endpoint.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_interactive_endpoint.webp",
        "mlbb_public_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_public_api.webp",
        "mlbb_docs.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_docs.webp",
        "mlbb_result.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_result.webp",
    },

    # Tech Stack
    tech_stack=[
        SkillsData.tech_stack["fastapi"],
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["vercel"],
        SkillsData.tech_stack["uv"],
    ],

    # Links
    github_url="https://github.com/ridwaanhall/api-mobilelegends",
    demo_url="https://mlbb.rone.dev",

    # SEO & Categorization
    category="API, Gaming, MLBB, Web App, Data Analytics",
    tags=[
        "MLBB", "Mobile Legends", "API", "REST API", "FastAPI", "Python", "uv",
        "Game Stats", "Hero Data", "Meta Analysis", "Academy", "JWT Auth",
        "SDK", "Vercel", "Data Visualization", "Web Playground", "OpenAPI Docs"
    ],

    # Status
    is_featured=True,
    featured_priority=1,
    status=ProjectStatus.COMPLETED,

    # Timestamps
    created_at=datetime.strptime("2025-07-06T16:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2026-04-23T00:05:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
