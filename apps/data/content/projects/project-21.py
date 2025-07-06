"""
Project #21: Electricity Demand Forecaster
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Electricity Demand Forecaster
project_data = {
    "id": 21,
    "title": """Electricity Demand Forecaster""",
    "headline": """Tap into RNNs to nail super-accurate electricity demand predictions.""",
    "description": ['This project rocks Recurrent Neural Networks (RNNs) like LSTM and GRU to forecast electricity demand with serious precision.', 'Trained on historical demand data, mixed with weather and calendar features for max accuracy.', 'Perfect for showcasing how RNNs can level up energy management with killer temporal insights.'],
    "images": {
        "time_series_forecasting_rnn.webp": f"{settings.PROJECT_BASE_IMG_URL}/time_series_forecasting_rnn.webp"
    },
    "is_featured": False,
    "features": [{'title': 'RNN Powerhouse', 'description': 'LSTM and GRU models crush it at capturing time-based patterns.'}, {'title': 'Loaded Dataset', 'description': 'Blends historical demand, weather, and calendar data for sharp predictions.'}, {'title': 'Energy Game-Changer', 'description': 'Delivers spot-on forecasts for real-world energy planning.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["pytorch"],
        SkillsData.tech_stack["rnn"],
        SkillsData.tech_stack["lstm"],
        SkillsData.tech_stack["gru"]
    ],
    "github_url": "",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2024-01-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Machine Learning, Forecasting, Energy, Time Series",
    "tags": [
        "RNN",
        "LSTM",
        "GRU",
        "Electricity Demand",
        "Forecasting",
        "Time Series",
        "Energy Management",
        "Python",
        "PyTorch",
        "Weather Data"
    ],
    "priority": 1,
    "slug": ""
}
