"""
Project #49: El-Perintis
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: El-Perintis
project_data = {
    "id": 49,
    "title": """El-Perintis""",
    "headline": """A philosophical simulation about building from scratch versus continuing a legacy, through Python code and a narrative of struggle.""",
    "description": [
        'This repository explores the philosophy of building from scratch (pioneer) and continuing a legacy (inheritor) through two approaches: OOP and non-OOP.',
        'The `perintis` branch contains an OOP-based simulation depicting the struggle of building a new foundation.',
        'The `pewaris` branch contains a non-OOP approach that continues the old pattern with adaptation and reflection.',
        'The narrative of struggle is written dynamically through Python functions and a simple API endpoint.',
        'Inspired by the story of Ryu Kintaro and the dilemma between writing your own destiny or keeping the flame that has already been lit.'
    ],
    "images": {
        "el_perintis_preview.webp": f"{settings.PROJECT_BASE_IMG_URL}/el_perintis_preview.webp",
        # "el_perintis.webp": f"{settings.PROJECT_BASE_IMG_URL}/el_perintis.webp"
    },
    "is_featured": True,
    "features": [
        {'title': 'OOP vs non-OOP Simulation', 'description': 'The `perintis` branch uses OOP to build a new foundation, while `pewaris` continues the existing system procedurally.'},
        {'title': 'Struggle Narrative', 'description': 'Python functions illustrate the journey, failures, and victories in a social and personal context.'},
        {'title': 'Simple API', 'description': 'FastAPI endpoint to generate the struggle narrative dynamically and contextually.'}
    ],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["fastapi"],
        SkillsData.tech_stack["pytest"]
    ],
    "github_url": "https://github.com/ridwaanhall/el-perintis",
    "demo_url": "",
    "status": "completed",
    "created_at": datetime.strptime("2025-07-31T21:40:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-08-01T04:40:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "education",
    "tags": ["pioneer", "inheritor", "philosophy", "narrative", "python", "oop", "api", "ryu-kintaro", "legacy", "simulation"],
}
