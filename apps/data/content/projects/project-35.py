"""
Project #35: ridwaanhall.me
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: ridwaanhall.me
project_data = {
    "id": 35,
    "title": """ridwaanhall.me""",
    "headline": """Next.js portfolio with Once UI, built for speed and global vibes.""",
    "description": ['This Next.js portfolio, rocking Once UI, is optimized for lightning speed, SEO, and worldwide access.', 'Loaded with Server Components, lazy images, and code splitting, it scores 100 on Lighthouse.', 'Supports multiple languages, custom animations, and stays buttery smooth on any device.'],
    "images": {
        "ridwaanhall_me.webp": f"{settings.PROJECT_BASE_IMG_URL}/ridwaanhall_me.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Once UI', 'description': 'Sleek design system for fire components.'}, {'title': 'SEO Boost', 'description': 'Auto-generated meta for max search visibility.'}, {'title': 'Responsive Layout', 'description': 'Flawless on any screen size.'}, {'title': 'Customizable', 'description': 'Tweak everything with data attributes.'}, {'title': 'Multilingual', 'description': 'Ready for global audiences with next-intl.'}],
    "tech_stack": [
        SkillsData.tech_stack["nextjs"],
        SkillsData.tech_stack["once_ui"],
        SkillsData.tech_stack["typescript"],
        SkillsData.tech_stack["scss"],
        SkillsData.tech_stack["mdx"],
        SkillsData.tech_stack["javascript"]
    ],
    "github_url": "https://github.com/ridwaanhall/ridwaanhall.me",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Portfolio, Web App, Next.js, Personal Website",
    "tags": [
        "Portfolio",
        "Next.js",
        "Once UI",
        "TypeScript",
        "SCSS",
        "MDX",
        "JavaScript",
        "SEO",
        "Multilingual",
        "Personal Website"
    ],
    "priority": 1,
    "slug": ""
}
