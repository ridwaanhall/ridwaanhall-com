"""
Project #14: OpenAI Chat Master
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=14,
    title='OpenAI Chat Master',
    headline='Get chatty with GPT-3.5 Turbo using Flask and Python swagger.',
    description=['This project taps OpenAI’s API to craft killer conversational systems with GPT-3.5 Turbo.', 'Flask handles the backend, slinging HTTP requests for smooth AI-user vibes.', 'Shows off next-level NLP skills for sharp, accurate responses.'],
    features=[
        Feature(title='AI Chat Vibes', description='GPT-3.5 Turbo powers dope, engaging convos.'),
        Feature(title='Flask Flex', description='Handles POST and GET requests like a champ.'),
        Feature(title='NLP Game Strong', description='OpenAI’s tech delivers top-tier language processing.'),
    ],
    images={
        "openai_api_dynamic_conversational_system.webp": f"{settings.PROJECT_BASE_IMG_URL}/openai_api_dynamic_conversational_system.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["openai_api"],
    ],
    github_url='',
    demo_url='',
    category='AI, Chatbot, OpenAI, NLP',
    tags=['OpenAI', 'GPT-3.5 Turbo', 'Chatbot', 'NLP', 'Flask', 'Python', 'Conversational AI', 'API'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
