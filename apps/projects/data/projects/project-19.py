"""
Project #19: CRM Lite | User Management
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=19,
    title='CRM Lite | User Management',
    headline='Keep user data in check with this slick Django-powered CRM.',
    description=['This Django web app makes managing user data a walk in the park for any org.', 'Handles registration, login, and full CRUD ops for total control.', 'Perfect for HR, support teams, or anyone needing a clean user management fix.'],
    features=[
        Feature(title='CRUD Mastery', description='Add, view, edit, or delete records with ease.'),
        Feature(title='Secure Access', description='Rock-solid registration and login flows.'),
        Feature(title='Slick Dashboard', description='Intuitive tools for quick sorting and access.'),
    ],
    images={
        "crm_simple_user_management_home.webp": f"{settings.PROJECT_BASE_IMG_URL}/crm_simple_user_management_home.webp",
        "crm_simple_user_management.webp": f"{settings.PROJECT_BASE_IMG_URL}/crm_simple_user_management.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
    ],
    github_url='https://github.com/ridwaanhall/CRUD-mastery-with-Django',
    demo_url='',
    category='Web App, CRM, User Management, Django',
    tags=['CRM', 'User Management', 'Django', 'Python', 'CRUD', 'Web App', 'Dashboard', 'HR', 'Support Tool'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-11-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-11-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
