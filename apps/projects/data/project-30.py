"""
Project #30: Indonesia Route Optimizer
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Indonesia Route Optimizer
project_data = {
    "id": 30,
    "title": """Indonesia Route Optimizer""",
    "headline": """Find the best paths across Indonesia with ACO and slick visualizations.""",
    "description": ['This project brings Ant Colony Optimization (ACO) to life on a real map of Indonesia for next-level route planning.', 'Tweakable parameters and visualization tools let you track the algorithm’s progress in style.', 'Built to deliver practical insights and boost efficiency for pathfinding challenges.'],
    "images": {
        "default_project_image.webp": f"{settings.PROJECT_BASE_IMG_URL}/default_project_image.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Real-World Mapping', 'description': 'Optimizes routes using Indonesia’s actual geography.'}, {'title': 'Visual Progress', 'description': 'Watch the algorithm work with clear visualizations.'}, {'title': 'Tuning Mastery', 'description': 'Fine-tune parameters for peak optimization results.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["aco"]
    ],
    "github_url": "https://github.com/ridwaanhall/aco-algorithm",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2024-12-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Optimization, Algorithm, Visualization, Mapping",
    "tags": [
        "Ant Colony Optimization",
        "ACO",
        "Route Planning",
        "Indonesia",
        "Python",
        "Visualization",
        "Mapping",
        "Pathfinding",
        "Algorithm"
    ],
    "priority": 1,
    "slug": ""
}
