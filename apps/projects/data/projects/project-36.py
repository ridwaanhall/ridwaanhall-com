"""
Project #36: Neon AI
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=36,
    title='Neon AI',
    headline='Next.js-powered AI chatbot with Once UI and slick vibes.',
    description=['Neon AI is a next-level chatbot built on Next.js and Once UI, with seamless routing and unified APIs.', 'Delivers instant, natural responses using streaming tech for a smooth conversational flow.', 'Tracks context for coherent chats and presents data in visually dope formats.'],
    features=[
        Feature(title='Smart Routing', description='Next.js App Router for zippy navigation.'),
        Feature(title='AI Power', description='Unified API for text and tool calls.'),
        Feature(title='Data Storage', description='Vercel Postgres and Blob for efficiency.'),
    ],
    images={
        "neon_ai.webp": f"{settings.PROJECT_BASE_IMG_URL}/neon_ai.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["nextjs"],
        SkillsData.tech_stack["tailwindcss"],
        SkillsData.tech_stack["typescript"],
        SkillsData.tech_stack["postgresql"],
        SkillsData.tech_stack["radix_ui"],
    ],
    github_url='https://github.com/ridwaanhall/neon-ai',
    demo_url='https://chat.ridwaanhall.com',
    category='AI, Chatbot, Web App, Next.js',
    tags=['AI Chatbot', 'Next.js', 'Once UI', 'TailwindCSS', 'TypeScript', 'Vercel Postgres', 'Radix UI', 'Streaming API', 'Conversational AI', 'Web App'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
