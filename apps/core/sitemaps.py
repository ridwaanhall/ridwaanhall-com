from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify
from apps.data.blog_data import BlogData
from apps.data.projects_data import ProjectsData

class StaticViewSitemap(Sitemap):
    priority = 0.5
    changefreq = 'weekly'

    def items(self):
        return ['home', 'about', 'contact', 'blog', 'projects', 'career', 'dashboard']

    def location(self, item):
        return reverse(item)
    
    def lastmod(self, item):
        return timezone.now()

class BlogSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return BlogData.blogs

    def location(self, obj):
        return reverse('blog_detail', kwargs={'title': slugify(obj['title'])})
    
    def lastmod(self, obj):
        if 'date' in obj:
            try:
                from datetime import datetime
                return datetime.strptime(obj['date'], '%B %d, %Y')
            except:
                return timezone.now()
        return timezone.now()

class ProjectSitemap(Sitemap):
    changefreq = "monthly"
    priority = 0.8

    def items(self):
        return ProjectsData.projects

    def location(self, obj):
        return reverse('projects_detail', kwargs={'title': slugify(obj['title'])})