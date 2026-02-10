"""
About Manager - Central controller for about-related data
Loads data from individual about files.
"""

from datetime import datetime, timezone

class AboutManager:
    """
    Central about data manager that loads data from individual files.
    """
    
    @classmethod
    def get_about_data(cls):
        """Get about data with flattened structure for backward compatibility."""
        from .about.about_data import AboutData
        about_data = AboutData.get_about_data()
        
        if not about_data:
            return None
        
        # Flatten the nested structure for backward compatibility
        flattened = {
            # Personal fields (flattened to root level)
            **about_data.get('personal', {}),
            # Bio fields (flattened to root level)
            **about_data.get('bio', {}),
            # Keep these as nested structures
            'stories': about_data.get('stories', []),
            'location': about_data.get('location', {}),
            'social_media': about_data.get('social_media', {}),
            'donate': about_data.get('donate', []),
            'skills': about_data.get('skills', []),
        }
        
        return flattened
    
    @classmethod
    def get_experiences(cls, current_only=False):
        """Get experience data with optional filtering for current positions."""
        from .about.experiences_data import ExperiencesData
        experiences = ExperiencesData.experiences
        
        if current_only:
            experiences = [exp for exp in experiences if exp.get('is_current')]
            
        return experiences
    
    @classmethod
    def get_education(cls, last_only=False):
        """Get education data with optional filtering for most recent."""
        from .about.education_data import EducationData
        education = EducationData.education
        
        if last_only:
            education = [edu for edu in education if edu.get('is_last')]
            
        return education
    
    @classmethod
    def get_certifications(cls):
        """Get certification data."""
        from .about.certifications_data import CertificationsData
        return CertificationsData.certifications
    
    @classmethod
    def get_skills(cls):
        """Get skills data - only returns skills with valid icon_svg."""
        from .about.skills_data import SkillsData
        all_skills = SkillsData.get_skills_list()
        # Filter out skills without icon_svg
        return [skill for skill in all_skills if skill.get('icon_svg', '').strip()]
    
    @classmethod
    def get_awards(cls, sort_by_id=True):
        """Get awards data with optional sorting."""
        from .about.awards_data import AwardsData
        awards = AwardsData.awards
        
        if sort_by_id:
            awards = sorted(awards, key=lambda x: x.get('id', 0), reverse=True)
            
        return awards
    
    @classmethod
    def get_applications(cls):
        """Get applications data sorted by latest journey timestamp (descending) and journey dates (ascending)."""
        from .about.applications_data import ApplicationsData
        
        applications = ApplicationsData.applications.copy()
        
        # Sort each application's journey by timestamp (oldest to latest)
        # Steps without timestamps are placed at the end
        for app in applications:
            if app.get('journey'):
                app['journey'] = sorted(
                    app['journey'], 
                    key=lambda x: (x.get('timestamp') is None, x.get('timestamp') or datetime.min)
                )
        
        # Sort applications by the latest timestamp in their journey (most recent first)
        # If no journey or no timestamps, fall back to ID-based timestamp
        def get_latest_timestamp(app):
            if app.get('journey'):
                timestamps = [step.get('timestamp') for step in app['journey'] if step.get('timestamp')]
                if timestamps:
                    return max(timestamps)
            # Fallback: create a timezone-aware datetime based on ID
            # Lower IDs get earlier timestamps, so they appear last when sorted descending
            app_id = app.get('id', 0)
            # Use epoch + ID seconds to create unique timestamps, with timezone
            fallback_timestamp = datetime.fromtimestamp(app_id, tz=timezone.utc)
            return fallback_timestamp
        
        applications = sorted(applications, key=get_latest_timestamp, reverse=True)
        
        return applications
    
    @classmethod
    def get_privacy_policy(cls):
        """Get privacy policy data."""
        from .privacy.privacy_policy_data import PrivacyPolicyData
        return PrivacyPolicyData.privacy_policy
    
    @classmethod
    def get_current_experiences(cls):
        """Get current experiences only."""
        return cls.get_experiences(current_only=True)
    
    @classmethod
    def get_latest_education(cls):
        """Get latest education only."""
        return cls.get_education(last_only=True)
    
    @classmethod
    def get_sorted_awards(cls):
        """Get awards sorted by ID."""
        return cls.get_awards(sort_by_id=True)
    
    @classmethod
    def get_data_source_info(cls):
        """Get information about the current data source."""
        experiences_count = len(cls.get_experiences())
        education_count = len(cls.get_education())
        certifications_count = len(cls.get_certifications())
        skills_count = len(cls.get_skills())
        awards_count = len(cls.get_awards())
        applications_count = len(cls.get_applications())
        
        return {
            'source': 'individual_files',
            'description': 'Using individual files from about/ and privacy/ directories',
            'experiences_count': experiences_count,
            'education_count': education_count,
            'certifications_count': certifications_count,
            'skills_count': skills_count,
            'awards_count': awards_count,
            'applications_count': applications_count,
            'about_files': f'apps/data/about/ ({experiences_count + education_count + certifications_count + skills_count + awards_count + applications_count} items)',
            'privacy_files': f'apps/data/privacy/ (1 file)'
        }