"""
Project #44: ridwaanhall.com
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: ridwaanhall.com
project_data = {
    "id": 44,
    "title": """ridwaanhall.com""",
    "headline": """My personal portfolio site, powered by Django and TailwindCSS, running serverless on Vercel.""",
    "description": [
        'This is my digital HQ, built with Django and TailwindCSS, hosted serverless on Vercel. It’s got it all—about me, projects, blog, education, experience, and a sleek dashboard.',
        'Blends Django’s backend power with Tailwind’s sharp styling for a fast, modern site. Vercel’s serverless setup keeps it low-maintenance and lightning-quick.',
        'The dashboard pulls live GitHub and WakaTime data to flex my coding stats in real time, looking fire on any device.'
    ],
    "images": {
        "ridwaanhall_com_20250607.webp": f"{settings.PROJECT_BASE_IMG_URL}/ridwaanhall_com_20250607.webp"
    },
    "is_featured": True,
    "features": [
        {'title': 'Serverless Vibes', 'description': 'Hosted on Vercel for max uptime and easy scaling.'},
        {'title': 'Live Dashboard', 'description': 'Shows my GitHub and WakaTime stats in real time.'},
        {'title': 'Smooth Design', 'description': 'TailwindCSS makes it look good on any screen.'}
    ],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["tailwindcss"],
        SkillsData.tech_stack["vercel"],
        SkillsData.tech_stack["github_api"],
        SkillsData.tech_stack["cloudflare"],
        SkillsData.tech_stack["wakatime_api"],
        SkillsData.tech_stack["allauth"]
    ],
    "github_url": "https://github.com/ridwaanhall/ridwaanhall-com",
    "demo_url": "https://ridwaanhall.com",
    "status": "completed",
    "created_at": datetime.strptime("2025-03-16T12:03:09+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-07-04T12:57:44+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "portfolio",
    "tags": ["portfolio", "personal site", "django", "tailwindcss", "vercel", "dashboard"],
    "priority": 1,
    "slug": ""
}
