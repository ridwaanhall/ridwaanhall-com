"""
Project #28: My Portfolio in Django integrated with Database
"""

from dataclasses import asdict
from datetime import datetime
from django.conf import settings
from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=28,
    title='My Portfolio in Django integrated with Database',
    headline='A full-featured personal portfolio website built with Django, backed by a relational database, and integrated with the GitHub API.',
    description=[
        'Personal portfolio website developed using Django 3.2 and Python.',
        'All content (projects, education, skills, career, credentials) stored in a SQLite database managed via Django ORM.',
        'GitHub GraphQL API integration to display live contribution activity and heatmap.',
        'Admin dashboard for full CRUD management of all portfolio sections.',
        'Dynamic templates built with Bootstrap and Vuexy-inspired layouts.',
        'Deployed on Replit with environment-variable-based configuration.',
        'Supports authentication, contact form, certificate showcase, and quote-of-the-day.',
    ],
    features=[
        Feature(
            title='Database-Driven Content',
            description='All portfolio data including projects, education, skills, career history, and credentials are stored in and served from a SQLite database via Django ORM.'
        ),
        Feature(
            title='GitHub API Integration',
            description='Fetches live contribution calendar and activity data from GitHub GraphQL API to display an interactive heatmap on the portfolio.'
        ),
        Feature(
            title='Admin Dashboard',
            description='Full Django admin interface for CRUD operations across all models: Project, Career, Education, Skill, Credential, Certificate, Quote, and more.'
        ),
        Feature(
            title='Authentication &amp; Contact',
            description='User login/logout, superuser management, and a contact form with message storage in the database.'
        ),
        Feature(
            title='Dynamic Templates',
            description='Responsive HTML templates using Bootstrap with modular components for navbar, footer, sidebar, and content sections.'
        ),
        Feature(
            title='Career &amp; Credentials',
            description='Dedicated sections for work experience with responsibilities, employment type, location type, and duration calculation, plus credential/certificate listings.'
        ),
        Feature(
            title='Data Export',
            description='Management command to export all database records to JSON fixture files for backup and migration.'
        ),
    ],
    images={
        "portfolio-v1.webp": f"{settings.PROJECT_BASE_IMG_URL}/portfolio-v1.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["bootstrap"],
        SkillsData.tech_stack["github"],
        SkillsData.tech_stack["sqlite"],
        SkillsData.tech_stack["replit"],
    ],
    github_url='https://github.com/ridwaanhall/my-portfolio',
    demo_url=None,
    category='web-development',
    tags=[
        'django', 'python', 'portfolio', 'bootstrap', 'sqlite',
        'github-api', 'crud', 'admin-dashboard', 'authentication',
        'database', 'replit', 'career', 'credentials',
    ],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-11-26T17:05:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2024-12-30T15:06:58+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))