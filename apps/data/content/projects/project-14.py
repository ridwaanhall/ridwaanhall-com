"""
Project #14: OpenAI Chat Master
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: OpenAI Chat Master
project_data = {
    "id": 14,
    "title": """OpenAI Chat Master""",
    "headline": """Get chatty with GPT-3.5 Turbo using Flask and Python swagger.""",
    "description": ['This project taps OpenAI’s API to craft killer conversational systems with GPT-3.5 Turbo.', 'Flask handles the backend, slinging HTTP requests for smooth AI-user vibes.', 'Shows off next-level NLP skills for sharp, accurate responses.'],
    "images": {
        "openai_api_dynamic_conversational_system.webp": f"{settings.PROJECT_BASE_IMG_URL}/openai_api_dynamic_conversational_system.webp"
    },
    "is_featured": False,
    "features": [{'title': 'AI Chat Vibes', 'description': 'GPT-3.5 Turbo powers dope, engaging convos.'}, {'title': 'Flask Flex', 'description': 'Handles POST and GET requests like a champ.'}, {'title': 'NLP Game Strong', 'description': 'OpenAI’s tech delivers top-tier language processing.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["openai_api"]
    ],
    "github_url": "",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "AI, Chatbot, OpenAI, NLP",
    "tags": [
        "OpenAI",
        "GPT-3.5 Turbo",
        "Chatbot",
        "NLP",
        "Flask",
        "Python",
        "Conversational AI",
        "API"
    ],
    "priority": 1,
    "slug": ""
}
