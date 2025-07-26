"""
Project #48: MLBB Draft Assistant
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: MLBB Draft Assistant
project_data = {
    "id": 48,
    "title": """MLBB Draft Assistant""",
    "headline": """Level up your Mobile Legends draft phase with ML-powered hero recommendations and counter picks.""",
    "description": [
        'Crack the draft code with a slick command-line tool that analyzes your team’s picks and bans, then serves up smart hero suggestions.',
        'Powered by synergy and counter data, it’s your edge in every match—predictive smarts in real time.',
        'Handles hero names or IDs effortlessly, no sweat on formatting.',
        'Train the model once, then unleash blazing-fast predictions with clean table output.',
        'Ideal for solo strategists or squads wanting next-gen drafting clarity.'
    ],
    "images": {
        "mlbb_draft_assistant_preview.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_draft_assistant_preview.webp"
    },
    "is_featured": False,
    "features": [
        {'title': 'Smart Draft Picks', 'description': 'Pinpoint heroes that synergize or counter with precision.'},
        {'title': 'Flexible Input', 'description': 'Supports case-insensitive hero names and IDs with relaxed formatting.'},
        {'title': 'Speedy Predictions', 'description': 'Trained once, reused often. Fast suggestions in every draft.'}
    ],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["scikitlearn"],
        SkillsData.tech_stack["pandas"]
    ],
    "github_url": "https://github.com/ridwaanhall/mlbb-draft-assistant",
    "demo_url": "",
    "status": "completed",
    "created_at": datetime.strptime("2025-06-17T21:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-06-17T21:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "gaming",
    "tags": ["mlbb", "draft", "assistant", "command-line", "machine learning", "gaming"],
}
