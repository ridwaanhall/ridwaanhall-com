from dataclasses import asdict
from datetime import datetime
from django.conf import settings
from apps.projects.types import Feature, ProjectData, ProjectStatus
from apps.about.data.skills_data import SkillsData

# SEO-Optimized Project Data
project_data = asdict(ProjectData(
    # Core Identity
    id=64,  
    title="MLBB Academy",
    headline="A full-stack Next.js 16 application for Mobile Legends: Bang Bang featuring comprehensive hero stats, global rankings, and authenticated account history.",

    # Detailed Description
    description=[
        "Pulls live data from the MLBB Public Data API to present a fast, dark-themed interface built for players who want actionable gameplay information in one place.",
        "Features a comprehensive hero database with 8 specialized tabs covering overview, live stats, skill combos, counters, team compatibility, usage trends, recommended builds, and community guides.",
        "Includes a full global leaderboard sortable by win rate, pick rate, and ban rate, enhanced with rank-tier filters and a dedicated counter-hero column.",
        "Provides an authenticated account profile portal via secure send-VC login, allowing users to view their ranked history, detailed match breakdowns, and most frequent heroes.",
        "Houses an extensive Academy Reference catalog detailing game roles, searchable equipment, battle spells, emblems, and game version history.",
        "Offers specialized utility tools, including a win-rate calculator, IP geolocation lookup, and interactive community ratings polls.",
        "Built on a robust Next.js App Router architecture with a unified client module handling all API traffic and leveraging a two-tier caching system for maximum performance.",
        "Styled exclusively in a sleek dark mode using Vercel's Geist design system and Tailwind CSS v4, with full internationalization (i18n) support for English, Indonesian, and Russian.",
    ],

    # Key Features
    features=[
        Feature(
            title="Advanced Hero Analytics",
            description="Browse heroes with role/lane filters and view deep statistics including counters, skill combos, and trends."
        ),
        Feature(
            title="Global Rankings & Leaderboards",
            description="Sortable hero leaderboards by win, pick, and ban rates with precise rank-tier filtering."
        ),
        Feature(
            title="Authenticated Player Profiles",
            description="Secure login to view personal ranked history, detailed match breakdowns (KDA, damage share), and friends lists."
        ),
        Feature(
            title="Academy Reference Hub",
            description="Complete catalogs for equipment, spells, emblems, and rank tiers with community-driven guides."
        ),
        Feature(
            title="Player Utility Tools",
            description="Integrated win-rate calculator, IP geolocation lookup, and community hero popularity polls."
        ),
    ],

    # Media (Placeholders based on your naming convention)
    images={
        "mlbb_academy_account.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_academy_account.webp",
        "mlbb_academy_home.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_academy_home.webp",
        "mlbb_academy_heroes.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_academy_heroes.webp",
        "mlbb_academy_rankings.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_academy_rankings.webp",
    },

    # Tech Stack
    tech_stack=[
        SkillsData.tech_stack["nextjs"],
        SkillsData.tech_stack["react"],
        SkillsData.tech_stack["typescript"],
        SkillsData.tech_stack["tailwindcss"],
        SkillsData.tech_stack["cloudflare"], 
    ],

    # Links
    github_url="https://github.com/ridwaanhall/mlbb-academy",
    demo_url="https://mlbb-academy.rone.dev",

    # SEO & Categorization
    category="gaming",
    tags=[
        "mlbb", "nextjs", "react", "typescript", "tailwindcss",
        "cloudflare-workers", "api-integration", "gaming-stats",
    ],

    # Status
    is_featured=True,
    featured_priority=6,
    status=ProjectStatus.COMPLETED,

    # Timestamps 
    created_at=datetime.strptime("2026-06-21T15:30:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2026-06-28T20:11:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))