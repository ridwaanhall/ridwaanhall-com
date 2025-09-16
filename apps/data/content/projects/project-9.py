"""
Project #9: College Data Scout API (Unofficial PDDIKTI)
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: College Data Scout API (Unofficial PDDIKTI)
project_data = {
    # Identity
    "id": 9,
    "title": "College Data Scout API (Unofficial PDDIKTI)",
    "headline": "Dig into Indonesian college stats like a pro with this Flask-powered API.",

    # Core Content
    "description": [
        "This Flask API is your go-to for snagging data on Indonesian colleges, students, lecturers, and programs.",
        "Easily pull student names, IDs, lecturer profiles, or program details in a snap.",
        "Perfect for researchers or devs who want quick, clean access to higher ed data."
    ],
    "features": [
        {
            "title": "Student Scoop",
            "description": "Fetch names, IDs, and more for students."
        },
        {
            "title": "Lecturer Lowdown",
            "description": "Grab lecturer names, IDs, and profiles."
        },
        {
            "title": "Program Playbook",
            "description": "Dive into study programs and college details."
        }
    ],
    "images": {
        "college_insights_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/college_insights_api.webp"
    },

    # Tech & Resources
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"]
    ],
    "github_url": "https://replit.com/@ridwaanhall/college-data",
    "demo_url": "",

    # Classification
    "category": "API, Education, College Data, Flask",
    "tags": [
        "API",
        "College Data",
        "PDDIKTI",
        "Flask",
        "Student Data",
        "Lecturer Data",
        "Program Data",
        "Indonesia",
        "Academic Data"
    ],

    # Status & Meta
    "is_featured": False,
    "featured_priority": None,
    "status": "completed",
    "created_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
}
