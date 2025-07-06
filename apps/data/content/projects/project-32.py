"""
Project #32: ridwaanhall.pythonanywhere.com
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: ridwaanhall.pythonanywhere.com
project_data = {
    "id": 32,
    "title": """ridwaanhall.pythonanywhere.com""",
    "headline": """Slick portfolio site with Vuexy HTML and Django, showing off GitHub stats.""",
    "description": ['This portfolio site, powered by Vuexy HTML and Django, is loaded with sections and a GitHub-driven stats dashboard.', 'Rocking a sharp design and a smart backend for easy content updates, plus secure admin access.', 'The dashboard pulls yearly GitHub data to flex my coding grind in style.'],
    "images": {
        "ridwaanhall_pythonanywhere_com.webp": f"{settings.PROJECT_BASE_IMG_URL}/ridwaanhall_pythonanywhere_com.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Loaded Pages', 'description': 'Packed with sections like About, Projects, and beyond.'}, {'title': 'Clean UI', 'description': 'Vuexy HTML delivers a pro-grade look.'}, {'title': 'Git.callbacks', 'description': 'Yearly coding insights pulled via API.'}, {'title': 'Mobile-Friendly', 'description': 'Looks dope on any device.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["github_api"]
    ],
    "github_url": "",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Portfolio, Web App, Dashboard, Django",
    "tags": [
        "Portfolio",
        "Django",
        "Vuexy HTML",
        "GitHub API",
        "Dashboard",
        "Personal Website",
        "Python",
        "Stats Visualization",
        "Mobile Friendly"
    ],
    "priority": 1,
    "slug": ""
}
