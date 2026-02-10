"""
Project #56: Django Real-Time Sync with WebSocket
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=56,
    title='Django Real-Time Sync with WebSocket',
    headline='A Django project enabling real-time message synchronization across multiple browser tabs using WebSocket and Redis.',
    description=['This project demonstrates real-time communication in Django using WebSocket technology.', 'Messages sent from one browser tab are instantly broadcast to all other tabs without page refresh.', 'It uses Django Channels with Redis as the channel layer for scalable message delivery.', 'The frontend connects to a WebSocket endpoint and joins a channel group for synchronized messaging.', 'Includes a responsive UI and deployment-ready configuration with ASGI support.'],
    features=[
        Feature(title='Real-time Messaging', description='Synchronizes messages across multiple tabs instantly using WebSocket.'),
        Feature(title='WebSocket Communication', description='Establishes persistent WebSocket connections for bidirectional data flow.'),
        Feature(title='Redis Channel Layer', description='Uses Redis to manage channel groups and broadcast messages efficiently.'),
        Feature(title='Responsive UI', description='Provides a clean and interactive interface for sending and viewing messages.'),
        Feature(title='ASGI Deployment Ready', description='Configured for production deployment with ASGI servers like Daphne or Uvicorn.'),
    ],
    images={
        "default_image.webp": f"{settings.PROJECT_BASE_IMG_URL}/default_image.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["redis"],
        SkillsData.tech_stack["docker"],
    ],
    github_url='https://github.com/ridwaanhall/django-syncwave',
    demo_url='',
    category='websocket-sync',
    tags=['django', 'websocket', 'real-time', 'redis', 'channels', 'asgi', 'message-sync', 'frontend', 'multi-tab', 'python'],
    is_featured=False,
    featured_priority=None,
    status='Completed',
    created_at=datetime.strptime("2025-10-13T01:07:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-10-15T19:06:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
