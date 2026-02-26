"""
Project #43: BeliMadu.com
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=43,
    title='BeliMadu.com',
    headline='Premium honey e-commerce platform built with Django, TailwindCSS, and deployed on Vercel.',
    description=['BeliMadu.com is a premium e-commerce platform for high-quality honey sourced directly from local beekeepers. Built with Django and TailwindCSS, and deployed on Vercel, it delivers a secure, scalable, and SEO-optimized shopping experience.', 'The platform features a curated honey catalog, enhanced contact form security with Cloudflare Turnstile, and improved error pages for better user experience.', 'Optimized caching, analytics hooks, and production-ready security settings make it a reliable choice for customers and developers alike.'],
    features=[
        Feature(title='Honey Catalog', description='Showcases premium honey products with detailed descriptions, pricing, and stock availability.'),
        Feature(title='Secure Contact Form', description='Integrated with Cloudflare Turnstile and Gmail app password for safe communication.'),
        Feature(title='SEO & Error Pages', description='Enhanced 404 and 500 pages with clear layouts and subtitles for better search visibility.'),
        Feature(title='Production-Ready Deployment', description='Configured for Redis caching, SSL, and secure cookies on Vercel.'),
    ],
    images={
        "belimadu_com_home.webp": f"{settings.PROJECT_BASE_IMG_URL}/belimadu_com_home.webp",
        "belimadu_com_product.webp": f"{settings.PROJECT_BASE_IMG_URL}/belimadu_com_product.webp",
        "belimadu_com_product_detail.webp": f"{settings.PROJECT_BASE_IMG_URL}/belimadu_com_product_detail.webp",
        "belimadu_com_articles.webp": f"{settings.PROJECT_BASE_IMG_URL}/belimadu_com_articles.webp",
        "belimadu_com_articles_detail.webp": f"{settings.PROJECT_BASE_IMG_URL}/belimadu_com_articles_detail.webp",
        "belimadu_com_about.webp": f"{settings.PROJECT_BASE_IMG_URL}/belimadu_com_about.webp",
        "belimadu_com_contact.webp": f"{settings.PROJECT_BASE_IMG_URL}/belimadu_com_contact.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["tailwindcss"],
        SkillsData.tech_stack["vercel"],
    ],
    github_url='https://github.com/ridwaanhall/belimadu-com',
    demo_url='https://belimadu.com',
    category='E-commerce',
    tags=['django', 'e-commerce', 'tailwindcss', 'vercel', 'honey', 'seo', 'cloudflare'],
    is_featured=True,
    featured_priority=1,
    status='completed',
    created_at=datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-12-28T15:29:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
