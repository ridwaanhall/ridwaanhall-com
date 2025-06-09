"""
SEO management command for comprehensive SEO validation, testing, and reporting.
"""

from django.core.management.base import BaseCommand, CommandError
from django.urls import reverse
from django.test import Client, override_settings
from django.conf import settings
import requests
from typing import Dict, List
import json

from apps.seo.sitemaps import StaticPagesSitemap, BlogSitemap, ProjectSitemap
from apps.core.data_service import DataService


class Command(BaseCommand):
    help = 'Comprehensive SEO management and validation'

    def add_arguments(self, parser):
        parser.add_argument(
            '--validate',
            action='store_true',
            help='Validate all SEO components (meta tags, sitemaps, robots.txt)',
        )
        parser.add_argument(
            '--test-sitemaps',
            action='store_true',
            help='Test all sitemap URLs for accessibility',
        )
        parser.add_argument(
            '--ping-google',
            action='store_true',
            help='Ping Google about sitemap updates',
        )
        parser.add_argument(
            '--check-meta',
            action='store_true',
            help='Check meta tags on all pages',
        )
        parser.add_argument(
            '--report',
            action='store_true',
            help='Generate comprehensive SEO report',
        )

    def handle(self, *args, **options):
        """Handle the command execution."""
        # Temporarily add 'testserver' to ALLOWED_HOSTS for test client
        allowed_hosts = list(settings.ALLOWED_HOSTS)
        if 'testserver' not in allowed_hosts:
            allowed_hosts.append('testserver')
        
        # Also add localhost variants for testing
        test_hosts = ['testserver', 'localhost', '127.0.0.1']
        for host in test_hosts:
            if host not in allowed_hosts:
                allowed_hosts.append(host)
        
        # Use override_settings to temporarily modify ALLOWED_HOSTS
        with override_settings(ALLOWED_HOSTS=allowed_hosts):
            self.client = Client()
            
            if options['validate']:
                self.validate_seo()
            elif options['test_sitemaps']:
                self.test_sitemaps()
            elif options['ping_google']:
                self.ping_google_sitemaps()
            elif options['check_meta']:
                self.check_meta_tags()
            elif options['report']:
                self.generate_report()
            else:
                self.stdout.write(
                    self.style.WARNING('Please specify an action. Use --help for options.')
                )

    def validate_seo(self):
        """Validate all SEO components."""
        self.stdout.write(
            self.style.SUCCESS('🔍 Starting comprehensive SEO validation...\n')
        )
        
        # Test robots.txt
        self.test_robots_txt()
        
        # Test sitemaps
        self.test_sitemaps()
        
        # Check meta tags
        self.check_meta_tags()
        
        self.stdout.write(
            self.style.SUCCESS('\n✅ SEO validation completed!')
        )

    def test_robots_txt(self):
        """Test robots.txt accessibility and content."""
        self.stdout.write('Testing robots.txt...')
        
        try:
            response = self.client.get('/robots.txt')
            if response.status_code == 200:
                content = response.content.decode('utf-8')
                required_lines = ['User-agent:', 'Sitemap:', 'Allow:', 'Disallow:']
                
                for line in required_lines:
                    if line in content:
                        self.stdout.write(f'  ✅ {line} found')
                    else:
                        self.stdout.write(
                            self.style.WARNING(f'  ⚠️  {line} missing')
                        )
            else:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ robots.txt returned {response.status_code}')
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'  ❌ robots.txt error: {e}')
            )

    def test_sitemaps(self):
        """Test all sitemap URLs for accessibility."""
        self.stdout.write('Testing sitemaps...')
        
        sitemap_urls = [
            '/sitemap.xml',
            '/sitemap-static.xml',
            '/sitemap-blog.xml',
            '/sitemap-projects.xml',
        ]
        
        for url in sitemap_urls:
            try:
                response = self.client.get(url)
                if response.status_code == 200:
                    # Check if it's valid XML
                    content = response.content.decode('utf-8')
                    if '<?xml' in content and '<urlset' in content:
                        self.stdout.write(f'  ✅ {url} - OK')
                    else:
                        self.stdout.write(
                            self.style.WARNING(f'  ⚠️  {url} - Invalid XML format')
                        )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'  ❌ {url} - Status {response.status_code}')
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ {url} - Error: {e}')
                )

    def check_meta_tags(self):
        """Check meta tags on key pages."""
        self.stdout.write('Checking meta tags...')
        
        test_pages = [
            ('/', 'Home'),
            ('/about/', 'About'),
            ('/dashboard/', 'Dashboard'),
            ('/blog/', 'Blog'),
            ('/projects/', 'Projects'),
        ]
        
        for url, name in test_pages:
            try:
                response = self.client.get(url)
                if response.status_code == 200:
                    content = response.content.decode('utf-8')
                    
                    # Check for essential meta tags
                    meta_checks = {
                        'title': '<title>' in content,
                        'description': 'name="description"' in content,
                        'og:title': 'property="og:title"' in content,
                        'og:description': 'property="og:description"' in content,
                        'twitter:card': 'name="twitter:card"' in content,
                    }
                    
                    missing_tags = [tag for tag, present in meta_checks.items() if not present]
                    
                    if not missing_tags:
                        self.stdout.write(f'  ✅ {name} - All meta tags present')
                    else:
                        self.stdout.write(
                            self.style.WARNING(
                                f'  ⚠️  {name} - Missing: {", ".join(missing_tags)}'
                            )
                        )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'  ❌ {name} - Status {response.status_code}')
                    )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ {name} - Error: {e}')
                )

    def ping_google_sitemaps(self):
        """Ping Google about sitemap updates."""
        self.stdout.write('Pinging Google about sitemap updates...')
        
        try:
            # Modern approach: Submit sitemap via Google Search Console API
            # For now, we'll provide instructions for manual submission
            self.stdout.write(
                self.style.WARNING(
                    '  ℹ️  Manual submission required:\n'
                    '     1. Go to Google Search Console\n'
                    '     2. Navigate to Sitemaps section\n'
                    '     3. Submit your sitemap URL: /sitemap.xml\n'
                    '     4. Alternative: Use Google Search Console API'
                )
            )
            
            # We can still check if the sitemap is accessible
            response = self.client.get('/sitemap.xml')
            if response.status_code == 200:
                self.stdout.write(
                    self.style.SUCCESS('  ✅ Sitemap is accessible for Google')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ Sitemap not accessible (Status: {response.status_code})')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'  ❌ Error checking sitemap: {e}')
            )
    
    def generate_report(self):
        """Generate comprehensive SEO report."""
        self.stdout.write(
            self.style.SUCCESS('📊 Generating SEO Report...\n')
        )
        
        # Content statistics
        try:
            blogs = DataService.get_blogs()
            projects = DataService.get_projects()
            
            self.stdout.write('Content Statistics:')
            self.stdout.write(f'  📝 Total Blogs: {len(blogs)}')
            self.stdout.write(f'  ⭐ Featured Blogs: {len([b for b in blogs if b.get("is_featured")])}')
            self.stdout.write(f'  🚀 Total Projects: {len(projects)}')
            self.stdout.write(f'  ⭐ Featured Projects: {len([p for p in projects if p.get("is_featured")])}')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'  ❌ Error getting content statistics: {e}')
            )
        
        # Sitemap statistics
        try:
            static_sitemap = StaticPagesSitemap()
            blog_sitemap = BlogSitemap()
            project_sitemap = ProjectSitemap()
            
            self.stdout.write('\nSitemap Statistics:')
            self.stdout.write(f'  🔗 Static Pages: {len(static_sitemap.items())}')
            self.stdout.write(f'  📝 Blog URLs: {len(blog_sitemap.items())}')
            self.stdout.write(f'  🚀 Project URLs: {len(project_sitemap.items())}')
            
            total_urls = (
                len(static_sitemap.items()) + 
                len(blog_sitemap.items()) + 
                len(project_sitemap.items())
            )
            self.stdout.write(f'  📊 Total URLs in Sitemap: {total_urls}')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'  ❌ Error getting sitemap statistics: {e}')
            )
        
        self.stdout.write(
            self.style.SUCCESS('\n✅ SEO report generated successfully!')
        )
