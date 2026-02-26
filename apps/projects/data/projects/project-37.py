"""
Project #37: Insta Follow Analyzer
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=37,
    title='Insta Follow Analyzer',
    headline='Python tool to dissect Instagram follower dynamics.',
    description=['This Python script breaks down Instagram followers and following, spotting mutuals, non-followers, and more.', 'Perfect for influencers and managers to find engagement gaps or networking opportunities.', 'Spits out detailed stats and lists from JSON data for outreach or deeper analysis.'],
    features=[
        Feature(title='Follower Breakdown', description='Lists mutuals and one-sided followers.'),
        Feature(title='Following Insights', description='Tracks who you follow without reciprocation.'),
        Feature(title='JSON Support', description='Handles Instagram data like a pro.'),
    ],
    images={
        "instagram_following_followers_v2.webp": f"{settings.PROJECT_BASE_IMG_URL}/instagram_following_followers_v2.webp",
        "instagram_following_followers_v22.webp": f"{settings.PROJECT_BASE_IMG_URL}/instagram_following_followers_v22.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["tailwindcss"],
        SkillsData.tech_stack["whitenoise"],
    ],
    github_url='https://github.com/ridwaanhall/instagram-following-followers',
    demo_url='https://igstats.ridwaanhall.com',
    category='Social Media, Analytics, Instagram, Python Script',
    tags=['Instagram', 'Analytics', 'Followers', 'Following', 'Python', 'JSON Data', 'Engagement', 'Influencer Tool', 'Social Media'],
    is_featured=True,
    featured_priority=4,
    status='completed',
    created_at=datetime.strptime("2025-07-15T02:39:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-07-15T02:39:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
