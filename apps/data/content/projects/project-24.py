"""
Project #24: Pemilu 2024 Vote Dashboard
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Pemilu 2024 Vote Dashboard
project_data = {
    "id": 24,
    "title": """Pemilu 2024 Vote Dashboard""",
    "headline": """Sleek web app for real-time 2024 Indonesia Election vote tracking with Django flair.""",
    "description": ['This fire web app for the 2024 Indonesia Presidential Election lets you explore vote data across regions—from national to polling stations.', 'Built with Django and Django REST Framework for a rock-solid backend, styled with Bootstrap for a clean, responsive look.', 'Packed with verified evidence data, it’s perfect for tracking results or building dope election tools.'],
    "image_url": "https://ridwaanhall.com/static/img/project/pemilu_2024_website.webp",
    "img_name": "pemilu_2024_website.webp",
    "is_featured": False,
    "features": [{'title': 'Region-Specific Insights', 'description': 'Dive into vote data from national to TPS levels.'}, {'title': 'Trusted Evidence', 'description': 'Verified data ensures transparency and reliability.'}, {'title': 'Slick Responsive Design', 'description': 'Bootstrap makes it look fire on any screen.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["django_rest_framework"],
        SkillsData.tech_stack["bootstrap"]
    ],
    "github_url": "https://github.com/ridwaanhall/realcount-pemilu-2024",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2024-04-30T23:59:59+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "",
    "tags": [],
    "priority": 1,
    "slug": ""
}
