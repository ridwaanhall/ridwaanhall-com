"""
Project #50: BSJP
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: BSJP
project_data = {
    "id": 50,
    "title": """BSJP""",
    "headline": """An Indonesian stock strategy system that identifies promising stocks to buy at market close and sell at the next morning’s open.""",
    "description": [
        'BSJP (Beli Sore, Jual Pagi) is a Django-based platform that analyzes overnight price movements to optimize short-term trading gains.',
        'It uses technical indicators like moving averages and volume trends to evaluate stock performance.',
        'The system supports CSV-based bulk data import and includes a custom management command for streamlined ingestion.',
        'Evaluation metrics include Open-Close (OC) and High-Low (HL) analysis, helping traders assess risk and opportunity.',
        'The project is deployed via Vercel and features a responsive web interface for stock analysis.'
    ],
    "images": {
        "bsjp_admin.webp": f"{settings.PROJECT_BASE_IMG_URL}/bsjp_admin.webp",
        "bsjp.webp": f"{settings.PROJECT_BASE_IMG_URL}/bsjp.webp"
    },
    "is_featured": False,
    "featured_priority": None,
    "features": [
        {'title': 'Technical Analysis Engine', 'description': 'Implements 5-day moving averages, volume trends, and price evaluations for stock selection.'},
        {'title': 'Trading Calendar Management', 'description': 'Handles normalized trading dates and schedules for accurate data alignment.'},
        {'title': 'Admin Dashboard', 'description': 'Django Admin interface for managing stock symbols, trading dates, and evaluation results.'},
        {'title': 'CSV Data Import', 'description': 'Bulk import system for daily stock data using custom Django management commands.'},
        {'title': 'Responsive Web Interface', 'description': 'User-friendly frontend for viewing and analyzing stock performance.'}
    ],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["postgresql"],
    ],
    "demo_url": "https://bsjp.ridwaanhall.com",
    "status": "completed",
    "created_at": datetime.strptime("2025-08-08T08:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-09-08T17:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "finance",
    "tags": ["stocks", "trading", "indonesia", "django", "csv", "technical-analysis", "short-term", "bsjp", "vercel", "admin-dashboard"],
}
