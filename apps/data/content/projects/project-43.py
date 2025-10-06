"""
Project #43: BeliMadu.com
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: BeliMadu.com
project_data = {
    # Identity
    "id": 43,
    "title": "BeliMadu.com",
    "headline": "E-commerce hotspot for honey treats, built with Django and Bootstrap on Vercel.",

    # Core Content
    "description": [
        "Belimadu.com is your go-to e-commerce hub for honey products, crafted with Django and Bootstrap, hosted on Vercel. It’s loaded with a product catalog, health tips, WhatsApp ordering, and monthly deals.",
        "A sweet spot for honey fans, mixing helpful articles with a smooth shopping experience. SEO tweaks make it shine on Google.",
        "Customers can hit up WhatsApp for quick orders, and monthly promos keep the buzz alive with fresh offers."
    ],
    "features": [
        {
            "title": "Honey Catalog",
            "description": "Lists products with crisp images and details."
        },
        {
            "title": "WhatsApp Orders",
            "description": "Chat directly to place orders fast."
        },
        {
            "title": "Hot Deals",
            "description": "Monthly specials on seasonal honey picks."
        }
    ],
    "images": {
        "belimadu_com.webp": f"{settings.PROJECT_BASE_IMG_URL}/belimadu_com.webp"
    },

    # Tech & Resources
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["bootstrap"],
        SkillsData.tech_stack["vercel"]
    ],
    "github_url": "",
    "demo_url": "https://belimadu.com",

    # Classification
    "category": "E-commerce",
    "tags": [
        "django",
        "e-commerce",
        "bootstrap",
        "vercel",
        "honey",
        "whatsapp",
        "seo"
    ],

    # Status & Meta
    "is_featured": False,
    "featured_priority": None,
    "status": "completed",
    "created_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
}
