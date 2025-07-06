"""
Project #1: MLBB Username Finder
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: MLBB Username Finder
project_data = {
    "id": 1,
    "title": """MLBB Username Finder""",
    "headline": """Snag Mobile Legends usernames in a snap with Python and API vibes.""",
    "description": ['This Python project is your go-to for grabbing Mobile Legends usernames like a pro.', "Just pop in a user ID and zone ID, and boom—our API hooks you up with the player's username.", 'Light, fast, and a total game-changer for MLBB fans.'],
    "images": {
        "mlbb_username_checker.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_username_checker.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Lightning-Fast Lookups', 'description': 'Get usernames in a flash with just a user ID and zone ID.'}, {'title': 'Python-Powered Swagger', 'description': 'Rocking Python for speed and smooth performance.'}, {'title': 'API Awesomeness', 'description': 'Taps into APIs for spot-on, reliable data.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"]
    ],
    "github_url": "",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-03-30T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "API, Gaming, Utility",
    "tags": [
        "API",
        "Mobile Legends",
        "MLBB",
        "Username Finder",
        "Python",
        "Game Utility",
        "User Lookup",
        "Gaming Tool"
    ],
    "priority": 1,
    "slug": ""
}
