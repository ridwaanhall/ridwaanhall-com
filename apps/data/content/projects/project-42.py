"""
Project #42: PDDikti Data Vault
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: PDDikti Data Vault
project_data = {
    "id": 42,
    "title": """PDDikti Data Vault""",
    "headline": """API unlocking Indonesia’s higher education data from PDDikti.""",
    "description": ['This API pulls fresh, juicy data from PDDikti, Indonesia’s higher ed database, covering universities, programs, and more.', 'Built for researchers and devs, it offers clear endpoints to snag structured info like accreditation stats.', 'Caching and optimizations keep it blazing fast under heavy traffic, with docs that make integration a breeze.'],
    "images": {
        "api_pddikti_kemendiksaintek.webp": f"{settings.PROJECT_BASE_IMG_URL}/api_pddikti_kemendiksaintek.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Edu Data', 'description': 'Easy access to uni and program info.'}, {'title': 'Dev-Friendly', 'description': 'Simple setup for coders.'}, {'title': 'Fresh Stats', 'description': 'Always-updated PDDikti data.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["javascript"],
        SkillsData.tech_stack["css"]
    ],
    "github_url": "https://github.com/ridwaanhall/api-pddikti",
    "demo_url": "https://pddikti-docs.ridwaanhall.com/",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2025-07-06T16:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "API, Education, Data Integration",
    "tags": [
        "API",
        "PDDikti",
        "Indonesia",
        "Higher Education",
        "Data Integration",
        "Django",
        "Python",
        "Accreditation",
        "University Data",
        "Open Data"
    ],
    "priority": 1,
    "slug": ""
}
