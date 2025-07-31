import os
import datetime
import glob
import importlib.util
from django.conf import settings
from django.utils import timezone


class UpdatedAtData:
    @staticmethod
    def get_latest_guestbook_message():
        """Get the latest guestbook message timestamp."""
        try:
            # Import here to avoid circular imports
            from apps.guestbook.models import ChatMessage
            latest_message = ChatMessage.objects.first()  # Already ordered by -timestamp
            if latest_message:
                dt = timezone.localtime(latest_message.timestamp)
                return dt.strftime('%Y-%m-%d %H:%M:%S%z'), dt
        except Exception:
            pass
        
        # Fallback to current time if no messages or error
        now = timezone.now()
        return now.strftime('%Y-%m-%d %H:%M:%S%z'), now

    @staticmethod
    def get_updated_at_from_content_files(folder_path, data_key="blog_data"):
        """Extract updated_at from individual content files (blog or project)."""
        latest_dt = None
        
        # Get all Python files in the folder
        pattern = os.path.join(settings.BASE_DIR, folder_path, "*.py")
        files = glob.glob(pattern)
        
        for file_path in files:
            # Skip __init__.py and __pycache__ files
            if "__init__" in file_path or "__pycache__" in file_path:
                continue
                
            try:
                # Load the module dynamically
                spec = importlib.util.spec_from_file_location("temp_module", file_path)
                if spec is None or spec.loader is None:
                    continue
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Get the data (blog_data or project_data)
                if hasattr(module, data_key):
                    data = getattr(module, data_key)
                    if isinstance(data, dict) and "updated_at" in data:
                        updated_at = data["updated_at"]
                        if updated_at and (latest_dt is None or updated_at > latest_dt):
                            latest_dt = updated_at
                            
            except Exception:
                # Skip files that can't be loaded or don't have the expected structure
                continue
        
        if latest_dt:
            # Ensure timezone awareness
            if timezone.is_naive(latest_dt):
                latest_dt = timezone.make_aware(latest_dt)
            latest_dt = timezone.localtime(latest_dt)
            return latest_dt.strftime('%Y-%m-%d %H:%M:%S%z'), latest_dt
        
        return "", None

    @staticmethod
    def get_latest_blog_updated_at():
        """Get the latest updated_at from all blog files."""
        return UpdatedAtData.get_updated_at_from_content_files("apps/data/content/blog", "blog_data")

    @staticmethod
    def get_latest_project_updated_at():
        """Get the latest updated_at from all project files."""
        return UpdatedAtData.get_updated_at_from_content_files("apps/data/content/projects", "project_data")

    @staticmethod
    def get_about_updated_at():
        """Get updated_at from about_data.py (fallback to file modification time since no updated_at field exists)."""
        return UpdatedAtData.get_template_last_modified("apps/data/about/about_data.py")

    @staticmethod
    def get_template_last_modified(template_path):
        """Get the last modification time of a file and return formatted date and datetime object."""
        full_path = os.path.join(settings.BASE_DIR, template_path)

        if os.path.exists(full_path):
            timestamp = os.path.getmtime(full_path)
            dt = datetime.datetime.fromtimestamp(timestamp)

            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt)

            dt = timezone.localtime(dt)
            return dt.strftime('%Y-%m-%d %H:%M:%S%z'), dt

        return "", None

    @staticmethod
    def get_latest_modified_date(template_paths):
        """Return the most recent formatted modification time from a list of file paths."""
        latest_dt = None
        formatted_date = ""

        for path in template_paths:
            formatted, dt = UpdatedAtData.get_template_last_modified(path)
            if dt and (latest_dt is None or dt > latest_dt):
                latest_dt = dt
                formatted_date = formatted

        return formatted_date
    
    @staticmethod
    def get_all_updated_data():
        """Returns a list of all pages with their last modified timestamps."""
        # Get blog and project updated_at for home page comparison
        blog_formatted, blog_dt = UpdatedAtData.get_latest_blog_updated_at()
        project_formatted, project_dt = UpdatedAtData.get_latest_project_updated_at()
        about_formatted, about_dt = UpdatedAtData.get_about_updated_at()
        guestbook_formatted, guestbook_dt = UpdatedAtData.get_latest_guestbook_message()
        
        # For home page: use latest between blog, project, and about
        home_latest_dt = None
        home_formatted = ""
        
        for dt, formatted in [(blog_dt, blog_formatted), (project_dt, project_formatted), (about_dt, about_formatted)]:
            if dt and (home_latest_dt is None or dt > home_latest_dt):
                home_latest_dt = dt
                home_formatted = formatted
        return [
            {
                "page": "home",
                "updated_at": home_formatted,
            },
            {
                "page": "dashboard",
                "updated_at": timezone.now().strftime('%Y-%m-%d %H:%M:%S%z'),
            },
            {
                "page": "projects",
                "updated_at": project_formatted,
            },
            {
                "page": "blog",
                "updated_at": blog_formatted,
            },
            {
                "page": "about",
                "updated_at": UpdatedAtData.get_latest_modified_date([
                    "apps/data/about/about_data.py",
                    "apps/data/about/applications_data.py",
                    "apps/data/about/experiences_data.py",
                    "apps/data/about/education_data.py",
                    "apps/data/about/certifications_data.py",
                    "apps/data/about/awards_data.py",
                ]),
            },
            {
                "page": "contact",
                "updated_at": about_formatted,
            },
            {
                "page": "privacy",
                "updated_at": UpdatedAtData.get_latest_modified_date([
                    "apps/data/privacy/privacy_policy_data.py",
                ]),
            },
            {
                "page": "guestbook",
                "updated_at": guestbook_formatted,
            },
        ]
