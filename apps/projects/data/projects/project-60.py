"""
Project #60: Gempa - Earthquake Monitoring Dashboard
"""

from dataclasses import asdict
from datetime import datetime
from django.conf import settings
from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=60,
    title="Gempa - Earthquake Monitoring Dashboard",
    headline="A modern, responsive web dashboard for monitoring earthquakes in Indonesia, powered by BMKG data and interactive maps.",
    description=[
        "Built with Django and Python as the backend framework, ensuring scalability and maintainability.",
        "Real-time earthquake data integration from BMKG official sources, automatically updated to reflect the latest seismic activity.",
        "Interactive maps powered by Leaflet.js to visualize recent and historical seismic events with dynamic markers and tooltips.",
        "Filtered views for felt earthquakes, magnitude 5+, tsunami alerts, and damaging events, enabling users to quickly identify critical incidents.",
        "Detailed modals with event analysis, metadata, charts, and BMKG-provided images for deeper insights into each earthquake.",
        "Responsive design optimized for both desktop and mobile devices, ensuring accessibility across platforms.",
        "Clean, component-based UI styled with Tailwind CSS, adopting glassmorphism-inspired layouts for modern aesthetics.",
        "Deployment configured via Vercel with vercel.json for production-ready builds, routing, and environment-based configuration.",
        "Supports integration with DataTables for tabular earthquake records, enabling sorting, searching, and pagination.",
        "Designed with modular architecture, making it easy to extend features such as historical archives, user alerts, or disaster preparedness resources.",
        "Focus on usability and clarity, ensuring that both technical and non-technical users can navigate and interpret earthquake data effectively.",
    ],
    features=[
        Feature(
            title="Real-Time BMKG Data",
            description="Fetches and displays live earthquake data from BMKG, including recent and historical seismic activity."
        ),
        Feature(
            title="Interactive Maps",
            description="Leaflet.js integration for dynamic maps showing earthquake epicenters, magnitudes, and affected regions."
        ),
        Feature(
            title="Filtered Views",
            description="Custom filters for felt earthquakes, magnitude 5+, tsunami alerts, and damaging events."
        ),
        Feature(
            title="Detailed Event Modals",
            description="Provides in-depth analysis with metadata, charts, and BMKG images for each earthquake event."
        ),
        Feature(
            title="Responsive UI",
            description="Glassmorphism-inspired, component-based design built with Tailwind CSS for seamless desktop and mobile experiences."
        ),
        Feature(
            title="Deployment on Vercel",
            description="Configured with vercel.json for production-ready builds and routing."
        ),
    ],
    images={
        "gempa_dashboard.webp": f"{settings.PROJECT_BASE_IMG_URL}/gempa_dashboard.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["tailwindcss"],
        SkillsData.tech_stack["leaflet"],
        SkillsData.tech_stack["jquery"],
    ],
    github_url="https://github.com/ridwaanhall/gempa",
    demo_url="https://gempa.rone.dev",
    category="web-development",
    tags=[
        "django", "python", "bmkg", "earthquake-monitoring", "leaflet",
        "tailwind", "responsive-ui", "vercel", "datatables", "maps",
    ],
    is_featured=False,
    featured_priority=None,
    status="completed",
    created_at=datetime.strptime("2026-02-06T19:04:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2026-03-02T16:48:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
