from django.views.generic import TemplateView
from django.shortcuts import render
from django.utils.text import slugify
from django.http import Http404
from django.core.exceptions import SuspiciousOperation
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

from apps.data.blog_data import BlogData
from apps.data.about_data import AboutData
from apps.seo.mixins import BlogListSEOMixin, BlogDetailSEOMixin


class BaseBlogView(TemplateView):
    """
    Base view for blog-related pages.
    Handles context, SEO, and error rendering.
    """

    def get_about(self):
        return AboutData.get_about_data()[0]

    def get_blogs(self):
        return sorted(BlogData.blogs, key=lambda blog: -blog.get('id', 0))

    def get_common_context(self):
        return {
            'blogs': self.get_blogs(),
            'about': self.get_about()
        }

    def render_error(self, request, status_code, message=None):
        context = {'error_code': status_code}
        if message:
            context['error_message'] = message
        return render(request, 'error.html', context, status=status_code)

    def handle_exceptions(self, func):
        """
        Decorator to wrap the GET method with exception handling.
        """
        def wrapper(request, *args, **kwargs):
            try:
                return func(request, *args, **kwargs)
            except SuspiciousOperation:
                return self.render_error(request, 400)
            except (AttributeError, TypeError, KeyError):
                return self.render_error(request, 500, 'Data processing error occurred.')
            except (FileNotFoundError, ImportError):
                return self.render_error(request, 500, 'Resource loading error occurred.')
            except Exception:
                return self.render_error(request, 500, 'An unexpected error occurred.')
        return wrapper


class BlogView(BlogListSEOMixin, BaseBlogView):
    """
    Displays the main blog list page with all blog posts and SEO metadata.
    """
    template_name = 'blog/blog.html'
    blogs_per_page = 6

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        context = self.get_common_context()
        about = context['about']
        all_blogs = context['blogs']
        
        # Paginate blogs
        paginator = Paginator(all_blogs, self.blogs_per_page)
        page = request.GET.get('page', 1)
        
        try:
            blogs_page = paginator.page(page)
        except PageNotAnInteger:
            blogs_page = paginator.page(1)
        except EmptyPage:
            blogs_page = paginator.page(paginator.num_pages)
        
        # Update context with paginated blogs
        context['blogs'] = blogs_page
        context['featured_blogs'] = [b for b in all_blogs if b.get('is_featured')]
        context['featured_blogs'] = sorted(context['featured_blogs'], key=lambda b: -b.get('id', 0))[:3]
        context['paginator'] = paginator
        context['is_paginated'] = paginator.num_pages > 1
        
        # SEO data is handled by the mixin
        context.update(self.get_context_data(blogs=all_blogs, page=page))
        return self.render_to_response(context)


class BlogDetailView(BlogDetailSEOMixin, BaseBlogView):
    """
    Displays a specific blog post detail view by slugified title.
    """
    template_name = 'blog/blog-detail.html'

    def get(self, request, title, *args, **kwargs):
        return self.handle_exceptions(lambda r, *a, **kw: self._get(r, title, *a, **kw))(request, *args, **kwargs)

    def _get(self, request, title, *args, **kwargs):
        if not isinstance(title, str):
            raise SuspiciousOperation("Invalid title format")

        context = self.get_common_context()
        about = context['about']

        blog = next(
            (b for b in context['blogs'] if slugify(b['title']) == title),
            None
        )

        if not blog:
            raise Http404("Blog not found")

        context['blog'] = blog
        
        # SEO data is handled by the mixin
        context.update(self.get_context_data(blog=blog))
        return self.render_to_response(context)
