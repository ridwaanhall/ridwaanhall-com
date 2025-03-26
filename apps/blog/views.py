from django.shortcuts import render
from django.views import View
from django.utils.text import slugify
from django.core.exceptions import SuspiciousOperation
from functools import wraps

from apps.data.blog_data import BlogData
from apps.data.about_data import AboutData

def handle_exceptions(view_method):
    @wraps(view_method)
    def wrapper(self, request, *args, **kwargs):
        try:
            return view_method(self, request, *args, **kwargs)
        except SuspiciousOperation:
            return self.render_error(request, 400)
        except (AttributeError, TypeError, KeyError):
            return self.render_error(request, 500, 'Data processing error occurred.')
        except (FileNotFoundError, ImportError):
            return self.render_error(request, 500, 'Resource loading error occurred.')
        except Exception:
            return self.render_error(request, 500, 'An unexpected error occurred.')
    return wrapper

class BaseBlogView(View):
    def get_common_data(self):
        return {
            'blogs': BlogData.blogs,
            'about': AboutData.get_about_data()[0]
        }
    
    def render_error(self, request, code, message=None):
        context = {'error_code': code}
        if message:
            context['error_message'] = message
        return render(request, 'error.html', context, status=code)

class BlogView(BaseBlogView):
    @handle_exceptions
    def get(self, request):
        data = self.get_common_data()
        
        seo = {
            'title': f"Blog | {data['about']['name']} - Articles and Insights",
            'description': f"Explore articles, tutorials, and insights by {data['about']['name']} about technology, development, and programming.",
            'keywords': f"blog, articles, tech blog, programming, tutorials, {data['about']['name']}, developer insights",
            'og_image': data['about'].get('image_url', ''),
            'og_type': 'website',
            'twitter_card': 'summary_large_image',
        }
        
        context = {
            'blogs': data['blogs'],
            'about': data['about'],
            'seo': seo,
        }
        
        return render(request, 'blog/blog.html', context)

class BlogDetailView(BaseBlogView):
    @handle_exceptions
    def get(self, request, title):
        if not isinstance(title, str):
            raise SuspiciousOperation("Invalid title format")
            
        data = self.get_common_data()
        blog_post = next((item for item in data['blogs'] if slugify(item['title']) == title), None)
        
        if not blog_post:
            return self.render_error(request, 404)
            
        seo = {
            'title': f"{blog_post['title']} | {data['about']['name']}",
            'description': blog_post['description'],
            'keywords': f"{', '.join(blog_post['tags'])}, {data['about']['name']}, blog, article",
            'og_image': blog_post.get('image_url', data['about'].get('image_url', '')),
            'og_type': 'article',
            'twitter_card': 'summary_large_image',
            'published_date': blog_post.get('date', ''),
            'author': blog_post.get('author', data['about']['name']),
            'tags': blog_post.get('tags', []),
        }
        
        context = {
            'blog': blog_post,
            'about': data['about'],
            'seo': seo,
        }
        return render(request, 'blog/blog_detail.html', context)
