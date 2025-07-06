"""
Project #22: Emotion Detector CNN
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Emotion Detector CNN
project_data = {
    "id": 22,
    "title": """Emotion Detector CNN""",
    "headline": """Spot emotions like a pro with next-level CNNs and TIMM model magic.""",
    "description": ['This project uses Convolutional Neural Networks (CNNs) with pretrained TIMM models to classify emotions like a boss.', 'Boosted by dope augmentation tricks like random resizing, flipping, color jitter, CutMix, and MixUp for top-tier generalization.', 'Smart dataset splits for training and validation ensure the model’s performance is on point.'],
    "images": {
        "emotion_recognition_timm_cnn.webp": f"{settings.PROJECT_BASE_IMG_URL}/emotion_recognition_timm_cnn.webp"
    },
    "is_featured": False,
    "features": [{'title': 'TIMM Model Swagger', 'description': 'High-performance pretrained models for reliable emotion detection.'}, {'title': 'Augmentation All-Stars', 'description': 'CutMix, MixUp, and more spice up data for better results.'}, {'title': 'Training Smarts', 'description': 'Optimized splits for max accuracy and generalization.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["pytorch"],
        SkillsData.tech_stack["cnn"],
        SkillsData.tech_stack["timm"]
    ],
    "github_url": "",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2024-01-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Machine Learning, Computer Vision, Emotion Recognition",
    "tags": [
        "CNN",
        "Emotion Detection",
        "TIMM",
        "PyTorch",
        "Image Classification",
        "Augmentation",
        "CutMix",
        "MixUp",
        "Python",
        "Computer Vision"
    ],
    "priority": 1,
    "slug": ""
}
