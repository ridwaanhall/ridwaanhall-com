"""
Project #49: el-perintis
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: el-perintis
project_data = {
    "id": 49,
    "title": """el-perintis""",
    "headline": """A narrative exploration and code analogy about pioneers and inheritors in the context of struggle and cultural legacy.""",
    "description": [
        'A Python repository blending OOP and non-OOP simulations to illustrate the philosophy of building from scratch (pioneer) versus continuing a legacy (inheritor).',
        'Equipped with struggle functions and dynamic narratives that bring to life personal and social perspectives on perseverance.',
        'Inspired by viral phenomena such as the story of Ryu Kintaro, adding a contemporary nuance to the privilege vs legacy debate.',
        'A simple API allows users to generate struggle narratives tailored to their own context.',
        'Every line of code invites reflection: choosing to rewrite destiny, or to keep the flame already lit.'
    ],
    "images": {
        "el_perintis.webp": f"{settings.PROJECT_BASE_IMG_URL}/el_perintis.webp"
    },
    "is_featured": True,
    "features": [
        {'title': 'Philosophical Simulation', 'description': 'OOP represents building the foundation, non-OOP symbolizes inheriting a system.'},
        {'title': 'Dynamic Narratives', 'description': 'Python functions bring struggle stories to life in an extensible format.'},
        {'title': 'Reflective API', 'description': 'A simple endpoint to generate contextual struggle narratives.'}
    ],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["fastapi"],
        SkillsData.tech_stack["pytest"]
    ],
    "github_url": "https://github.com/ridwaanhall/el-perintis",
    "demo_url": "",
    "status": "in-progress",
    "created_at": datetime.strptime("2025-07-31T21:40:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-07-31T21:40:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "education",
    "tags": ["narrative", "philosophy", "pioneer", "inheritor", "python", "oop", "api", "ryu-kintaro", "privilege", "simulation"],
}
