"""
Project #58: Public Reporting SaaS Platform - Ruang Media Solusi
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=58,
    title='Public Reporting SaaS Platform - Ruang Media Solusi',
    headline='A production-ready SaaS reporting system inspired by lapor.go.id, built with Django and Vuexy, deployed via Vercel and Cloudflare.',
    description=[
        'Developed during internship at Ruang Media Solusi, Yogyakarta.',
        'Platform enables public reporting workflows with authentication, CRUD, and geospatial tracking.',
        'Backend built with Django, integrating multiple Laravel API endpoints.',
        'Frontend powered by Vuexy with modular admin dashboard and responsive UI.',
        'Deployment configured via Vercel with readable domain setup on Cloudflare.',
        'Implements security best practices including XSS prevention, upload limits, and cache/session optimization.',
        'Workflow documentation produced to support reproducibility and onboarding.'
    ],
    features=[
        Feature(
            title='Authentication & Security',
            description='Secure login/register workflows, XSS prevention, upload limits, and refined error handling.'
        ),
        Feature(
            title='Admin Dashboard',
            description='Custom Vuexy-based dashboard with modular templates, role-based access control, and DataTables integration.'
        ),
        Feature(
            title='Comprehensive CRUD',
            description='Operations across 20+ entities including users, reports, events, officials, banners, and announcements.'
        ),
        Feature(
            title='Geospatial Features',
            description='Leaflet integration for live location tracking and geospatial validation in reports.'
        ),
        Feature(
            title='Deployment & Domain Management',
            description='Production-ready deployment via Vercel with Cloudflare domain configuration.'
        ),
        Feature(
            title='Localization & UX',
            description='Responsive UI, Indonesian language support, profile photo upload, and dynamic dropdowns.'
        ),
        Feature(
            title='Documentation',
            description='Workflow docs for reproducibility, onboarding, and long-term maintainability.'
        ),
    ],
    images={
        "admin_reporting_platform.webp": f"{settings.PROJECT_BASE_IMG_URL}/admin_reporting_platform.webp",
        "admin_reporting_platform_form.webp": f"{settings.PROJECT_BASE_IMG_URL}/admin_reporting_platform_form.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["vuexy"],
        SkillsData.tech_stack["vercel"],
        SkillsData.tech_stack["cloudflare"],
        SkillsData.tech_stack["leaflet"],
    ],
    github_url=None,
    demo_url="https://laporhub.vercel.app",
    category='saas-platform',
    tags=[
        'django', 'vuexy', 'vercel', 'cloudflare', 'leaflet',
        'reporting-system', 'crud', 'security', 'admin-dashboard',
        'localization', 'production-ready'
    ],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2026-01-02T10:42:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2026-02-18T13:41:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
