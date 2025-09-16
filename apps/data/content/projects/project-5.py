"""
Project #5: BMKG Weather Pro
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: BMKG Weather Pro
project_data = {
    # Identity
    "id": 5,
    "title": "BMKG Weather Pro",
    "headline": "Access Indonesia’s weather forecasts with a Flask-powered API hub.",

    # Core Content
    "description": [
        "This Flask project connects directly to BMKG’s database to deliver detailed weather forecasts.",
        "Filter results by region, parameter, or time range for precise, tailored insights.",
        "From Aceh to Papua, it provides a reliable, developer-friendly gateway to nationwide weather data."
    ],
    "features": [
        {
            "title": "Nationwide Coverage",
            "description": "Delivers weather data for every region across Indonesia."
        },
        {
            "title": "Custom Filters",
            "description": "Mix and match area, parameter, and time range for targeted results."
        },
        {
            "title": "Flask-Powered Performance",
            "description": "Smooth routing and efficient data handling with Flask."
        }
    ],
    "images": {
        "bmkg_weather_forecast_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/bmkg_weather_forecast_api.webp"
    },

    # Tech & Resources
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"]
    ],
    "github_url": "",
    "demo_url": "",

    # Classification
    "category": "Web App, Weather, Forecast, Flask",
    "tags": [
        "BMKG",
        "Weather Forecast",
        "Flask",
        "Python",
        "Indonesia",
        "Data Filtering",
        "Weather Data",
        "Forecast",
        "API"
    ],

    # Status & Meta
    "is_featured": False,
    "featured_priority": None,
    "status": "completed",
    "created_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
}
