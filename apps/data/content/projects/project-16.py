"""
Project #16: Number Spotter App | Neural Net Magic
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Number Spotter App | Neural Net Magic
project_data = {
    "id": 16,
    "title": """Number Spotter App | Neural Net Magic""",
    "headline": """Catch hand-drawn numbers in real-time with MLP and a slick Python GUI.""",
    "description": ['This GUI app uses a Multi-Layer Perceptron to spot numbers (0-9) drawn by you.', 'Tweak seven sliders for live predictions from the neural network, no lag.', 'Drops insights on training progress, like epochs and error stats, for a fun learning vibe.'],
    "images": {
        "neural_number_recognition.webp": f"{settings.PROJECT_BASE_IMG_URL}/neural_number_recognition.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Slider Shenanigans', 'description': 'Adjust features for instant number predictions.'}, {'title': 'MLP Muscle', 'description': 'Neural nets nail number recognition with precision.'}, {'title': 'Training Peek', 'description': 'See epoch counts and error trends for clarity.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["neural_networks"],
        SkillsData.tech_stack["gui_framework"]
    ],
    "github_url": "https://github.com/ridwaanhall/Training-Neural-Networks-in-Python",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Machine Learning, GUI, Neural Network, Education",
    "tags": [
        "Neural Network",
        "MLP",
        "Handwritten Digit Recognition",
        "Python",
        "GUI",
        "Education",
        "Real-time Prediction",
        "Training Visualization"
    ],
    "priority": 1,
    "slug": ""
}
