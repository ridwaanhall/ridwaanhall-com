from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify
from apps.data.blog_data import BlogData
from apps.data.projects_data import ProjectsData
from math import ceil
from apps.data.updated_at_data import UpdatedAtData

class StaticViewSitemap(Sitemap):
    def __init__(self, items_per_page=6):
        self.items_per_page = items_per_page
        self.updated_at_map = {
            item['page']: item['updated_at']
            for item in UpdatedAtData.get_all_updated_data()
        }

    def items(self):
        static_pages = ['home', 'about', 'contact', 'career', 'dashboard']

        blog_total = len(BlogData.blogs)
        blog_pages = ceil(blog_total / self.items_per_page)
        blog_page_items = [f'blog-page-{i}' for i in range(1, blog_pages + 1)]

        project_total = len(ProjectsData.projects)
        project_pages = ceil(project_total / self.items_per_page)
        project_page_items = [f'projects-page-{i}' for i in range(1, project_pages + 1)]

        return static_pages + blog_page_items + project_page_items

    def location(self, item):
        if item.startswith('blog-page-'):
            page = int(item.split('-')[-1])
            return reverse('blog') if page == 1 else f"{reverse('blog')}?page={page}"

        if item.startswith('projects-page-'):
            page = int(item.split('-')[-1])
            return reverse('projects') if page == 1 else f"{reverse('projects')}?page={page}"

        return reverse(item)

    def changefreq(self, item):
        if item == 'dashboard':
            return 'daily'
        elif item.startswith('projects-page-'):
            return 'monthly'
        return 'weekly'

    def priority(self, item):
        if item == 'home':
            return 1.0
        elif item.startswith('blog-page-') or item.startswith('projects-page-'):
            page = int(item.split('-')[-1])
            return 0.9 if page == 1 else 0.8
        return 0.9

    def lastmod(self, item):
        if item in self.updated_at_map and self.updated_at_map[item]:
            # Convert the string timestamp to a datetime object
            try:
                return timezone.datetime.strptime(self.updated_at_map[item], '%Y-%m-%d %H:%M:%S%z')
            except ValueError:
                return timezone.now()
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
        return obj['updated_at'] if 'updated_at' in obj else timezone.now()

class ProjectSitemap(Sitemap):
    changefreq = "monthly"
    
    def priority(self, obj):
        return 0.9 if obj.get('is_featured') else 0.8

    def items(self):
        return ProjectsData.projects

    def location(self, obj):
        return reverse('projects_detail', kwargs={'title': slugify(obj['title'])})
    
    def lastmod(self, obj):
        return obj['updated_at'] if 'updated_at' in obj else timezone.now()
