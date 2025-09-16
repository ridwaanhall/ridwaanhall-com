"""
Project #6: MLBB Stats & Winrate API
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: MLBB Stats & Winrate API
project_data = {
    # Identity
    "id": 6,
    "title": "MLBB Stats & Winrate API",
    "headline": "Access MLBB player stats and winrates through a clean Flask-powered API.",

    # Core Content
    "description": [
        "This Flask API provides Mobile Legends data including usernames, MPL stats, winrates, and more.",
        "Aggregates information from mainlagiaja.com, id-mpl.com, takapadia.com, plus custom enhancements for richer insights.",
        "Built for developers and gamers who want reliable MLBB stats without manual scraping or grind."
    ],
    "features": [
        {
            "title": "Username Lookup",
            "description": "Fetch player usernames quickly via mainlagiaja.com’s API."
        },
        {
            "title": "MPL Stats Integration",
            "description": "Pull competitive stats and insights directly from id-mpl.com."
        },
        {
            "title": "Winrate Engine",
            "description": "Calculate accurate winrates using takapadia.com data and custom logic."
        }
    ],
    "images": {
        "mlbb_game_stats_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_game_stats_api.webp"
    },

    # Tech & Resources
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"]
    ],
    "github_url": "",
    "demo_url": "https://mlbb-api.ridwaanhall.repl.co",

    # Classification
    "category": "API, Gaming, MLBB, Flask",
    "tags": [
        "MLBB",
        "Mobile Legends",
        "API",
        "Flask",
        "Game Stats",
        "Winrate",
        "Player Data",
        "Python",
        "Gaming"
    ],

    # Status & Meta
    "is_featured": False,
    "featured_priority": None,
    "status": "completed",
    "created_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
}
