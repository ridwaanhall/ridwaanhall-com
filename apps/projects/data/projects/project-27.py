"""
Project #27: Zeronine Handwriting Wizard
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=27,
    title='Zeronine Handwriting Wizard',
    headline='Crush Arabic and English digit/character recognition with CNN-powered magic.',
    description=['The Zeronine App takes you from raw data to a slick website for handwritten recognition of Arabic and English digits and characters.', 'Uses Convolutional Neural Networks (CNNs) to nail classification with high accuracy.', 'A full journey from data collection to deployment, built for impact and efficiency.'],
    features=[
        Feature(title='Bilingual Recognition', description='Handles Arabic and English digits and characters like a champ.'),
        Feature(title='CNN Supercharge', description='Convolutional Neural Networks deliver precise handwriting detection.'),
        Feature(title='End-to-End Flow', description='Covers data gathering, training, and website rollout.'),
    ],
    images={
        "zeronine_arabic_digits.webp": f"{settings.PROJECT_BASE_IMG_URL}/zeronine_arabic_digits.webp",
        "zeronine_english_digits.webp": f"{settings.PROJECT_BASE_IMG_URL}/zeronine_english_digits.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["cnn"],
    ],
    github_url='https://github.com/ridwaanhall/zeronine',
    demo_url='',
    category='Machine Learning, Computer Vision, Handwriting Recognition',
    tags=['Handwriting Recognition', 'CNN', 'Arabic Characters', 'English Characters', 'Python', 'Data Collection', 'Deployment', 'Web App'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2024-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2024-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
