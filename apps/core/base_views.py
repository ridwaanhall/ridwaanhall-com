"""
Base views providing common functionality for all apps.
This module contains shared error handling, context generation, and utility methods.
"""

import logging
from typing import Dict, Any, Optional, Union
from django.views.generic import TemplateView
from django.shortcuts import render
from django.core.exceptions import SuspiciousOperation
from django.http import Http404, HttpResponse

from apps.data.about.about_data import AboutData

logger = logging.getLogger(__name__)


class BaseView(TemplateView):
    """
    Base view providing common functionality for all portfolio views.
    Includes error handling, about data access, and consistent context management.
    """
    
    def get_about_data(self) -> Dict[str, Any]:
        """Safely get about data with proper error handling."""
        try:
            about_data = AboutData.get_about_data()
            if not about_data:
                raise FileNotFoundError("About data is missing.")
            return about_data
        except Exception as e:
            logger.error(f"Error fetching about data: {e}")
            raise
    
    def get_common_context(self) -> Dict[str, Any]:
        """Get common context data that all views need."""
        return {
            'about': self.get_about_data()
        }
    
    def render_error(self, request, status_code: int, message: Optional[str] = None) -> HttpResponse:
        """Render error page with consistent formatting."""
        context: Dict[str, Union[int, str]] = {'error_code': status_code}
        if message:
            context['error_message'] = message
        return render(request, 'error.html', context, status=status_code)
    
    def handle_exceptions(self, view_func):
        """
        Decorator to handle common exceptions in views.
        Provides consistent error handling across all views.
        """
        def wrapper(request, *args, **kwargs):
            try:
                return view_func(request, *args, **kwargs)
            except Http404:
                # Let Django handle 404s naturally
                raise
            except SuspiciousOperation:
                logger.warning(f"Suspicious operation detected in {self.__class__.__name__}")
                return self.render_error(request, 400, "Bad request.")
            except (AttributeError, TypeError, KeyError) as e:
                logger.error(f"Data processing error in {self.__class__.__name__}: {e}")
                return self.render_error(request, 500, 'Data processing error occurred.')
            except (FileNotFoundError, ImportError) as e:
                logger.error(f"Resource loading error in {self.__class__.__name__}: {e}")
                return self.render_error(request, 500, 'Resource loading error occurred.')
            except Exception as e:
                logger.error(f"Unexpected error in {self.__class__.__name__}: {e}")
                return self.render_error(request, 500, 'An unexpected error occurred.')
        return wrapper
    
    def get_context_data(self, **kwargs) -> Dict[str, Any]:
        """Override to add common context to all views."""
        context = super().get_context_data(**kwargs)
        try:
            context.update(self.get_common_context())
        except Exception as e:
            logger.error(f"Error adding common context: {e}")
            # Continue without common context rather than failing completely
        return context


class PaginatedView(BaseView):
    """
    Base view for paginated content.
    Provides consistent pagination functionality.
    """
    items_per_page = 6
    
    def paginate_items(self, request, items, items_per_page=None):
        """Paginate items with error handling."""
        from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
        
        if items_per_page is None:
            items_per_page = self.items_per_page
        
        paginator = Paginator(items, items_per_page)
        page = request.GET.get('page', 1)
        
        try:
            page_obj = paginator.page(page)
        except PageNotAnInteger:
            page_obj = paginator.page(1)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages)
        
        # Calculate page range for better pagination display
        current_page = page_obj.number
        num_pages = paginator.num_pages
        
        # Create a smart page range that shows:
        # - First page (1)
        # - Pages around current (current-2 to current+2)
        # - Last page (num_pages)
        # - Ellipsis (...) where there are gaps
        
        page_range = []
        
        # Always include page 1
        page_range.append(1)
        
        # Calculate start and end of the window around current page
        window_start = max(2, current_page - 2)
        window_end = min(num_pages, current_page + 2)
        
        # Add ellipsis after 1 if there's a gap
        if window_start > 2:
            page_range.append('...')
        
        # Add pages in the window (excluding 1 and last page)
        for page_num in range(window_start, window_end + 1):
            if page_num != 1 and page_num != num_pages:
                page_range.append(page_num)
        
        # Add ellipsis before last page if there's a gap
        if window_end < num_pages - 1:
            page_range.append('...')
        
        # Always include last page (if it's not the same as first page)
        if num_pages > 1:
            page_range.append(num_pages)
        
        return {
            'page_obj': page_obj,
            'paginator': paginator,
            'is_paginated': paginator.num_pages > 1,
            'page_range': page_range
        }


class DetailView(BaseView):
    """
    Base view for detail pages that find items by slug.
    Provides common slug-based item lookup functionality.
    """
    
    def get_item_by_slug(self, items, slug, slug_field='title'):
        """Find item by slug with proper validation."""
        from django.utils.text import slugify
        
        if not isinstance(slug, str):
            raise SuspiciousOperation(f"Invalid {slug_field} format")
        
        item = next(
            (item for item in items if slugify(item[slug_field]) == slug),
            None
        )
        
        if not item:
            raise Http404(f"Item not found")
        
        return item
