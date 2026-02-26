"""
Project #33: Gold Price & Music Recommender
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=33,
    title='Gold Price & Music Recommender',
    headline='ML vibes forecasting gold prices and curating your next music banger.',
    description=['This project uses machine learning to predict gold prices and drop music recs that match your mood.', 'For gold, it crunches historical data and economic trends, testing multiple models for tight accuracy.', 'The music recommender scans your listening habits and song features to serve up tracks and artists you’ll vibe with.'],
    features=[
        Feature(title='Gold Forecasts', description='Predicts prices to guide investment moves.'),
        Feature(title='Music Picks', description='Curates tracks based on your taste.'),
    ],
    images={
        "gold_price_prediction_and_music_recommendation_system.webp": f"{settings.PROJECT_BASE_IMG_URL}/gold_price_prediction_and_music_recommendation_system.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["tensorflow"],
        SkillsData.tech_stack["machine_learning"],
        SkillsData.tech_stack["music_recommendation"],
    ],
    github_url='https://github.com/ridwaanhall/applied-machine-learning',
    demo_url='',
    category='Machine Learning, Forecasting, Recommendation System',
    tags=['Gold Price Prediction', 'Music Recommendation', 'Machine Learning', 'Python', 'TensorFlow', 'Data Analysis', 'Forecasting', 'Recommender System', 'Dicoding'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2025-04-24T13:16:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-04-24T13:16:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
