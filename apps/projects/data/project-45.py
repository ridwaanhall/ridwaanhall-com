"""
Project #45: Indonesia’s Gold Trends by AI
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Indonesia’s Gold Trends by AI
project_data = {
    "id": 45,
    "title": """Indonesia’s Gold Trends by AI""",
    "headline": """Transforming 10+ years of gold price data into precise forecasts using LSTM neural networks for Indonesia’s market trends.""",
    "description": ['This project’s straight-up droppin’ LSTM neural nets to forecast Indonesian gold prices like a pro. It’s vibin’ off historical data to nail short-term predictions and keep it real for long-term outlooks.', 'Runnin’ on 10+ years of gold price data, it’s spittin’ next-day price calls, short-term trends (1-6 months), and even long-term visions (up to 5 years). Plus, you get dope interactive plots and exportable data for that extra sauce.', 'With next-level data crunchin’ and a souped-up LSTM setup, this tool’s got precision and adaptability on lock, makin’ it a total game-changer.'],
    "images": {
        "indonesia_gold_price_prediction.webp": f"{settings.PROJECT_BASE_IMG_URL}/indonesia_gold_price_prediction.webp",
    },
    "is_featured": False,
    "features": [{'title': 'Deep Learning Drip', 'description': 'LSTM neural nets bringin’ that A-game for predictions across all timeframes.'}, {'title': 'Visuals Poppin’', 'description': 'Dynamic plots make price forecasts look clean and easy to roll with.'}, {'title': 'Full-Range Forecast', 'description': 'From next-day vibes to 5-year plans, it’s got trends covered with style.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["pytorch"],
        SkillsData.tech_stack["numpy"],
        SkillsData.tech_stack["matplotlib"],
        SkillsData.tech_stack["seaborn"]
    ],
    "github_url": "https://github.com/ridwaanhall/indonesia-gold-price-prediction",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2025-04-23T22:07:45+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "finance",
    "tags": ["gold", "price tracker", "indonesia", "analytics", "finance", "lstm"],
    "priority": 1,
    "slug": ""
}
