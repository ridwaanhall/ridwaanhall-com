"""
Project #40: Bike Rental Insights Dashboard
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=40,
    title='Bike Rental Insights Dashboard',
    headline='Interactive dashboard tying weather to bike rental trends.',
    description=['This dashboard dives into how weather drives bike rentals, breaking down trends by season, day, and conditions.', 'It uses data analysis to help bike companies optimize fleets and pricing based on forecasts.', 'Filter by temp, humidity, or time to uncover patterns, with ML models predicting future demand.'],
    features=[
        Feature(title='Season Trends', description='Shows peak biking seasons.'),
        Feature(title='Weather Impact', description='Links conditions to rental spikes.'),
        Feature(title='Day Breakdown', description='Compares weekdays vs. weekends.'),
        Feature(title='Streamlit UI', description='Interactive charts for easy insights.'),
    ],
    images={
        "bike_sharing_analysis_dashboard.webp": f"{settings.PROJECT_BASE_IMG_URL}/bike_sharing_analysis_dashboard.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["streamlit"],
        SkillsData.tech_stack["tensorflow"],
    ],
    github_url='https://github.com/ridwaanhall/dicoding-bike-sharing-analysis',
    demo_url='https://ridwaanhall-bike-sharing-analytics.streamlit.app/',
    category='Dashboard, Data Analysis, Bike Rental, Streamlit',
    tags=['Dashboard', 'Bike Rental', 'Data Analysis', 'Streamlit', 'Python', 'Weather Data', 'ML Forecasting', 'Interactive Charts', 'Business Intelligence', 'Dicoding'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2025-07-06T16:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-07-06T16:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
