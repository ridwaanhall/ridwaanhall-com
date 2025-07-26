"""
Project #7: Insta Media Grabber API
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Insta Media Grabber API
project_data = {
    "id": 7,
    "title": """Insta Media Grabber API""",
    "headline": """Yo, snatch Instagram pics, stories, and posts in HD with Flask and save-free.com.""",
    "description": ['This Flask-powered API is your ticket to downloading Instagram profile pics, stories, and post media in crisp HD.', 'Taps into save-free.com for legit, reliable media fetching without the fuss.', 'Perfect for quick, no-sweat media downloads that keep things smooth.'],
    "images": {
        "instagram_media_downloader.webp": f"{settings.PROJECT_BASE_IMG_URL}/instagram_media_downloader.webp"
    },
    "is_featured": False,
    "features": [{'title': 'HD Profile Pics', 'description': 'Grab crystal-clear profile pictures in a snap.'}, {'title': 'Story Swiper', 'description': 'Download Instagram stories like it’s nothing.'}, {'title': 'Post Media Magic', 'description': 'Scoop up images and videos from posts in a heartbeat.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"]
    ],
    "github_url": "",
    "demo_url": "https://instagram-api-v1.ridwaanhall.repl.co/",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "API, Social Media, Instagram, Flask",
    "tags": [
        "Instagram",
        "API",
        "Flask",
        "Media Downloader",
        "Profile Picture",
        "Stories",
        "Post Media",
        "Python",
        "HD Download"
    ],
    "priority": 1,
    "slug": ""
}
