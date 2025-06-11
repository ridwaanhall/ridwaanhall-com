"""
SEO Data Manager
Handles SEO metadata generation and management.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from django.utils.text import slugify
from django.urls import reverse
from .config import SEOConfig


class SEOData:
    """Centralized SEO data definitions for different pages and content types."""
    
    @staticmethod
    def get_homepage_seo(about_data: Dict) -> Dict:
        """Generate SEO data for homepage."""
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:5] + \
                  SEOConfig.COMMON_KEYWORDS['technical'][:5] + \
                  SEOConfig.COMMON_KEYWORDS['content'][:3]
        
        return {
            'title': f"Hey, I'm {about_data['name']} - Welcome to My World",
            'description': f"This is {about_data['username']}'s corner of the internet! {about_data.get('short_description', 'A place where I share my projects, ideas, and journey.')}",
            'keywords': ', '.join(keywords),
            'og_image': about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': SEOConfig.CONTENT_TYPES['homepage']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['homepage']['twitter_card'],
            'canonical_url': SEOConfig.SITE_URL,
            'content_type': 'homepage'
        }
    @staticmethod
    def get_about_seo(about_data: Dict) -> Dict:
        """Generate SEO data for about page."""
        keywords = SEOConfig.COMMON_KEYWORDS['personal'] + \
                  ['about', 'biography', 'background', 'experience', 'skills']
        
        # Format location properly from dictionary
        location = about_data.get('location', {})
        if isinstance(location, dict):
            location_str = f"{location.get('regency', '')}, {location.get('country', 'Indonesia')} {location.get('flag', '🇮🇩')}"
        else:
            location_str = str(location) if location else 'Indonesia'
        
        return {
            'title': f"About {about_data['name']} - {about_data.get('role', 'Developer')}",
            'description': f"Learn more about {about_data['name']}, {about_data.get('role', 'a passionate developer')} from {location_str}. Discover my background, skills, and journey in tech.",
            'keywords': ', '.join(keywords[:15]),
            'og_image': about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': SEOConfig.CONTENT_TYPES['about']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['about']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/about/",
            'content_type': 'about'
        }
    
    @staticmethod
    def get_contact_seo(about_data: Dict) -> Dict:
        """Generate SEO data for contact page."""
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:5] + \
                  ['contact', 'hire', 'freelance', 'collaboration', 'get in touch']
        
        return {
            'title': f"Hit Me Up - Connect with {about_data['username']}",
            'description': f"Wanna chat? Reach out to {about_data['username']} for collabs, gigs, or just to say hi! Available for freelance projects and collaborations.",
            'keywords': ', '.join(keywords),
            'og_image': about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': SEOConfig.CONTENT_TYPES['contact']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['contact']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/contact/",
            'content_type': 'contact'
        }
    
    @staticmethod
    def get_dashboard_seo(about_data: Dict) -> Dict:
        """Generate SEO data for dashboard page."""
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:3] + \
                  SEOConfig.COMMON_KEYWORDS['technical'][:5] + \
                  ['dashboard', 'stats', 'github', 'wakatime', 'coding activity']
        
        return {
            'title': f"{about_data['name']}'s Dev Hub - My Coding Life",
            'description': f"Check out what {about_data['name']}'s been coding lately—GitHub commits, stats, and all the nerdy details! Real-time development metrics and activity.",
            'keywords': ', '.join(keywords),
            'og_image': about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': SEOConfig.CONTENT_TYPES['dashboard']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['dashboard']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/dashboard/",
            'content_type': 'dashboard'
        }
    
    @staticmethod
    def get_blog_list_seo(about_data: Dict, blogs: Optional[List[Dict]] = None) -> Dict:
        """Generate SEO data for blog listing page."""
        # Extract topics from recent blogs
        topic_keywords = []
        if blogs:
            for blog in blogs[:10]:
                topic_keywords.extend(blog.get('tags', []))
            topic_keywords = list(set(topic_keywords))[:8]
        
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:3] + \
                  SEOConfig.COMMON_KEYWORDS['content'][:5] + \
                  topic_keywords
        
        return {
            'title': f"{about_data['name']}'s Blog - Thoughts & Tutorials",
            'description': f"Dive into {about_data['name']}'s collection of articles, coding tips, tech insights, and development tutorials. Fresh content about programming, AI, and web development.",
            'keywords': ', '.join(keywords[:15]),
            'og_image': about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': SEOConfig.CONTENT_TYPES['blog_list']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['blog_list']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/blog/",
            'content_type': 'blog_list'
        }
    
    @staticmethod
    def get_blog_detail_seo(blog_data: Dict, about_data: Dict) -> Dict:
        """Generate SEO data for individual blog post."""
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:2] + \
                  blog_data.get('tags', []) + \
                  SEOConfig.COMMON_KEYWORDS['content'][:3]
        
        return {
            'title': f"{blog_data['title']} | {about_data['name']}'s Blog",
            'description': blog_data.get('description', '')[:SEOConfig.DEFAULT_DESCRIPTION_LENGTH],
            'keywords': ', '.join(keywords[:15]),
            'og_image': blog_data.get('image_url', about_data.get('image_url', SEOConfig.DEFAULT_IMAGE)),
            'og_type': SEOConfig.CONTENT_TYPES['blog_detail']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['blog_detail']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/blog/{slugify(blog_data['title'])}/",
            'content_type': 'blog_detail',
            'published_date': blog_data.get('created_at', ''),
            'modified_date': blog_data.get('updated_at', ''),
            'tags': blog_data.get('tags', []),
            'author': about_data['name']
        }
    
    @staticmethod
    def get_projects_list_seo(about_data: Dict, projects: Optional[List[Dict]] = None) -> Dict:
        """Generate SEO data for projects listing page."""
        # Extract tech stack from featured projects
        tech_keywords = []
        if projects:
            for project in projects[:10]:
                for tech in project.get('tech_stack', []):
                    tech_keywords.append(tech.get('name', ''))
            tech_keywords = list(set(tech_keywords))[:8]
        
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:3] + \
                  ['projects', 'portfolio', 'github'] + \
                  tech_keywords + \
                  SEOConfig.COMMON_KEYWORDS['technical'][:5]
        
        return {
            'title': f"{about_data['name']}'s Projects - Stuff I've Built",
            'description': f"Take a look at {about_data['name']}'s coding adventures—apps, projects, and demos showcasing skills in {', '.join(tech_keywords[:5])} and more.",
            'keywords': ', '.join(keywords[:15]),
            'og_image': projects[0].get('image_url', about_data.get('image_url', SEOConfig.DEFAULT_IMAGE)) if projects else about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': SEOConfig.CONTENT_TYPES['project_list']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['project_list']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/projects/",
            'content_type': 'project_list'
        }
    
    @staticmethod
    def get_project_detail_seo(project_data: Dict, about_data: Dict) -> Dict:
        """Generate SEO data for individual project."""
        tech_keywords = [tech.get('name', '') for tech in project_data.get('tech_stack', [])]
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:2] + \
                  tech_keywords + \
                  ['project', 'github', 'demo', 'code']
        
        description = ' '.join(project_data.get('description', [''])[:2])[:SEOConfig.DEFAULT_DESCRIPTION_LENGTH]
        
        return {
            'title': f"{project_data['title']} - {about_data['name']}'s Project",
            'description': f"{project_data.get('headline', '')} {description}",
            'keywords': ', '.join(keywords[:15]),
            'og_image': project_data.get('image_url', about_data.get('image_url', SEOConfig.DEFAULT_IMAGE)),
            'og_type': SEOConfig.CONTENT_TYPES['project_detail']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['project_detail']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/projects/{slugify(project_data['title'])}/",
            'content_type': 'project_detail',
            'tech_stack': tech_keywords
        }
    
    @staticmethod
    def get_privacy_policy_seo(about_data: Dict) -> Dict:
        """Generate SEO data for privacy policy page."""
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:3] + \
                  ['privacy policy', 'data protection', 'user privacy', 'terms']
        
        return {
            'title': "Privacy Stuff - Keeping it chill and transparent!",
            'description': "We got you! Check out how we keep your data safe and sound. Transparent privacy policy for ridwaanhall.com users.",
            'keywords': ', '.join(keywords),
            'og_image': about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': 'website',
            'twitter_card': 'summary',
            'canonical_url': f"{SEOConfig.SITE_URL}/privacy-policy/",
            'content_type': 'privacy_policy'
        }
