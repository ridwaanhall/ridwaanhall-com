"""
SEO Manager
Main interface for SEO operations and metadata generation.
"""

from typing import Dict, List, Optional
from .data import SEOData
from .schema import SEOSchemaGenerator
from .config import SEOConfig


class SEOManager:
    """
    Central SEO manager that handles all SEO-related operations.
    Use this class in your views to generate SEO metadata.
    """
    
    def __init__(self, about_data: Dict):
        """Initialize with about data that's used across all SEO operations."""
        self.about_data = about_data
        self.schema_generator = SEOSchemaGenerator()
    
    def get_homepage_seo(self) -> Dict:
        """Get complete SEO data for homepage."""
        seo_data = SEOData.get_homepage_seo(self.about_data)
        seo_data['schemas'] = [
            self.schema_generator.generate_website_schema(),
            self.schema_generator.generate_person_schema(self.about_data)
        ]
        return seo_data
    
    def get_dashboard_seo(self) -> Dict:
        """Get complete SEO data for dashboard page."""
        seo_data = SEOData.get_dashboard_seo(self.about_data)
        seo_data['schemas'] = [
            self.schema_generator.generate_person_schema(self.about_data),
            self.schema_generator.generate_breadcrumb_schema([
                {"name": "Home", "url": SEOConfig.SITE_URL},
                {"name": "Dashboard", "url": f"{SEOConfig.SITE_URL}/dashboard/"}
            ])
        ]
        return seo_data
    
    def get_projects_list_seo(self, projects: Optional[List[Dict]] = None, page: int = 1) -> Dict:
        """Get complete SEO data for projects listing page."""
        seo_data = SEOData.get_projects_list_seo(self.about_data, projects)
        
        # Adjust title and canonical for pagination
        if page > 1:
            seo_data['title'] = f"{seo_data['title']} - Page {page}"
            seo_data['canonical_url'] = f"{SEOConfig.SITE_URL}/projects/?page={page}"
        
        seo_data['schemas'] = [
            self.schema_generator.generate_collection_page_schema(projects or [], self.about_data, "projects"),
            self.schema_generator.generate_breadcrumb_schema([
                {"name": "Home", "url": SEOConfig.SITE_URL},
                {"name": "Projects", "url": f"{SEOConfig.SITE_URL}/projects/"}
            ])
        ]
        return seo_data
    
    def get_project_detail_seo(self, project_data: Dict) -> Dict:
        """Get complete SEO data for individual project."""
        seo_data = SEOData.get_project_detail_seo(project_data, self.about_data)
        seo_data['schemas'] = [
            self.schema_generator.generate_software_source_code_schema(project_data, self.about_data),
            self.schema_generator.generate_breadcrumb_schema([
                {"name": "Home", "url": SEOConfig.SITE_URL},
                {"name": "Projects", "url": f"{SEOConfig.SITE_URL}/projects/"},
                {"name": project_data.get('title', ''), "url": seo_data['canonical_url']}
            ])
        ]
        return seo_data
    
    def get_blog_list_seo(self, blogs: Optional[List[Dict]] = None, page: int = 1) -> Dict:
        """Get complete SEO data for blog listing page."""
        seo_data = SEOData.get_blog_list_seo(self.about_data, blogs)
        
        # Adjust title and canonical for pagination
        if page > 1:
            seo_data['title'] = f"{seo_data['title']} - Page {page}"
            seo_data['canonical_url'] = f"{SEOConfig.SITE_URL}/blog/?page={page}"
        
        seo_data['schemas'] = [
            self.schema_generator.generate_blog_schema(self.about_data, blogs),
            self.schema_generator.generate_collection_page_schema(blogs or [], self.about_data, "blog"),
            self.schema_generator.generate_breadcrumb_schema([
                {"name": "Home", "url": SEOConfig.SITE_URL},
                {"name": "Blog", "url": f"{SEOConfig.SITE_URL}/blog/"}
            ])
        ]
        return seo_data
    
    def get_blog_detail_seo(self, blog_data: Dict) -> Dict:
        """Get complete SEO data for individual blog post."""
        seo_data = SEOData.get_blog_detail_seo(blog_data, self.about_data)
        seo_data['schemas'] = [
            self.schema_generator.generate_blog_posting_schema(blog_data, self.about_data),
            self.schema_generator.generate_breadcrumb_schema([
                {"name": "Home", "url": SEOConfig.SITE_URL},
                {"name": "Blog", "url": f"{SEOConfig.SITE_URL}/blog/"},
                {"name": blog_data.get('title', ''), "url": seo_data['canonical_url']}
            ])
        ]
        return seo_data
    
    def get_about_seo(self) -> Dict:
        """Get complete SEO data for about page."""
        seo_data = SEOData.get_about_seo(self.about_data)
        seo_data['schemas'] = [
            self.schema_generator.generate_profile_page_schema(self.about_data),
            self.schema_generator.generate_breadcrumb_schema([
                {"name": "Home", "url": SEOConfig.SITE_URL},
                {"name": "About Me", "url": f"{SEOConfig.SITE_URL}/about/"}
            ])
        ]
        return seo_data
    
    def get_contact_seo(self) -> Dict:
        """Get complete SEO data for contact page."""
        seo_data = SEOData.get_contact_seo(self.about_data)
        seo_data['schemas'] = [
            self.schema_generator.generate_contact_page_schema(self.about_data),
            self.schema_generator.generate_breadcrumb_schema([
                {"name": "Home", "url": SEOConfig.SITE_URL},
                {"name": "Contact Me", "url": f"{SEOConfig.SITE_URL}/contact/"}
            ])
        ]
        return seo_data
    
    def get_guestbook_seo(self) -> Dict:
        """Get complete SEO data for guestbook page."""
        seo_data = SEOData.get_guestbook_seo(self.about_data)
        seo_data['schemas'] = [
            self.schema_generator.generate_breadcrumb_schema([
                {"name": "Home", "url": SEOConfig.SITE_URL},
                {"name": "Guestbook", "url": f"{SEOConfig.SITE_URL}/guestbook/"}
            ])
        ]
        return seo_data
    
    def get_privacy_policy_seo(self) -> Dict:
        """Get complete SEO data for privacy policy page."""
        seo_data = SEOData.get_privacy_policy_seo(self.about_data)
        seo_data['schemas'] = [
            self.schema_generator.generate_privacy_policy_schema(self.about_data),
            self.schema_generator.generate_breadcrumb_schema([
                {"name": "Home", "url": SEOConfig.SITE_URL},
                {"name": "Privacy Policy", "url": f"{SEOConfig.SITE_URL}/privacy-policy/"}
            ])
        ]
        return seo_data
    
    @staticmethod
    def get_sitemap_priority(content_type: str) -> float:
        """Get sitemap priority for content type."""
        return SEOConfig.CONTENT_TYPES.get(content_type, {}).get('priority', 0.5)
    
    @staticmethod
    def get_sitemap_changefreq(content_type: str) -> str:
        """Get sitemap change frequency for content type."""
        return SEOConfig.CONTENT_TYPES.get(content_type, {}).get('changefreq', 'monthly')
    
    def get_meta_tags(self, seo_data: Dict, request=None) -> Dict:
        """Generate complete meta tags for templates."""
        canonical_url = seo_data.get('canonical_url', SEOConfig.SITE_URL)
        if request:
            canonical_url = request.build_absolute_uri()
        
        return {
            'title': seo_data.get('title', ''),
            'description': seo_data.get('description', ''),
            'keywords': seo_data.get('keywords', ''),
            'canonical_url': canonical_url,
            'og_title': seo_data.get('title', ''),
            'og_description': seo_data.get('description', ''),
            'og_image': seo_data.get('og_image', SEOConfig.DEFAULT_IMAGE),
            'og_type': seo_data.get('og_type', SEOConfig.DEFAULT_OG_TYPE),
            'og_url': canonical_url,
            'twitter_card': seo_data.get('twitter_card', SEOConfig.DEFAULT_TWITTER_CARD),
            'twitter_title': seo_data.get('title', ''),
            'twitter_description': seo_data.get('description', ''),
            'twitter_image': seo_data.get('og_image', SEOConfig.DEFAULT_IMAGE),
            'twitter_site': SEOConfig.DEFAULT_TWITTER_SITE,
            'twitter_creator': f"@{self.about_data.get('username', '')}",
            'author': self.about_data.get('name', ''),
            'published_date': seo_data.get('published_date', ''),
            'modified_date': seo_data.get('modified_date', ''),
            'tags': seo_data.get('tags', []),
            'schemas': seo_data.get('schemas', [])
        }
