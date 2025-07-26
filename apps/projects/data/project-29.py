"""
Project #29: MLBB VIP Mabar Organizer
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: MLBB VIP Mabar Organizer
project_data = {
    "id": 29,
    "title": """MLBB VIP Mabar Organizer""",
    "headline": """Level up MLBB sessions with Django-powered VIP management for skins and heroes.""",
    "description": ['This Django system makes managing Mobile Legends: Bang Bang sessions, skin requests, hero picks, and feedback a breeze.', 'Tracks session status for regular and VIP users, keeping donor communication tight and organized.', 'Built to boost gameplay collaboration and streamline the VIP experience.'],
    "images": {
        "mlbb_mabar_vip_manager.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_mabar_vip_manager.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Session Coordinator', 'description': 'Manages Mabar sessions with donor and user details.'}, {'title': 'Skin Request Flow', 'description': 'Automates skin delivery status for VIPs.'}, {'title': 'Hero Pick System', 'description': 'Handles hero preferences, lanes, and meta choices.'}, {'title': 'Feedback Tracker', 'description': 'Logs donor comments for quick resolution.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"]
    ],
    "github_url": "https://github.com/ridwaanhall/management-mabar-VIP-MLBB",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2024-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Web App, Gaming, Management, Django",
    "tags": [
        "MLBB",
        "Mobile Legends",
        "VIP Management",
        "Mabar Organizer",
        "Django",
        "Python",
        "Gaming",
        "Session Management",
        "Skin Requests",
        "Hero Picks"
    ],
    "priority": 1,
    "slug": ""
}
