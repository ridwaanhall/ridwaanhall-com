"""
Project #52: Django Cloudflare R2 Integration
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=52,
    title='Django Cloudflare R2 Integration',
    headline='A Django web application that integrates Cloudflare R2 as a cost-effective, S3-compatible storage backend for static and media files.',
    description=['This project demonstrates how to configure a Django application to seamlessly integrate with Cloudflare R2, a globally distributed and cost-effective object storage service. By leveraging R2’s S3-compatible API, the project enables Django developers to store and serve both static assets (CSS, JavaScript, images) and user-uploaded media files directly from Cloudflare’s infrastructure without incurring egress fees.', 'The integration is achieved through custom storage backends built on top of django-storages and boto3. These backends provide separate, dedicated configurations for static files and media uploads, ensuring that each type of content is handled efficiently and securely. The project also emphasizes environment-based configuration using python-decouple, allowing sensitive credentials such as access keys and bucket endpoints to be managed securely outside of the codebase.', 'Beyond basic setup, the project includes a production-ready configuration checklist covering security best practices, deployment considerations, and troubleshooting. Developers are guided through creating R2 buckets, generating API tokens with appropriate permissions, and configuring CORS and bucket policies for safe public access. The documentation also highlights how to use Django’s collectstatic command to upload static files to R2, ensuring smooth deployment workflows.', 'The repository provides practical examples of how to use R2-backed storage in Django models, including FileField and ImageField usage for documents and profile avatars. Uploaded files are automatically stored in the configured R2 bucket and served via Cloudflare’s global network, with optional support for custom domains and CDN integration. This makes the project suitable not only for development and testing but also for production-grade deployments.', 'Overall, this project serves as a reference implementation for developers who want to reduce infrastructure costs, improve scalability, and take advantage of Cloudflare’s global performance and security features while continuing to work within Django’s familiar storage framework.'],
    features=[
        Feature(title='Cloudflare R2 Storage Integration', description='Configures Django to use Cloudflare R2 as the storage backend for static and media files.'),
        Feature(title='Environment-Based Configuration', description='Manages sensitive credentials and settings via environment variables using python-decouple.'),
        Feature(title='Custom Storage Classes', description='Provides dedicated classes for StaticFilesStorage and MediaFileStorage in Django.'),
        Feature(title='S3-Compatible Interface', description='Ensures smooth integration with R2 using boto3, leveraging AWS S3-compatible APIs.'),
        Feature(title='Production-Ready Setup', description='Includes deployment checklist, security best practices, and collectstatic integration.'),
    ],
    images={
        "django_cf_r2.webp": f"{settings.PROJECT_BASE_IMG_URL}/django_cf_r2.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["boto3"],
        SkillsData.tech_stack["cloudflare"],
    ],
    github_url='https://github.com/ridwaanhall/django-cf-r2',
    demo_url='',
    category='web-development',
    tags=['django', 'cloudflare', 'r2', 's3-compatible', 'storage', 'boto3', 'python', 'django-storages', 'deployment', 'static-media'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2025-09-17T13:44:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-09-19T21:00:30+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
