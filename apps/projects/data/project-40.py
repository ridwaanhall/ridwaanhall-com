"""
Project #40: Bike Rental Insights Dashboard
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Bike Rental Insights Dashboard
project_data = {
    "id": 40,
    "title": """Bike Rental Insights Dashboard""",
    "headline": """Interactive dashboard tying weather to bike rental trends.""",
    "description": ['This dashboard dives into how weather drives bike rentals, breaking down trends by season, day, and conditions.', 'It uses data analysis to help bike companies optimize fleets and pricing based on forecasts.', 'Filter by temp, humidity, or time to uncover patterns, with ML models predicting future demand.'],
    "images": {
        "bike_sharing_analysis_dashboard.webp": f"{settings.PROJECT_BASE_IMG_URL}/bike_sharing_analysis_dashboard.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Season Trends', 'description': 'Shows peak biking seasons.'}, {'title': 'Weather Impact', 'description': 'Links conditions to rental spikes.'}, {'title': 'Day Breakdown', 'description': 'Compares weekdays vs. weekends.'}, {'title': 'Streamlit UI', 'description': 'Interactive charts for easy insights.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["streamlit"],
        SkillsData.tech_stack["tensorflow"]
    ],
    "github_url": "https://github.com/ridwaanhall/dicoding-bike-sharing-analysis",
    "demo_url": "https://ridwaanhall-bike-sharing-analytics.streamlit.app/",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2025-07-06T16:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Dashboard, Data Analysis, Bike Rental, Streamlit",
    "tags": [
        "Dashboard",
        "Bike Rental",
        "Data Analysis",
        "Streamlit",
        "Python",
        "Weather Data",
        "ML Forecasting",
        "Interactive Charts",
        "Business Intelligence",
        "Dicoding"
    ],
    "priority": 1,
    "slug": ""
}
