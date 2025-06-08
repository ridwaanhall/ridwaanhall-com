"""
SEO Schema Generator
Handles structured data (JSON-LD) generation for search engines.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from django.utils.text import slugify
from .config import SEOConfig
from apps.data.education_data import EducationData
from apps.data.experiences_data import ExperiencesData
from apps.data.certifications_data import CertificationsData
from apps.data.awards_data import AwardsData


class SEOSchemaGenerator:
    """Generate structured data for different content types."""
    
    @staticmethod
    def generate_person_schema(about_data: Dict) -> Dict:
        """Generate comprehensive Person schema for about pages with full profile data."""
        social_links = []
        social_media = about_data.get('social_media', {})
        
        for platform, url in social_media.items():
            if url:
                social_links.append(url)
        
        # Format education data for alumniOf
        alumni_of = []
        education_data = EducationData.education
        for edu in education_data:
            alumni_entry = {
                "@type": "EducationalOrganization",
                "name": edu.get('institution', ''),
                "url": edu.get('website', '')
            }
            if edu.get('degree'):
                alumni_entry["hasCredential"] = {
                    "@type": "EducationalOccupationalCredential",
                    "name": edu.get('degree', ''),
                    "dateReceived": edu.get('years', '').split(' - ')[-1] if edu.get('years') else None
                }
            alumni_of.append(alumni_entry)
        
        # Format work experience
        work_experience = []
        experiences_data = ExperiencesData.experiences
        for exp in experiences_data:
            work_exp = {
                "@type": "OrganizationRole",
                "roleName": exp.get('title', ''),
                "worksFor": {
                    "@type": "Organization",
                    "name": exp.get('company', ''),
                    "url": exp.get('website', '')
                },
                "description": ' '.join(exp.get('responsibilities', [])),
                "employmentType": exp.get('employment_type', ''),
                "workLocation": exp.get('location', '')
            }
            
            # Parse period for dates
            period = exp.get('period', '')
            if ' - ' in period:
                start_date, end_date = period.split(' - ', 1)
                work_exp["startDate"] = start_date.strip()
                if end_date.strip().lower() != 'present':
                    work_exp["endDate"] = end_date.strip()
            
            work_experience.append(work_exp)
        
        # Format skills for knowsAbout
        skills = about_data.get('skills', [])
        if isinstance(skills, list):
            knows_about = skills
        else:
            knows_about = []
        
        # Get current work experience
        current_experience = None
        for exp in ExperiencesData.experiences:
            if exp.get('is_current', False):
                current_experience = exp
                break
        
        # Use current experience for job title and organization
        if current_experience:
            job_title = current_experience.get('title', about_data.get('role', 'Software Developer'))
            works_for = {
                "@type": "Organization",
                "name": current_experience.get('company', ''),
                "url": current_experience.get('website', '')
            }
        else:
            job_title = about_data.get('role', 'Software Developer')
            works_for = {
                "@type": "Organization",
                "name": "Freelance"
            }

        schema = SEOConfig.SCHEMA_TEMPLATES['person'].copy()
        schema.update({
            "name": about_data.get('name', ''),
            "url": SEOConfig.SITE_URL,
            "image": about_data.get('image_url', ''),
            "sameAs": social_links,
            "jobTitle": job_title,
            "worksFor": works_for,
            "description": about_data.get('short_description', ''),
            "email": about_data.get('email', 'hi@ridwaanhall.com'),
            "alumniOf": alumni_of,
            "knowsAbout": knows_about,
            "workExperience": work_experience
        })
        
        return schema
    
    @staticmethod
    def generate_website_schema() -> Dict:
        """Generate WebSite schema."""
        schema = SEOConfig.SCHEMA_TEMPLATES['website'].copy()
        schema.update({
            "potentialAction": {
                "@type": "SearchAction",
                "target": f"{SEOConfig.SITE_URL}/search?q={{search_term_string}}",
                "query-input": "required name=search_term_string"
            }
        })
        return schema
    
    @staticmethod
    def generate_blog_schema(about_data: Dict, blogs: List[Dict] = None) -> Dict:
        """Generate Blog schema for blog listing."""
        schema = SEOConfig.SCHEMA_TEMPLATES['blog'].copy()
        
        if blogs:
            blog_posts = []
            for blog in blogs[:10]:  # Limit to recent posts
                blog_post = {
                    "@type": "BlogPosting",
                    "headline": blog.get('title', ''),
                    "description": blog.get('description', ''),
                    "image": blog.get('image_url', ''),
                    "datePublished": blog.get('created_at', ''),
                    "dateModified": blog.get('updated_at', ''),
                    "author": {
                        "@type": "Person",
                        "name": about_data.get('name', ''),
                        "url": SEOConfig.SITE_URL
                    },
                    "url": f"{SEOConfig.SITE_URL}/blog/{slugify(blog.get('title', ''))}/",
                    "keywords": blog.get('tags', [])
                }
                blog_posts.append(blog_post)
            
            schema["blogPost"] = blog_posts
        
        return schema

    @staticmethod
    def generate_blog_posting_schema(blog_data: Dict, about_data: Dict) -> Dict:
        """Generate BlogPosting schema for individual blog post."""
        # Convert datetime objects to ISO format strings
        created_at = blog_data.get('created_at', '')
        if hasattr(created_at, 'isoformat'):
            created_at = created_at.isoformat()
        
        updated_at = blog_data.get('updated_at', '')
        if hasattr(updated_at, 'isoformat'):
            updated_at = updated_at.isoformat()
        
        return {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": f"{SEOConfig.SITE_URL}/blog/{slugify(blog_data.get('title', ''))}/"
            },
            "headline": blog_data.get('title', ''),
            "description": blog_data.get('description', ''),
            "image": blog_data.get('image_url', ''),
            "datePublished": created_at,
            "dateModified": updated_at,
            "author": {
                "@type": "Person",
                "name": about_data.get('name', ''),
                "url": SEOConfig.SITE_URL,
                "image": about_data.get('image_url', '')
            },
            "publisher": {
                "@type": "Person",
                "name": about_data.get('name', ''),
                "logo": {
                    "@type": "ImageObject",
                    "url": about_data.get('image_url', '')
                }
            },
            "keywords": blog_data.get('tags', []),
            "wordCount": blog_data.get('word_count', 0),
            "inLanguage": "en"
        }
    
    @staticmethod
    def generate_software_source_code_schema(project_data: Dict, about_data: Dict) -> Dict:
        """Generate SoftwareSourceCode schema for projects."""
        tech_stack = [tech.get('name', '') for tech in project_data.get('tech_stack', [])]
        
        # Convert datetime objects to ISO format strings
        created_at = project_data.get('created_at', '')
        if hasattr(created_at, 'isoformat'):
            created_at = created_at.isoformat()
        
        updated_at = project_data.get('updated_at', '')
        if hasattr(updated_at, 'isoformat'):
            updated_at = updated_at.isoformat()
        
        return {
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            "name": project_data.get('title', ''),
            "description": ' '.join(project_data.get('description', [])),
            "url": project_data.get('demo_url', ''),
            "codeRepository": project_data.get('github_url', ''),
            "programmingLanguage": tech_stack,
            "author": {
                "@type": "Person",
                "name": about_data.get('name', ''),
                "url": SEOConfig.SITE_URL
            },
            "dateCreated": created_at,
            "dateModified": updated_at,
            "license": "MIT",
            "applicationCategory": "DeveloperApplication"
        }
    
    @staticmethod
    def generate_collection_page_schema(items: List[Dict], about_data: Dict, collection_type: str = "projects") -> Dict:
        """Generate CollectionPage schema for project/blog listings."""
        return {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": f"{about_data.get('name', '')}'s {collection_type.title()}",
            "description": f"Browse through {about_data.get('name', '')}'s {collection_type}",
            "url": f"{SEOConfig.SITE_URL}/{collection_type}/",
            "author": {
                "@type": "Person",
                "name": about_data.get('name', ''),
                "url": SEOConfig.SITE_URL
            },
            "numberOfItems": len(items),
            "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": len(items),
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": i + 1,
                        "name": item.get('title', ''),
                        "url": f"{SEOConfig.SITE_URL}/{collection_type}/{slugify(item.get('title', ''))}/"
                    }
                    for i, item in enumerate(items[:10])  # Limit to first 10 items
                ]
            }
        }
    
    @staticmethod
    def generate_breadcrumb_schema(breadcrumbs: List[Dict]) -> Dict:
        """Generate BreadcrumbList schema."""
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": i + 1,
                    "name": crumb.get('name', ''),
                    "item": crumb.get('url', '')
                }
                for i, crumb in enumerate(breadcrumbs)
            ]
        }
    
    @staticmethod
    def generate_organization_schema(about_data: Dict) -> Dict:
        """Generate Organization schema if applicable."""
        email = about_data.get('social_media', {}).get('email', '')
        return {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": about_data.get('name', ''),
            "url": SEOConfig.SITE_URL,
            "logo": about_data.get('image_url', ''),
            "sameAs": [
                url for url in about_data.get('social_media', {}).values() if url
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "email": email,
                "contactType": "customer service"
            }
        }
    
    @staticmethod
    def generate_contact_page_schema(about_data: Dict) -> Dict:
        """Generate ProfilePage schema with comprehensive profile information including certifications and awards."""
        # Generate the main Person entity
        person_schema = SEOSchemaGenerator.generate_person_schema(about_data)
        
        # Add certifications as hasCredential
        certifications = []
        for cert in CertificationsData.certifications:
            certification = {
                "@type": "EducationalOccupationalCredential",
                "name": cert.get('title', ''),
                "url": cert.get('credential_url', ''),
                "credentialCategory": "certification",
                "recognizedBy": {
                    "@type": "Organization",
                    "name": cert.get('institution', ''),
                    "url": cert.get('website', '')
                },
                "validFrom": cert.get('issued', ''),
                "description": ' '.join(cert.get('achievements', []))
            }
            certifications.append(certification)
        
        person_schema["hasCredential"] = certifications
        
        # Add awards as awards array
        awards = []
        for award in AwardsData.awards:
            award_schema = {
                "@type": "Award",
                "name": award.get('title', ''),
                "description": award.get('description', ''),
                "dateReceived": award.get('issued', ''),
                "awardingOrganization": {
                    "@type": "Organization",
                    "name": award.get('institution', ''),
                    "url": award.get('website', '')
                },
                "url": award.get('credential_url', '')
            }
            awards.append(award_schema)
        
        person_schema["award"] = awards
        
        # Create ProfilePage schema
        profile_page_schema = {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "name": f"{about_data.get('name', '')}'s Professional Profile",
            "description": f"Professional profile showcasing {about_data.get('name', '')}'s experience, education, certifications, and achievements",
            "url": f"{SEOConfig.SITE_URL}/about/",
            "mainEntity": person_schema,
            "author": {
                "@type": "Person",
                "name": about_data.get('name', ''),
                "url": SEOConfig.SITE_URL
            },
            "dateCreated": "2020-01-01",
            "dateModified": datetime.now().strftime("%Y-%m-%d"),
            "inLanguage": "en"
        }
        
        return profile_page_schema
    
    @staticmethod
    def generate_contact_page_schema(about_data: Dict) -> Dict:
        """Generate ContactPage schema with comprehensive contact information."""
        email = about_data.get('social_media', {}).get('email', '')
        social_media = about_data.get('social_media', {})
        
        # Define business hours
        business_hours = [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "17:00",
                "validFrom": "2024-01-01",
                "validThrough": "2025-12-31"
            }
        ]
        
        # Enhanced organization schema with location and contact details
        organization = {
            "@type": "Organization",
            "name": about_data.get('name', ''),
            "url": SEOConfig.SITE_URL,
            "logo": about_data.get('image_url', ''),
            "email": email,
            "sameAs": [url for url in social_media.values() if url],
            "openingHoursSpecification": business_hours,
            "availableLanguage": ["English", "Indonesian"],
            "contactPoint": [
                {
                    "@type": "ContactPoint",
                    "email": email,
                    "contactType": "customer service",
                    "availableLanguage": ["English", "Indonesian"],
                    "hoursAvailable": {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                        "opens": "09:00",
                        "closes": "17:00"
                    }
                },
                {
                    "@type": "ContactPoint",
                    "url": social_media.get('linkedin', ''),
                    "contactType": "customer service",
                    "availableLanguage": ["English", "Indonesian"]
                },
                {
                    "@type": "ContactPoint",
                    "url": social_media.get('github', ''),
                    "contactType": "technical support",
                    "availableLanguage": ["English"]
                }
            ]
        }
        
        # Main ContactPage schema
        return {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": f"Contact {about_data.get('name', '')}",
            "description": f"Get in touch with {about_data.get('name', '')} for professional inquiries, project collaborations, or technical discussions.",
            "url": f"{SEOConfig.SITE_URL}/contact/",
            "mainEntity": organization,
            "author": {
                "@type": "Person",
                "name": about_data.get('name', ''),
                "url": SEOConfig.SITE_URL,
                "image": about_data.get('image_url', ''),
                "jobTitle": about_data.get('role', 'Software Developer'),
                "email": email,
                "sameAs": [url for url in social_media.values() if url]
            },
            "dateCreated": "2020-01-01",
            "dateModified": datetime.now().strftime("%Y-%m-%d"),
            "inLanguage": "en",
            "isPartOf": {
                "@type": "WebSite",
                "name": f"{about_data.get('name', '')}'s Portfolio",
                "url": SEOConfig.SITE_URL
            }
        }
