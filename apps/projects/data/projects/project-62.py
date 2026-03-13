from dataclasses import asdict
from datetime import datetime
from django.conf import settings
from apps.projects.types import Feature, ProjectData, ProjectStatus
from apps.about.data.skills_data import SkillsData

# SEO-Optimized Project Data
project_data = asdict(ProjectData(
    # Core Identity
    id=62,
    title="IHSG Sharia AlgoTrader",
    headline="Automated trading system for IHSG Sharia stocks with scalping, day trading, and swing trading strategies.",

    # Detailed Description
    description=[
        "Developed with Python and Django, integrating Stockbit broker API for real-time trading execution.",
        "Implements multiple trading styles: scalping, day trading, and swing trading with configurable risk management.",
        "Uses Pandas and NumPy for data analysis, with TA-Lib for technical indicators.",
        "Backtesting engine included to validate strategies against historical IHSG Sharia data.",
        "Deployment-ready with modular architecture, supporting extension for new strategies and brokers.",
    ],

    # Key Features
    features=[
        Feature(
            title="Multi-Strategy Trading",
            description="Supports scalping, day trading, and swing trading strategies tailored for IHSG Sharia stocks."
        ),
        Feature(
            title="Broker Integration",
            description="Connected to Stockbit broker with RDN account support for live trading."
        ),
        Feature(
            title="Risk Management",
            description="Configurable stop-loss, take-profit, and position sizing for safe trading."
        ),
        Feature(
            title="Backtesting Engine",
            description="Validate strategies using historical IHSG Sharia data before live deployment."
        ),
        Feature(
            title="Extensible Architecture",
            description="Easily add new strategies, brokers, or indicators with modular design."
        ),
    ],

    # Media
    images={
        "ihsg_sharia_overview.webp": f"{settings.PROJECT_BASE_IMG_URL}/ihsg_sharia_overview.webp",
    },

    # Tech Stack
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["pandas"],
        SkillsData.tech_stack["numpy"],
    ],

    # Links
    github_url=None,
    demo_url=None,

    # SEO & Categorization
    category="fintech",
    tags=[
        "python", "django", "ihsg", "sharia", "trading",
        "scalping", "day-trading", "swing-trading",
        "stockbit", "algorithmic-trading", "backtesting",
    ],

    # Status
    is_featured=False,
    featured_priority=None,
    status=ProjectStatus.PLANNING_REQUIREMENTS,

    # Timestamps
    created_at=datetime.strptime("2026-03-13T15:28:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=None,
))
