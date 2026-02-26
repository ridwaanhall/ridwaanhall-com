"""
Project #30: Indonesia Route Optimizer
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=30,
    title='Indonesia Route Optimizer',
    headline='Find the best paths across Indonesia with ACO and slick visualizations.',
    description=['This project brings Ant Colony Optimization (ACO) to life on a real map of Indonesia for next-level route planning.', 'Tweakable parameters and visualization tools let you track the algorithm’s progress in style.', 'Built to deliver practical insights and boost efficiency for pathfinding challenges.'],
    features=[
        Feature(title='Real-World Mapping', description='Optimizes routes using Indonesia’s actual geography.'),
        Feature(title='Visual Progress', description='Watch the algorithm work with clear visualizations.'),
        Feature(title='Tuning Mastery', description='Fine-tune parameters for peak optimization results.'),
    ],
    images={
        "aco_algorithm_indonesia_province_city.webp": f"{settings.PROJECT_BASE_IMG_URL}/aco_algorithm_indonesia_province_city.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["aco"],
    ],
    github_url='https://github.com/ridwaanhall/aco-algorithm',
    demo_url='',
    category='Optimization, Algorithm, Visualization, Mapping',
    tags=['Ant Colony Optimization', 'ACO', 'Route Planning', 'Indonesia', 'Python', 'Visualization', 'Mapping', 'Pathfinding', 'Algorithm'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2024-12-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2024-12-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
