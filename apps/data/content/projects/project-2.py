"""
Project #2: TikTok Profile Digger
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: TikTok Profile Digger
project_data = {
    "id": 2,
    "title": """TikTok Profile Digger""",
    "headline": """Scoop all the hot TikTok profile deets with Python and BeautifulSoup flair.""",
    "description": ['This Python project dives deep into TikTok profiles, snagging all the good stuff.', 'With BeautifulSoup, it pulls username, bio, followers, following, and likes straight from the page.', 'Perfect for data nerds and TikTok stalkers—saves time and sparks curiosity!'],
    "images": {
        "tiktok_data_extractor.webp": f"{settings.PROJECT_BASE_IMG_URL}/tiktok_data_extractor.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Ultimate Data Grab', 'description': 'Snatches username, bio, followers, following, and likes in one swoop.'}, {'title': 'BeautifulSoup Magic', 'description': 'Parses TikTok’s HTML like a boss with BeautifulSoup.'}, {'title': 'Curiosity Crusher', 'description': 'Ideal for research, insights, or just feeding your TikTok obsession.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["beautifulsoup"]
    ],
    "github_url": "",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-04-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Web Scraping, Social Media, Data Extraction",
    "tags": [
        "TikTok",
        "Web Scraping",
        "BeautifulSoup",
        "Python",
        "Profile Data",
        "Followers",
        "Bio Extraction",
        "Social Media",
        "Data Mining"
    ],
    "priority": 1,
    "slug": ""
}
