"""
Project #38: Lumina Attendance Saver
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Lumina Attendance Saver
project_data = {
    "id": 38,
    "title": """Lumina Attendance Saver""",
    "headline": """Auto-attendance tool for students who forget the roll call.""",
    "description": ['Lumina pumps out encrypted attendance codes in a flash, saving students from missing class check-ins.', 'Built for schools, it adapts to different course setups with secure, valid codes.', 'The interface is stupid simple, perfect for those last-second scrambles.'],
    "images": {
        "lumina.webp": f"{settings.PROJECT_BASE_IMG_URL}/lumina.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Code Generator', 'description': 'Spits out secure codes instantly.'}, {'title': 'Easy UI', 'description': 'No fuss, even under pressure.'}, {'title': 'Safe Codes', 'description': 'Encryption keeps things legit.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["bulma"],
        SkillsData.tech_stack["vercel"],
        SkillsData.tech_stack["cloudflare"]
    ],
    "github_url": "https://github.com/ridwaanhall/Lumina",
    "demo_url": "https://lumina.ridwaanhall.com",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Education, Attendance, Automation, Django",
    "tags": [
        "Attendance",
        "Automation",
        "Django",
        "Python",
        "Bulma",
        "Vercel",
        "Cloudflare",
        "Student Tool",
        "Code Generator",
        "School"
    ],
    "priority": 1,
    "slug": ""
}
