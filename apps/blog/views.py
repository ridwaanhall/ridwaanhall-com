from django.shortcuts import render
from django.views import View
from django.utils.text import slugify
from django.core.exceptions import SuspiciousOperation

from apps.data import blog_data


class BlogView(View):
    def get(self, request):
        try:
            blogs = blog_data.BlogData.blogs
            context = {
                'blogs': blogs
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
        blogs = blog_data.BlogData.blogs

        try:
            if not isinstance(title, str):
                raise SuspiciousOperation("Invalid title format")

            blog_post = next((item for item in blogs if slugify(item['title']) == title), None)
            other_blogs = [item for item in blogs if slugify(item['title']) != title]

            if blog_post:
                context = {
                    'blog': blog_post,
                    # 'other_blogs': other_blogs
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