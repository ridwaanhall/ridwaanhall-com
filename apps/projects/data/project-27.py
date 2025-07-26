"""
Project #27: Zeronine Handwriting Wizard
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Zeronine Handwriting Wizard
project_data = {
    "id": 27,
    "title": """Zeronine Handwriting Wizard""",
    "headline": """Crush Arabic and English digit/character recognition with CNN-powered magic.""",
    "description": ['The Zeronine App takes you from raw data to a slick website for handwritten recognition of Arabic and English digits and characters.', 'Uses Convolutional Neural Networks (CNNs) to nail classification with high accuracy.', 'A full journey from data collection to deployment, built for impact and efficiency.'],
    "images": {
        "zeronine_handwritten_recognition.webp": f"{settings.PROJECT_BASE_IMG_URL}/zeronine_handwritten_recognition.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Bilingual Recognition', 'description': 'Handles Arabic and English digits and characters like a champ.'}, {'title': 'CNN Supercharge', 'description': 'Convolutional Neural Networks deliver precise handwriting detection.'}, {'title': 'End-to-End Flow', 'description': 'Covers data gathering, training, and website rollout.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["cnn"]
    ],
    "github_url": "https://github.com/ridwaanhall/zeronine",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2024-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Machine Learning, Computer Vision, Handwriting Recognition",
    "tags": [
        "Handwriting Recognition",
        "CNN",
        "Arabic Characters",
        "English Characters",
        "Python",
        "Data Collection",
        "Deployment",
        "Web App"
    ],
    "priority": 1,
    "slug": ""
}
