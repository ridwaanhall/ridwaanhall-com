"""
Project #16: Number Spotter App | Neural Net Magic
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=16,
    title='Number Spotter App | Neural Net Magic',
    headline='Catch hand-drawn numbers in real-time with MLP and a slick Python GUI.',
    description=['This GUI app uses a Multi-Layer Perceptron to spot numbers (0-9) drawn by you.', 'Tweak seven sliders for live predictions from the neural network, no lag.', 'Drops insights on training progress, like epochs and error stats, for a fun learning vibe.'],
    features=[
        Feature(title='Slider Shenanigans', description='Adjust features for instant number predictions.'),
        Feature(title='MLP Muscle', description='Neural nets nail number recognition with precision.'),
        Feature(title='Training Peek', description='See epoch counts and error trends for clarity.'),
    ],
    images={
        "neural_number_recognition.webp": f"{settings.PROJECT_BASE_IMG_URL}/neural_number_recognition.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["neural_networks"],
        SkillsData.tech_stack["gui_framework"],
    ],
    github_url='https://github.com/ridwaanhall/Training-Neural-Networks-in-Python',
    demo_url='',
    category='Machine Learning, GUI, Neural Network, Education',
    tags=['Neural Network', 'MLP', 'Handwritten Digit Recognition', 'Python', 'GUI', 'Education', 'Real-time Prediction', 'Training Visualization'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
