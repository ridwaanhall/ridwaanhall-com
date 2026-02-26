"""
Project #10: ChatBot Bridge for Telegram & WhatsApp
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=10,
    title='ChatBot Bridge for Telegram & WhatsApp',
    headline='Link up OpenAI-powered bots to Telegram and WhatsApp with Flask swagger.',
    description=['This Flask project is your slick gateway for handling Telegram and WhatsApp messages with POST and GET requests.', 'Taps into OpenAI for next-level, smart convo vibes.', 'Perfect for automating chats or building brainy bot solutions.'],
    features=[
        Feature(title='Flask Flow', description='Routes messages like a boss for seamless bot chats.'),
        Feature(title='App-Agnostic', description='Works like a charm on Telegram and WhatsApp.'),
        Feature(title='OpenAI Smarts', description='Drops AI-powered replies for sharper convos.'),
    ],
    images={
        "chatbot_gateway.webp": f"{settings.PROJECT_BASE_IMG_URL}/chatbot_gateway.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["openai_api"],
    ],
    github_url='',
    demo_url='',
    category='API, Chatbot, Messaging, Flask',
    tags=['Chatbot', 'Telegram', 'WhatsApp', 'OpenAI', 'Flask', 'Python', 'Messaging', 'Automation', 'Bot Integration'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
