"""
Project #44: ridwaanhall.com
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: ridwaanhall.com
project_data = {
    "id": 44,
    "title": """ridwaanhall.com""",
    "headline": """Advanced developer portfolio platform with individual file data management, real-time API integrations, and enterprise-grade security.""",
    "description": [
        'FlexForge is a modern portfolio template built with Django and TailwindCSS, featuring an innovative individual file system where each project and blog post exists as a separate Python file for easy management and version control.',
        'Achieves exceptional performance with 99+/100 PageSpeed scores across all metrics (Performance: 98, Accessibility: 100, Best Practices: 100, SEO: 100). The platform includes real-time GitHub and WakaTime API integrations, configurable guestbook with OAuth authentication, and enterprise-grade security features.',
        'Built with scalability in mind, featuring intelligent caching, image optimization, and a responsive design that works perfectly on any device. The dashboard displays live coding statistics and analytics in real-time.'
    ],
    "images": {
        "ridwaanhall_com_2025070701.webp": f"{settings.PROJECT_BASE_IMG_URL}/ridwaanhall_com_2025070701.webp",
        "ridwaanhall_com_2025070702.webp": f"{settings.PROJECT_BASE_IMG_URL}/ridwaanhall_com_2025070702.webp",
        "ridwaanhall_com_2025070703.webp": f"{settings.PROJECT_BASE_IMG_URL}/ridwaanhall_com_2025070703.webp",
        "ridwaanhall_com_2025070804.webp": f"{settings.PROJECT_BASE_IMG_URL}/ridwaanhall_com_2025070804.webp",
        "ridwaanhall_com_2025070805.webp": f"{settings.PROJECT_BASE_IMG_URL}/ridwaanhall_com_2025070805.webp",
    },
    "is_featured": True,
    "features": [
        {
            "title": "Individual File System",
            "description": "Revolutionary content management with each project and blog post as separate Python files."
        },
        {
            "title": "High Performance",
            "description": "99+/100 PageSpeed scores with 98 Performance, 100 Accessibility, 100 Best Practices, 100 SEO."
        },
        {
            "title": "Real-time Analytics",
            "description": "Live GitHub and WakaTime API integrations for coding statistics and project insights."
        },
        {
            "title": "Enterprise Security",
            "description": "CSP, HSTS, XSS protection, and secure OAuth authentication flow."
        },
        {
            "title": "Configurable Guestbook",
            "description": "Interactive messaging system with Google and GitHub OAuth (can be disabled)."
        },
        {
            "title": "Modern Design",
            "description": "TailwindCSS responsive design optimized for all devices and screen sizes."
        }
    ],
    "tech_stack": [
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["tailwindcss"],
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["github_api"],
        SkillsData.tech_stack["wakatime_api"],
        SkillsData.tech_stack["allauth"],
        SkillsData.tech_stack["vercel"],
        SkillsData.tech_stack["cloudflare"],
    ],
    "github_url": "https://github.com/ridwaanhall/ridwaanhall-com",
    "demo_url": "https://ridwaanhall.com",
    "status": "completed",
    "created_at": datetime.strptime("2025-03-16T12:03:09+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-07-08T15:23:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "portfolio",
    "tags": ["portfolio", "flexforge", "django", "tailwindcss", "vercel", "individual-file-system", "real-time-analytics", "enterprise-security"],
    "priority": 1,
    "slug": ""
}
