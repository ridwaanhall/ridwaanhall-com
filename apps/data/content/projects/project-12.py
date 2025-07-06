"""
Project #12: College Data Playground
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: College Data Playground
project_data = {
    "id": 12,
    "title": """College Data Playground""",
    "headline": """Explore Indonesian college stats with a slick Flask-powered hub.""",
    "description": ['This Flask site is your one-stop shop for college data—students, lecturers, programs, and more.', 'Comes with a dope dashboard for stats, a search tool, and detailed pages for everything.', 'Built to make digging through academic data fun, fast, and easy.'],
    "images": {
        "college_data_hub.webp": f"{settings.PROJECT_BASE_IMG_URL}/college_data_hub.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Stats Dashboard', 'description': 'Visualize student, lecturer, and program counts like a pro.'}, {'title': 'Search Superstar', 'description': 'Find students, lecturers, colleges, or programs in a flash.'}, {'title': 'Deep Dives', 'description': 'Explore detailed data on students, lecturers, and more.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["bootstrap"]
    ],
    "github_url": "",
    "demo_url": "https://replit.com/@ridwaanhall/web-college",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Web App, Education, Data Visualization",
    "tags": [
        "College Data",
        "Dashboard",
        "Flask",
        "Bootstrap",
        "Education",
        "Indonesia",
        "Data Visualization",
        "Academic Data",
        "Search Tool"
    ],
    "priority": 1,
    "slug": ""
}
