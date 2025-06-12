"""
Data service layer providing centralized access to all portfolio data.
Consolidates data access patterns and provides caching where appropriate.
"""

import logging
from typing import List, Dict, Any, Optional
from django.core.cache import cache

from apps.data.content_manager import ContentManager
from apps.data.about_manager import AboutManager

logger = logging.getLogger(__name__)


class DataService:
    """
    Centralized service for accessing portfolio data with consistent patterns.
    Provides caching, sorting, and filtering capabilities.
    """
    
    @staticmethod
    def get_about_data() -> Optional[Dict[str, Any]]:
        """Get about data with error handling."""
        try:
            return AboutManager.get_about_data()
        except Exception as e:
            logger.error(f"Error fetching about data: {e}")
            return None
            
    @staticmethod
    def get_blogs(sort_by_id: bool = True, featured_only: bool = False) -> List[Dict[str, Any]]:
        """Get blog data with optional sorting and filtering."""
        try:
            blogs = ContentManager.get_blogs()
            
            if featured_only:
                blogs = [blog for blog in blogs if blog.get('is_featured')]
            
            if sort_by_id:
                blogs = sorted(blogs, key=lambda x: -x.get('id', 0))
                
            return blogs
        except Exception as e:
            logger.error(f"Error fetching blog data: {e}")
            return []
            
    @staticmethod
    def get_projects(sort_by_featured: bool = True) -> List[Dict[str, Any]]:
        """Get project data with optional sorting by featured status."""
        try:
            projects = ContentManager.get_projects()
            
            if sort_by_featured:
                projects = sorted(
                    projects,
                    key=lambda x: (-x.get('is_featured', 0), -x.get('id', 0))
                )
                
            return projects
        except Exception as e:
            logger.error(f"Error fetching project data: {e}")
            return []
    
    @staticmethod
    def get_experiences(current_only: bool = False) -> List[Dict[str, Any]]:
        """Get experience data with optional filtering for current positions."""
        try:
            return AboutManager.get_experiences(current_only=current_only)
        except Exception as e:
            logger.error(f"Error fetching experience data: {e}")
            return []
    
    @staticmethod
    def get_education(last_only: bool = False) -> List[Dict[str, Any]]:
        """Get education data with optional filtering for most recent."""
        try:
            return AboutManager.get_education(last_only=last_only)
        except Exception as e:
            logger.error(f"Error fetching education data: {e}")
            return []
    
    @staticmethod
    def get_certifications() -> List[Dict[str, Any]]:
        """Get certification data."""
        try:
            return AboutManager.get_certifications()
        except Exception as e:
            logger.error(f"Error fetching certification data: {e}")
            return []
    
    @staticmethod
    def get_skills() -> List[Dict[str, Any]]:
        """Get skills data."""
        try:
            return AboutManager.get_skills()
        except Exception as e:
            logger.error(f"Error fetching skills data: {e}")
            return []
    
    @staticmethod
    def get_awards(sort_by_id: bool = True) -> List[Dict[str, Any]]:
        """Get awards data with optional sorting."""
        try:
            return AboutManager.get_awards(sort_by_id=sort_by_id)
        except Exception as e:
            logger.error(f"Error fetching awards data: {e}")
            return []
    
    @staticmethod
    def get_applications() -> List[Dict[str, Any]]:
        """Get applications data."""
        try:
            return AboutManager.get_applications()
        except Exception as e:
            logger.error(f"Error fetching applications data: {e}")
            return []
    
    @staticmethod
    def get_privacy_policy() -> Dict[str, Any]:
        """Get privacy policy data."""
        try:
            return AboutManager.get_privacy_policy()
        except Exception as e:
            logger.error(f"Error fetching privacy policy data: {e}")
            return {}
