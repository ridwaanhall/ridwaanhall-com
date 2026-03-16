from dataclasses import asdict
from datetime import datetime
from django.conf import settings
from apps.projects.types import Feature, ProjectData, ProjectStatus
from apps.about.data.skills_data import SkillsData

# SEO-Optimized Project Data
project_data = asdict(ProjectData(
    # Core Identity
    id=64,
    title="MLBB Identity Card",
    headline="Web-based identity card displaying authenticated MLBB ranked stats and battle highlights.",

    # Detailed Description
    description=[
        "Built with Django and TailwindCSS, optimized for responsive UI and clean data presentation.",
        "Displays authenticated user profile snapshot, rank history, performance stats, and battle highlights.",
        "Aggregates hero usage statistics from ranked matches with win rate, average score, and match rating.",
        "Provides recent match history with KDA, lane, score, and MVP status.",
        "Designed with modular components for easy extension to new data sources or game modes.",
    ],

    # Key Features
    features=[
        Feature(
            title="Profile Snapshot",
            description="Shows player avatar, ID, current rank, highest rank, level, role, and zone."
        ),
        Feature(
            title="Performance Stats",
            description="Aggregated gameplay metrics including win rate, average score, MVP rate, and play time."
        ),
        Feature(
            title="Battle Highlights",
            description="Top records by category such as most kills, assists, damage, and gold."
        ),
        Feature(
            title="Recent Matches",
            description="Latest battle history from selected season with detailed match data."
        ),
        Feature(
            title="Most Played Heroes",
            description="Aggregated hero usage stats including win rate, average score, and match rating."
        ),
    ],

    # Media
    images={
        "mlbb_identity_card.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_identity_card.webp",
        "mlbb_identity_card_page.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_identity_card_page.webp",
    },

    # Tech Stack
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["tailwindcss"],
    ],

    # Links
    github_url=None,
    demo_url="https://mlbb-card.rone.dev",

    # SEO & Categorization
    category="gaming",
    tags=[
        "mlbb", "identity-card", "django", "tailwindcss",
        "ranked-stats", "battle-highlights", "hero-usage",
    ],

    # Status
    is_featured=False,
    featured_priority=0,
    status=ProjectStatus.DEVELOPMENT_IN_PROGRESS,

    # Timestamps
    created_at=datetime.strptime("2026-01-16T21:35:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=None,
))
