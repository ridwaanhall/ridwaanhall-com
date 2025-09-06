"""
SEO Data Manager
Handles SEO metadata generation and management.
"""

from typing import Dict, List, Optional
from django.utils.text import slugify
from .config import SEOConfig


class SEOData:
    """Centralized SEO data definitions for different pages and content types."""
    
    @staticmethod
    def optimize_description(description: str, max_length: int = 160) -> str:
        """Optimize meta description length for SEO."""
        if len(description) <= max_length:
            return description
        
        # Truncate at word boundary to avoid cutting words
        truncated = description[:max_length]
        last_space = truncated.rfind(' ')
        
        if last_space > max_length * 0.8:  # Only truncate at word boundary if it's not too short
            return truncated[:last_space] + '...'
        else:
            return truncated + '...'
    
    @staticmethod
    def get_base_seo_data() -> Dict:
        """Get base SEO data with verification tags."""
        return {
            'google_site_verification': '',  # Add your Google Search Console verification code
            'bing_verification': '',  # Add your Bing verification code  
            'pinterest_verification': '',  # Add your Pinterest verification code
            'twitter_site': '@ridwaanhall',
            'twitter_creator': '@ridwaanhall',
            'twitter_image_alt': 'ridwaanhall.com - Ridwan Halim Portfolio'
        }
    
    @staticmethod
    def generate_image_alt_text(title: str, context: str = 'ridwaanhall.com') -> str:
        """Generate SEO-optimized alt text for images."""
        if not title:
            return f"{context} - Portfolio and Blog"
        return f"{title} - {context}"
    
    @staticmethod
    def get_homepage_seo(about_data: Dict) -> Dict:
        """Generate SEO data for homepage."""
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:5] + \
                  SEOConfig.COMMON_KEYWORDS['technical'][:5] + \
                  SEOConfig.COMMON_KEYWORDS['content'][:3]
        
        return {
            'title': f"Hey, I'm {about_data['name']} - Leaving Traces in Code and Thought",
            'description': f"{about_data['name']}’s personal site—{about_data.get('short_description', 'A place where I share my projects, ideas, and journey.')}",
            'keywords': ', '.join(keywords),
            'og_image': about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': SEOConfig.CONTENT_TYPES['homepage']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['homepage']['twitter_card'],
            'canonical_url': SEOConfig.SITE_URL,
            'content_type': 'homepage',
            **SEOData.get_base_seo_data(),
            'twitter_image_alt': SEOData.generate_image_alt_text(f"Hey, I'm {about_data['name']}")
        }
        
        
    @staticmethod
    def get_dashboard_seo(about_data: Dict) -> Dict:
        """Generate SEO data for dashboard page."""
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:3] + \
                  SEOConfig.COMMON_KEYWORDS['technical'][:5] + \
                  ['dashboard', 'stats', 'github', 'wakatime', 'coding activity']
        
        return {
            'title': "Focused Hours & Quiet Commits - Coding Traces That Tell",
            'description': SEOData.optimize_description(f"Focused hours and quiet commits. This is where {about_data.get('first_name', about_data.get('name', ''))}'s coding traces unfold."),
            'keywords': ', '.join(keywords),
            'og_image': about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': SEOConfig.CONTENT_TYPES['dashboard']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['dashboard']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/dashboard/",
            'content_type': 'dashboard',
            **SEOData.get_base_seo_data()
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
            'title': "Where Code Meets Purpose - Projects That Persist",
            'description': SEOData.optimize_description("Projects built from curiosity and care. Practical explorations through machine learning and the web."),
            'keywords': ', '.join(keywords[:15]),
            'og_image': projects[0].get('image_url', about_data.get('image_url', SEOConfig.DEFAULT_IMAGE)) if projects else about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': SEOConfig.CONTENT_TYPES['project_list']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['project_list']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/projects/",
            'content_type': 'project_list',
            **SEOData.get_base_seo_data()
        }
        
    @staticmethod
    def get_project_detail_seo(project_data: Dict, about_data: Dict) -> Dict:
        """Generate SEO data for individual project."""
        tech_keywords = [tech.get('name', '') for tech in project_data.get('tech_stack', [])]
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:2] + \
                  tech_keywords + \
                  ['project', 'github', 'demo', 'code']
        
        description = ' '.join(project_data.get('description', [''])[:2])[:SEOConfig.DEFAULT_DESCRIPTION_LENGTH]
        full_description = f"{project_data.get('headline', '')} {description}"
        
        return {
            'title': f"{project_data['title']} - {about_data['name']}'s Project",
            'description': SEOData.optimize_description(full_description),
            'keywords': ', '.join(keywords[:15]),
            'og_image': project_data.get('image_url', about_data.get('image_url', SEOConfig.DEFAULT_IMAGE)),
            'og_type': SEOConfig.CONTENT_TYPES['project_detail']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['project_detail']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/projects/{slugify(project_data['title'])}/",
            'content_type': 'project_detail',
            'tech_stack': tech_keywords,
            **SEOData.get_base_seo_data()
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
            'title': "Beyond Syntax - Reflections in Thought and Trace",
            'description': SEOData.optimize_description("Reflections beyond syntax. Thoughts, questions and quiet technical discoveries."),
            'keywords': ', '.join(keywords[:15]),
            'og_image': about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': SEOConfig.CONTENT_TYPES['blog_list']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['blog_list']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/blog/",
            'content_type': 'blog_list',
            **SEOData.get_base_seo_data()
        }
    
    @staticmethod
    def get_blog_detail_seo(blog_data: Dict, about_data: Dict) -> Dict:
        """Generate SEO data for individual blog post."""
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:2] + \
                  blog_data.get('tags', []) + \
                  SEOConfig.COMMON_KEYWORDS['content'][:3]
        
        return {
            'title': f"{blog_data['title']} | {about_data['name']}'s Blog",
            'description': SEOData.optimize_description(blog_data.get('description', '')),
            'keywords': ', '.join(keywords[:15]),
            'og_image': blog_data.get('image_url', about_data.get('image_url', SEOConfig.DEFAULT_IMAGE)),
            'og_type': SEOConfig.CONTENT_TYPES['blog_detail']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['blog_detail']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/blog/{slugify(blog_data['title'])}/",
            'content_type': 'blog_detail',
            'published_date': blog_data.get('created_at', ''),
            'modified_date': blog_data.get('updated_at', ''),
            'tags': blog_data.get('tags', []),
            'author': about_data['name'],
            **SEOData.get_base_seo_data()
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
            'title': "In Code, Curiosity, and Care - The Story So Far",
            'description': f"In between {location_str} and Bash scripts. A path shaped by code, community and contemplation.",
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
            'title': "Reach Out - Conversations that Begin Beyond Code",
            'description': "Some conversations begin with code. Others start with a quiet hello.",
            'keywords': ', '.join(keywords),
            'og_image': about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': SEOConfig.CONTENT_TYPES['contact']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['contact']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/contact/",
            'content_type': 'contact'
        }
        
    @staticmethod
    def get_guestbook_seo(about_data: Dict) -> Dict:
        """Generate SEO data for guestbook page."""
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:3] + \
                  ['guestbook', 'chat', 'live chat', 'messages', 'community']
        
        return {
            'title': "Guestbook - Leave a Thought, Leave a Trace",
            'description': "Before you go, leave a trace. This quiet corner is open to your words.",
            'keywords': ', '.join(keywords),
            'og_image': about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': SEOConfig.CONTENT_TYPES['guestbook']['og_type'],
            'twitter_card': SEOConfig.CONTENT_TYPES['guestbook']['twitter_card'],
            'canonical_url': f"{SEOConfig.SITE_URL}/guestbook/",
            'content_type': 'guestbook'
        }
    
    @staticmethod
    def get_privacy_policy_seo(about_data: Dict) -> Dict:
        """Generate SEO data for privacy policy page."""
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:3] + \
                  ['privacy policy', 'data protection', 'user privacy', 'terms']
        
        return {
            'title': "Privacy Policy - Because Traces Deserve Trust",
            'description': "Your data matters here. I protect your traces with clarity and quiet intent.",
            'keywords': ', '.join(keywords),
            'og_image': about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': 'website',
            'twitter_card': 'summary',
            'canonical_url': f"{SEOConfig.SITE_URL}/privacy-policy/",
            'content_type': 'privacy_policy'
        }
    
    @staticmethod
    def get_openhire_seo(about_data: Dict) -> Dict:
        """Generate SEO data for openhire page."""
        keywords = SEOConfig.COMMON_KEYWORDS['personal'][:3] + \
                  ['open to work', 'hiring', 'career', 'job opportunities', 'recruitment']
        
        # Dynamic title based on status
        title_parts = []
        if about_data.get('is_open_to_work'):
            title_parts.append("Open to Work")
        if about_data.get('is_hiring'):
            title_parts.append("Hiring")
        
        title = " & ".join(title_parts) if title_parts else "Career Opportunities"
        
        description = "Explore career opportunities and work availability. "
        if about_data.get('is_open_to_work'):
            description += "Currently open to new opportunities. "
        if about_data.get('is_hiring'):
            description += "Actively hiring talented individuals. "
        description += "Let's build something amazing together."
        
        return {
            'title': f"{title} - Connecting Talent with Opportunity",
            'description': description,
            'keywords': ', '.join(keywords),
            'og_image': about_data.get('image_url', SEOConfig.DEFAULT_IMAGE),
            'og_type': 'website',
            'twitter_card': 'summary_large_image',
            'canonical_url': f"{SEOConfig.SITE_URL}/openhire/",
            'content_type': 'openhire'
        }
