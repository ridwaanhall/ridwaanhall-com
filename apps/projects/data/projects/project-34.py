"""
Project #34: Tokopedia Review Scanner
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=34,
    title='Tokopedia Review Scanner',
    headline='ML pipeline to decode Tokopedia app feedback like a pro.',
    description=['This pipeline scrapes and analyzes Tokopedia app reviews from Google Play, using ML to read the sentiment.', 'It pinpoints what users love or hate, helping devs focus on fixes and features that matter.', 'Tackles messy Indonesian text—slang included—comparing models to find the top performer.'],
    features=[
        Feature(title='Review Scraper', description='Grabs fresh feedback from Play Store.'),
        Feature(title='Text Cleanup', description='Tames messy text for clean analysis.'),
        Feature(title='Feature Extraction', description='Uses TF-IDF and Word2Vec for deep insights.'),
        Feature(title='Model Testing', description='Battles ML models to crown the best.'),
        Feature(title='Sentiment Scores', description='Nails review vibes with precision.'),
    ],
    images={
        "sentiment_analysis_tokopedia_app.webp": f"{settings.PROJECT_BASE_IMG_URL}/sentiment_analysis_tokopedia_app.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["machine_learning"],
    ],
    github_url='https://github.com/ridwaanhall/Dicoding-Machine-Learning-Intermediate/tree/main/01_project',
    demo_url='',
    category='Machine Learning, Sentiment Analysis, App Review, NLP',
    tags=['Tokopedia', 'Sentiment Analysis', 'Machine Learning', 'Python', 'NLP', 'Review Scraper', 'Google Play', 'Text Analysis', 'TF-IDF', 'Word2Vec', 'Dicoding'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
