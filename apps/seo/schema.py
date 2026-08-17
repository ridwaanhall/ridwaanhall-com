"""
SEO Schema Generator
Handles structured data (JSON-LD) generation for search engines.
"""

from datetime import datetime
from zoneinfo import ZoneInfo

from django.utils.text import slugify

from apps.about.manager import AboutManager

from .config import SEOConfig

#: schema.org Date and DateTime properties must be ISO 8601. Google reports
#: anything else as an invalid value and drops the property, so every date this
#: module emits goes through one of the helpers below rather than being
#: formatted inline.
SITE_TIMEZONE = ZoneInfo("Asia/Jakarta")

#: When the site first went live. dateCreated is a DateTime property, so a bare
#: "2025-03-16" was reported invalid; it needs a time and an offset.
SITE_CREATED_ISO = datetime(2025, 3, 16, tzinfo=SITE_TIMEZONE).isoformat()


def _profile_links(social_media: dict) -> list[str]:
    """Absolute profile URLs for schema.org ``sameAs``.

    ``social_media`` carries an ``email`` key holding a bare address. Left in
    ``sameAs`` a browser resolves it against the current page, which is how
    Google came to record "https://ridwaanhall.com/about/hi@ridwaanhall.com" as
    a profile link. The address is published through the ``email`` property
    instead, where it belongs.
    """
    return [
        url for platform, url in social_media.items()
        if url and platform != "email" and "://" in url
    ]


def _now_iso() -> str:
    """Current time as an ISO 8601 DateTime, for dateModified."""
    return datetime.now(SITE_TIMEZONE).isoformat(timespec="seconds")


def _iso_date(education: dict) -> str | None:
    """The date an education entry concluded, as ISO 8601.

    Entries that recorded real dates give a year-month; the older ones only
    have a free-text range like "2018 - 2021", where the end year alone is
    still valid ISO 8601 while the range itself is not.
    """
    dates = education.get('date') or {}
    end = dates.get('end') or {}
    if end.get('year'):
        month = end.get('month')
        if month:
            months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            if month in months:
                return f"{end['year']}-{months.index(month) + 1:02d}"
        return str(end['year'])

    years = (education.get('years') or '').strip()
    if years:
        candidate = years.split('-')[-1].strip()
        if candidate.isdigit() and len(candidate) == 4:
            return candidate
    return None


class SEOSchemaGenerator:
    """Generate structured data for different content types."""
    
    @staticmethod
    def generate_person_schema(about_data: dict) -> dict:
        """Generate comprehensive Person schema for about pages with full profile data."""
        social_media = about_data.get('social_media', {})
        social_links = _profile_links(social_media)
        
        # Format education data for alumniOf
        alumni_of = []
        education_data = AboutManager.get_education()
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
                    # schema.org Date: a bare year is valid ISO 8601, a range
                    # is not, so only the end year is used.
                    "dateReceived": _iso_date(edu)
                }
            alumni_of.append(alumni_entry)
        
        # Format work experience
        work_experience = []
        experiences_data = AboutManager.get_experiences()
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
            
            # schema.org startDate/endDate are Date properties, so they need
            # ISO 8601. This used to emit "Jan 2024", which is not a valid date
            # and was silently ignored by consumers; the manager now supplies a
            # "2024-01" form alongside the display month/year.
            period = exp.get('period', {})
            if isinstance(period, dict):
                if period.get('start_iso'):
                    work_exp["startDate"] = period['start_iso']
                # A current role has no endDate at all, rather than an empty one.
                if period.get('end') != "Present" and period.get('end_iso'):
                    work_exp["endDate"] = period['end_iso']
            
            work_experience.append(work_exp)
        
        # Format skills for knowsAbout
        skills = about_data.get('skills', [])
        if isinstance(skills, list):
            knows_about = skills
        else:
            knows_about = []
        
        # Get current work experience
        current_experience = None
        for exp in experiences_data:
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
    def generate_website_schema() -> dict:
        """Generate enhanced WebSite schema with search functionality."""
        schema = SEOConfig.SCHEMA_TEMPLATES['website'].copy()
        schema.update({
            "description": "Personal portfolio and blog showcasing software development projects, technical insights, and professional journey",
            "inLanguage": "en-US",
            "keywords": [
                "ridwaanhall",
                "ridwan halim", 
                "software developer",
                "web development",
                "python",
                "django",
                "machine learning",
                "portfolio"
            ],
            # No SearchAction: this site has no /search endpoint, and
            # advertising one made Google crawl
            # "/search?q={search_term_string}" literally and log it as a 404.
            # The sidebar search filters a fixed list client-side; there is no
            # server-side query URL to point at.
            "potentialAction": [
                {
                    "@type": "ReadAction",
                    "target": f"{SEOConfig.SITE_URL}/blog/"
                },
                {
                    "@type": "ViewAction", 
                    "target": f"{SEOConfig.SITE_URL}/projects/"
                }
            ],
            "mainEntity": {
                "@type": "Person",
                "name": SEOConfig.AUTHOR,
                "url": SEOConfig.SITE_URL,
                "sameAs": [
                    "https://github.com/ridwaanhall",
                    "https://linkedin.com/in/ridwaanhall",
                    "https://twitter.com/ridwaanhall"
                ]
            }
        })
        return schema
    
    @staticmethod
    def generate_blog_schema(about_data: dict, blogs: list[dict] | None = None) -> dict:
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
    def generate_blog_posting_schema(blog_data: dict, about_data: dict) -> dict:
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
    def generate_software_source_code_schema(project_data: dict, about_data: dict) -> dict:
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
    def generate_collection_page_schema(items: list[dict], about_data: dict, collection_type: str = "projects") -> dict:
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
    def generate_legal_document_schema(about_data: dict, document: dict) -> dict:
        """WebPage schema for a legal document.

        dateModified comes from the document's own last_updated rather than the
        clock, so it reflects when the terms actually changed.
        """
        modified = document.get('last_updated')
        return {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": document.get('title', ''),
            "description": document.get('summary', ''),
            "url": f"{SEOConfig.SITE_URL}{document.get('url', '/')}",
            "inLanguage": "en",
            "dateCreated": SITE_CREATED_ISO,
            "dateModified": modified.isoformat(timespec="seconds") if modified else _now_iso(),
            "isPartOf": {
                "@type": "WebSite",
                "name": f"{about_data.get('name', '')}'s Portfolio",
                "url": SEOConfig.SITE_URL,
            },
            "publisher": {
                "@type": "Person",
                "name": about_data.get('name', ''),
                "url": SEOConfig.SITE_URL,
            },
        }

    @staticmethod
    def generate_breadcrumb_schema(breadcrumbs: list[dict]) -> dict:
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
    def generate_contact_page_schema(about_data: dict) -> dict:
        """Generate comprehensive ContactPage schema with organization and contact information."""
        email = about_data.get('social_media', {}).get('email', '')
        social_media = about_data.get('social_media', {})
        
        # Create contact points array
        contact_points = []
        
        # Email contact point
        if email:
            contact_points.append({
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
            })
        
        # LinkedIn contact point
        if social_media.get('linkedin'):
            contact_points.append({
                "@type": "ContactPoint",
                "url": social_media.get('linkedin'),
                "contactType": "customer service",
                "availableLanguage": ["English", "Indonesian"]
            })
        
        # GitHub contact point
        if social_media.get('github'):
            contact_points.append({
                "@type": "ContactPoint",
                "url": social_media.get('github'),
                "contactType": "technical support",
                "availableLanguage": ["English"]
            })
        
        # Create organization entity
        organization = {
            "@type": "Organization",
            "name": about_data.get('name', ''),
            "url": SEOConfig.SITE_URL,
            "logo": about_data.get('image_url', ''),
            "email": email,
            "sameAs": _profile_links(social_media),
            "contactPoint": contact_points,
            "openingHoursSpecification": [
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "opens": "09:00",
                    "closes": "17:00",
                    "validFrom": "2024-01-01",
                    "validThrough": "2025-12-31"
                }
            ],
            "availableLanguage": ["English", "Indonesian"]
        }
        
        # Create author/person entity
        author = {
            "@type": "Person",
            "name": about_data.get('name', ''),
            "url": SEOConfig.SITE_URL,
            "image": about_data.get('image_url', ''),
            "jobTitle": about_data.get('role', 'Software Developer'),
            "email": email,
            "sameAs": _profile_links(social_media)
        }
        
        # Create ContactPage schema
        return {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": f"Contact {about_data.get('name', '')}",
            "description": f"Get in touch with {about_data.get('name', '')} for professional inquiries, project collaborations, or technical discussions.",
            "url": f"{SEOConfig.SITE_URL}/contact/",
            "mainEntity": organization,
            "author": author,
            "dateCreated": SITE_CREATED_ISO,
            "dateModified": _now_iso(),
            "inLanguage": "en",
            "isPartOf": {
                "@type": "WebSite",
                "name": f"{about_data.get('name', '')}'s Portfolio", 
                "url": SEOConfig.SITE_URL
            }
        }
    
    @staticmethod
    def generate_profile_page_schema(about_data: dict) -> dict:
        """Generate ProfilePage schema with comprehensive profile information including certifications and awards."""
        # Generate the main Person entity
        person_schema = SEOSchemaGenerator.generate_person_schema(about_data)
        
        # Add certifications as hasCredential
        certifications = []
        for cert in AboutManager.get_certifications():
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
                # ISO 8601, not "Jul 2025" -- validFrom is a Date property.
                "validFrom": cert.get('issued_iso', ''),
                "description": ' '.join(cert.get('achievements', []))
            }
            certifications.append(certification)
        
        person_schema["hasCredential"] = certifications
        
        # Add awards as awards array
        awards = []
        for award in AboutManager.get_awards():
            award_schema = {
                "@type": "Award",
                "name": award.get('title', ''),
                "description": award.get('description', ''),
                # ISO 8601, not "Feb 2020" -- dateReceived is a Date property.
                "dateReceived": award.get('issued_iso', ''),
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
        return {
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
            "dateCreated": SITE_CREATED_ISO,
            "dateModified": _now_iso(),
            "inLanguage": "en"
        }
    
    @staticmethod
    def generate_privacy_policy_schema(about_data: dict) -> dict:
        """Generate comprehensive PrivacyPolicy schema for privacy policy page."""
        return {
            "@context": "https://schema.org",
            "@type": "PrivacyPolicy",
            "name": "Privacy Policy - ridwaanhall.com",
            "description": "Comprehensive privacy policy outlining how we collect, use, and protect your personal information on ridwaanhall.com",
            "url": f"{SEOConfig.SITE_URL}/privacy-policy/",
            "dateCreated": SITE_CREATED_ISO,
            "dateModified": _now_iso(),
            "inLanguage": "en",
            "publisher": {
                "@type": "Person",
                "name": about_data.get('name', ''),
                "url": SEOConfig.SITE_URL,
                "email": about_data.get('social_media', {}).get('email', ''),
                "image": about_data.get('image_url', '')
            },
            "author": {
                "@type": "Person", 
                "name": about_data.get('name', ''),
                "url": SEOConfig.SITE_URL,
                "email": about_data.get('social_media', {}).get('email', ''),
                "jobTitle": about_data.get('role', 'Software Developer')
            },
            "isPartOf": {
                "@type": "WebSite",
                "name": f"{about_data.get('name', '')}'s Portfolio",
                "url": SEOConfig.SITE_URL
            },
            "audience": {
                "@type": "Audience",
                "audienceType": "Website Users"
            },
            "jurisdiction": "Global",
            "keywords": [
                "privacy policy",
                "data protection", 
                "user privacy",
                "personal information",
                "data collection",
                "cookie policy",
                "GDPR compliance"
            ],
            "mainEntity": {
                "@type": "Organization",
                "name": about_data.get('name', ''),
                "url": SEOConfig.SITE_URL,
                "contactPoint": {
                    "@type": "ContactPoint",
                    "email": about_data.get('social_media', {}).get('email', ''),
                    "contactType": "customer service"
                }
            }
        }
