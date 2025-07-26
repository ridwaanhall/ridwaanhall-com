"""
Project #17: OpenAI Function Flex
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: OpenAI Function Flex
project_data = {
    "id": 17,
    "title": """OpenAI Function Flex""",
    "headline": """Unleash GPT-3.5 Turbo for slick tasks with Python and Flask.""",
    "description": ['This project shows off OpenAI API skills, firing structured POST requests with Python’s requests library.', 'Comes with cool functions like ‘locationQuery’ for weather and ‘authorQuery’ for author info.', 'A dope showcase of OpenAI’s NLP for versatile, text-based tasks.'],
    "images": {
        "openai_function_calling.webp": f"{settings.PROJECT_BASE_IMG_URL}/openai_function_calling.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Task-Targeted APIs', 'description': 'Query weather or author data with built-in functions.'}, {'title': 'Smooth Connect', 'description': 'Python’s requests library links up with OpenAI flawlessly.'}, {'title': 'Text Powerhouse', 'description': 'GPT-3.5 Turbo delivers smart, spot-on responses.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["openai_api"]
    ],
    "github_url": "",
    "demo_url": "https://your-openai-function-calling-url.com",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "AI, API, OpenAI, NLP",
    "tags": [
        "OpenAI",
        "GPT-3.5 Turbo",
        "API",
        "NLP",
        "Flask",
        "Python",
        "Function Calling",
        "Text Processing"
    ],
    "priority": 1,
    "slug": ""
}
