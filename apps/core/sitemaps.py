from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify
from apps.data.blog_data import BlogData
from apps.data.projects_data import ProjectsData

class StaticViewSitemap(Sitemap):
    changefreq = 'weekly'

    def items(self):
        return ['home', 'about', 'contact', 'blog', 'projects', 'career', 'dashboard']

    def location(self, item):
        return reverse(item)
    
    def priority(self, item):
        return 1.00 if item == 'home' else 0.90
    
    def lastmod(self, item):
        return timezone.now()

class BlogSitemap(Sitemap):
    changefreq = "weekly"
    
    def priority(self, obj):
        return 0.9 if obj.get('is_featured') else 0.8

    def items(self):
        return BlogData.blogs

    def location(self, obj):
        return reverse('blog_detail', kwargs={'title': slugify(obj['title'])})
    
    def lastmod(self, obj):
        return obj['date_in_rfc'] if 'date_in_rfc' in obj else timezone.now()

class ProjectSitemap(Sitemap):
    changefreq = "monthly"
    
    def priority(self, obj):
        return 0.9 if obj.get('is_featured') else 0.8

    def items(self):
        return ProjectsData.projects

    def location(self, obj):
        return reverse('projects_detail', kwargs={'title': slugify(obj['title'])})