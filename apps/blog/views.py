from django.shortcuts import render
from django.views import View
from django.utils.text import slugify
from django.core.exceptions import SuspiciousOperation

from apps.data.blog_data import BlogData
from apps.data.about_data import AboutData

class BlogView(View):
    def get(self, request):
        try:
            blogs = BlogData.blogs
            about = AboutData.get_about_data()
            
            seo = {
                'title': f"Blog | {about[0]['name']} - Articles and Insights",
                'description': f"Explore articles, tutorials, and insights by {about[0]['name']} about technology, development, and programming.",
                'keywords': f"blog, articles, tech blog, programming, tutorials, {about[0]['name']}, developer insights",
                'og_image': about[0].get('image_url', ''),
                'og_type': 'website',
                'twitter_card': 'summary_large_image',
            }
            
            context = {
                'blogs': blogs,
                'about': about[0],
                'seo': seo,
            }
            
            return render(request, 'blog/blog.html', context)

        except AttributeError:
            context = {
                'error_code': 500,
                'error_message': 'Internal server error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except (TypeError, KeyError):
            context = {
                'error_code': 500,
                'error_message': 'Data processing error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except (FileNotFoundError, ImportError):
            context = {
                'error_code': 500,
                'error_message': 'Resource loading error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except Exception:
            context = {
                'error_code': 500,
                'error_message': 'An unexpected error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)

class BlogDetailView(View):
    def get(self, request, title):
        blogs = BlogData.blogs
        about = AboutData.get_about_data()

        try:
            if not isinstance(title, str):
                raise SuspiciousOperation("Invalid title format")

            blog_post = next((item for item in blogs if slugify(item['title']) == title), None)
            # other_blogs = [item for item in blogs if slugify(item['title']) != title]

            if blog_post:
                seo = {
                    'title': f"{blog_post['title']} | {about[0]['name']}",
                    'description': blog_post['description'],
                    'keywords': f"{', '.join(blog_post['tags'])}, {about[0]['name']}, blog, article",
                    'og_image': blog_post.get('image_url', about[0].get('image_url', '')),
                    'og_type': 'article',
                    'twitter_card': 'summary_large_image',
                    'published_date': blog_post.get('date', ''),
                    'author': blog_post.get('author', about[0]['name']),
                    'tags': blog_post.get('tags', []),
                }
                
                context = {
                    'blog': blog_post,
                    'about': about[0],
                    # 'other_blogs': other_blogs,
                    'seo': seo,
                }
                return render(request, 'blog/blog_detail.html', context)
            else:
                context = {
                    'error_code': 404
                }
                return render(request, 'error.html', context, status=404)

        except SuspiciousOperation as e:
            context = {
                'error_code': 400
            }
            return render(request, 'error.html', context, status=400)
        except Exception as e:
            context = {
                'error_code': 500
            }
            return render(request, 'error.html', context, status=500)