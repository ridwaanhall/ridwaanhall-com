"""
Project #6: MLBB Stats & Winrate API
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: MLBB Stats & Winrate API
project_data = {
    "id": 6,
    "title": """MLBB Stats & Winrate API""",
    "headline": """Level up with MLBB player stats and winrates, served hot by Flask.""",
    "description": ['This Flask API is your ticket to Mobile Legends data—usernames, MPL stats, winrates, and more.', 'Pulls info from mainlagiaja.com, id-mpl.com, takapadia.com, plus some custom flair I cooked up.', 'A must-have for devs and gamers who want MLBB stats without the grind.'],
    "images": {
        "mlbb_game_stats_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_game_stats_api.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Username Grabber', 'description': 'Scoop up player usernames fast via mainlagiaja.com’s API.'}, {'title': 'MPL Stats Connect', 'description': 'Dives into id-mpl.com for juicy stats and insights.'}, {'title': 'Winrate Wizard', 'description': 'Cranks out accurate winrates using takapadia.com data.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"]
    ],
    "github_url": "",
    "demo_url": "https://mlbb-api.ridwaanhall.repl.co",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
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
    "priority": 1,
    "slug": ""
}
