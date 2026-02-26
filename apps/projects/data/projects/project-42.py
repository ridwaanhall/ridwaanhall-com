"""
Project #42: PDDikti Data Vault
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=42,
    title='PDDikti Data Vault',
    headline='API unlocking Indonesia’s higher education data from PDDikti.',
    description=['This API pulls fresh, juicy data from PDDikti, Indonesia’s higher ed database, covering universities, programs, and more.', 'Built for researchers and devs, it offers clear endpoints to snag structured info like accreditation stats.', 'Caching and optimizations keep it blazing fast under heavy traffic, with docs that make integration a breeze.'],
    features=[
        Feature(title='Edu Data', description='Easy access to uni and program info.'),
        Feature(title='Dev-Friendly', description='Simple setup for coders.'),
        Feature(title='Fresh Stats', description='Always-updated PDDikti data.'),
    ],
    images={
        "api_pddikti_kemendiksaintek.webp": f"{settings.PROJECT_BASE_IMG_URL}/api_pddikti_kemendiksaintek.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["javascript"],
        SkillsData.tech_stack["css"],
    ],
    github_url='https://github.com/ridwaanhall/api-pddikti',
    demo_url='https://pddikti-docs.ridwaanhall.com/',
    category='API, Education, Data Integration',
    tags=['API', 'PDDikti', 'Indonesia', 'Higher Education', 'Data Integration', 'Django', 'Python', 'Accreditation', 'University Data', 'Open Data'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2025-07-06T16:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-07-06T16:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
