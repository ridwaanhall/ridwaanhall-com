"""
Project #46: Indonesia Gold Price Vibe
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=46,
    title='Indonesia Gold Price Vibe',
    headline='Stay locked in with real-time gold price updates and dope historical trends for Indonesia.',
    description=['This project’s got you covered with live gold prices in Indonesia, tracking the market’s every move while keeping an eye on the big picture.', 'Dive into 5 years of historical data to catch price spikes, dips, and market flows—perfect for leveling up your investment game.', 'More than just numbers, it drops next-level financial insights like simple moving averages (SMA) and volatility breakdowns to break down what’s driving the market.', 'Slick interactive charts let you visualize trends without wading through boring data.', 'Whether you’re a hardcore investor or just vibing with gold prices, this tool keeps you plugged in with fresh, reliable updates.'],
    features=[
        Feature(title='Live Price Drops', description='Gold prices updated on the regular to keep you in sync with the market.'),
        Feature(title='Throwback Trends', description='Deep dive into past price action across different timeframes.'),
        Feature(title='Smart Analytics', description='SMA calculations and volatility insights to keep it 100.'),
    ],
    images={
        "indonesia_gold_price_tracker.webp": f"{settings.PROJECT_BASE_IMG_URL}/indonesia_gold_price_tracker.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["tailwindcss"],
        SkillsData.tech_stack["vercel"],
    ],
    github_url='',
    demo_url='https://finance.ridwaanhall.com',
    category='finance',
    tags=['gold', 'price tracker', 'indonesia', 'analytics', 'finance', 'lstm'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2025-04-26T16:35:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-04-26T16:35:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
