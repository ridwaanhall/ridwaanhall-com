"""
Project #54: Django Modular System
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=54,
    title='Django Modular System',
    headline='A powerful Django-based modular system enabling dynamic installation, upgrading, and uninstallation of application modules with role-based access control.',
    description=['This project provides a flexible modular architecture for Django applications, allowing developers to install, upgrade, and uninstall modules dynamically without restarting the application.', 'It includes role-based access control with Manager, User, and Public roles, ensuring granular permission management.', 'The system features a centralized module registry, automated database migrations, and user-friendly confirmation dialogs for destructive operations.', 'Technical highlights include RESTful architecture, template inheritance, signal-based registration, and optimized static file handling.', 'A reference Product Module demonstrates CRUD operations, role-based views, and audit trails for creation and modification dates.'],
    features=[
        Feature(title='Dynamic Module Management', description='Install, upgrade, and uninstall modules without restarting the application.'),
        Feature(title='Role-Based Access Control', description='Granular permissions with Manager, User, and Public roles.'),
        Feature(title='Module Registry', description='Centralized tracking of module states, versions, and metadata.'),
        Feature(title='Database Migrations', description='Automated schema changes during module operations.'),
        Feature(title='RESTful Architecture', description='Clean URL patterns and HTTP methods for module endpoints.'),
    ],
    images={
        "django_modular_flowchart.webp": f"{settings.PROJECT_BASE_IMG_URL}/django_modular_flowchart.webp",
        "django_modular_architecture.webp": f"{settings.PROJECT_BASE_IMG_URL}/django_modular_architecture.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["postgresql"],
        SkillsData.tech_stack["vercel"],
    ],
    github_url='https://github.com/ridwaanhall/django-app-modular',
    demo_url='',
    category='web-development',
    tags=['django', 'modular-system', 'role-based-access', 'dynamic-modules', 'rest-api', 'postgresql', 'python', 'extensible-architecture', 'automation', 'web-app'],
    is_featured=False,
    featured_priority=None,
    status='active',
    created_at=datetime.strptime("2025-03-06T15:33:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-09-29T20:42:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
