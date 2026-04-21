"""
Project #41: MLBB API & Web Platform
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData, ProjectStatus
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=41,
    title='MLBB API & Web Platform',
    headline='FastAPI-powered API and web hub for Mobile Legends data, analytics, and player tools.',
    description=[
        'A full-featured API + web app delivering hero stats, rankings, and meta insights for MLBB.',
        'Built with FastAPI and Python, deployed on Vercel with reproducible installs via uv.',
        'Utility tools and visualizations help both casual players and devs explore game data effectively.'
    ],
    features=[
        Feature(title='Hero & Skill API', description='Clean REST endpoints for hero stats, skills, and rankings.'),
        Feature(title='Academy Resources', description='Guides and docs for developers building MLBB tools.'),
        Feature(title='Player Hub', description='Simple hub with personalized insights and utilities.'),
        Feature(title='Analytics Tools', description='Meta analysis, counters, and build recommendations.'),
    ],
    images={
        "mlbb_landing.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_landing.webp",
        "mlbb_interactive_endpoint.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_interactive_endpoint.webp",
        "mlbb_public_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_public_api.webp",
        "mlbb_docs.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_docs.webp",
        "mlbb_result.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_result.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["fastapi"],
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["vercel"],
        SkillsData.tech_stack["uv"],
    ],
    github_url='https://github.com/ridwaanhall/api-mobilelegends',
    demo_url='https://mlbb.rone.dev',
    category='API, Gaming, MLBB, Web App, Data Analytics',
    tags=['MLBB', 'Mobile Legends', 'API', 'REST API', 'FastAPI', 'Python', 'uv', 'Game Stats', 'Hero Data', 'Meta Analysis', 'Academy', 'Vercel', 'Gaming', 'Data Visualization'],
    is_featured=True,
    featured_priority=1,
    status=ProjectStatus.COMPLETED,
    created_at=datetime.strptime("2025-07-06T16:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2026-04-21T16:15:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
