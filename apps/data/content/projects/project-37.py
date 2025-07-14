"""
Project #37: Insta Follow Analyzer
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Insta Follow Analyzer
project_data = {
    "id": 37,
    "title": """Insta Follow Analyzer""",
    "headline": """Python tool to dissect Instagram follower dynamics.""",
    "description": ['This Python script breaks down Instagram followers and following, spotting mutuals, non-followers, and more.', 'Perfect for influencers and managers to find engagement gaps or networking opportunities.', 'Spits out detailed stats and lists from JSON data for outreach or deeper analysis.'],
    "images": {
        "instagram_following_followers_v2.webp": f"{settings.PROJECT_BASE_IMG_URL}/instagram_following_followers_v2.webp",
        "instagram_following_followers_v22.webp": f"{settings.PROJECT_BASE_IMG_URL}/instagram_following_followers_v22.webp"
    },
    "is_featured": True,
    "features": [{'title': 'Follower Breakdown', 'description': 'Lists mutuals and one-sided followers.'}, {'title': 'Following Insights', 'description': 'Tracks who you follow without reciprocation.'}, {'title': 'JSON Support', 'description': 'Handles Instagram data like a pro.'}],
    "tech_stack": [
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["tailwindcss"],
        SkillsData.tech_stack["whitenoise"]
    ],
    "github_url": "https://github.com/ridwaanhall/instagram-following-followers",
    "demo_url": "https://igstats.ridwaanhall.com",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2025-07-15T02:39:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Social Media, Analytics, Instagram, Python Script",
    "tags": [
        "Instagram",
        "Analytics",
        "Followers",
        "Following",
        "Python",
        "JSON Data",
        "Engagement",
        "Influencer Tool",
        "Social Media"
    ],
    "priority": 1,
    "slug": ""
}
