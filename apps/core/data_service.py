"""
Data service layer providing centralized access to all portfolio data.
Consolidates data access patterns and provides caching where appropriate.
"""

import logging
from typing import List, Dict, Any, Optional
from django.core.cache import cache

from apps.data.about.about_data import AboutData
from apps.data.content.data_manager import DataManager
from apps.data.about.experiences_data import ExperiencesData
from apps.data.about.education_data import EducationData
from apps.data.about.certifications_data import CertificationsData
from apps.data.about.skills_data import SkillsData
from apps.data.about.awards_data import AwardsData
from apps.data.about.applications_data import ApplicationsData
from apps.data.privacy_policy_data import PrivacyPolicyData

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
            about_data = AboutData.get_about_data()
            return about_data[0] if about_data else None
        except Exception as e:
            logger.error(f"Error fetching about data: {e}")
            return None
    @staticmethod
    def get_blogs(sort_by_id: bool = True, featured_only: bool = False) -> List[Dict[str, Any]]:
        """Get blog data with optional sorting and filtering."""
        try:
            blogs = DataManager.get_blogs()
            
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
            projects = DataManager.get_projects()
            
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
            experiences = ExperiencesData.experiences
            
            if current_only:
                experiences = [exp for exp in experiences if exp.get('is_current')]
                
            return experiences
        except Exception as e:
            logger.error(f"Error fetching experience data: {e}")
            return []
    
    @staticmethod
    def get_education(last_only: bool = False) -> List[Dict[str, Any]]:
        """Get education data with optional filtering for most recent."""
        try:
            education = EducationData.education
            
            if last_only:
                education = [edu for edu in education if edu.get('is_last')]
                
            return education
        except Exception as e:
            logger.error(f"Error fetching education data: {e}")
            return []
    
    @staticmethod
    def get_certifications() -> List[Dict[str, Any]]:
        """Get certification data."""
        try:
            return CertificationsData.certifications
        except Exception as e:
            logger.error(f"Error fetching certification data: {e}")
            return []
    
    @staticmethod
    def get_skills() -> List[Dict[str, Any]]:
        """Get skills data."""
        try:
            return SkillsData.skills
        except Exception as e:
            logger.error(f"Error fetching skills data: {e}")
            return []
    
    @staticmethod
    def get_awards(sort_by_id: bool = True) -> List[Dict[str, Any]]:
        """Get awards data with optional sorting."""
        try:
            awards = AwardsData.awards
            
            if sort_by_id:
                awards = sorted(awards, key=lambda x: x.get('id', 0), reverse=True)
                
            return awards
        except Exception as e:
            logger.error(f"Error fetching awards data: {e}")
            return []
    
    @staticmethod
    def get_applications() -> List[Dict[str, Any]]:
        """Get applications data."""
        try:
            return ApplicationsData.applications
        except Exception as e:
            logger.error(f"Error fetching applications data: {e}")
            return []
    
    @staticmethod
    def get_privacy_policy() -> List[Dict[str, Any]]:
        """Get privacy policy data."""
        try:
            return PrivacyPolicyData.privacy_policy
        except Exception as e:
            logger.error(f"Error fetching privacy policy data: {e}")
            return []
