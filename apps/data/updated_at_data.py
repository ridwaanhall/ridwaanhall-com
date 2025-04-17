import os
import datetime
from django.conf import settings
from django.utils import timezone


class UpdatedAtData:
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

    @classmethod
    def get_all_updated_data(cls):
        """Returns a list of all pages with their last modified timestamps."""
        return [
            {
                "page": "home",
                "updated_at": cls.get_latest_modified_date([
                    "apps/data/about_data.py",
                    "apps/data/blog_data.py",
                    "apps/data/projects_data.py"
                ]),
            },
            {
                "page": "dashboard",
                "updated_at": timezone.now().strftime('%Y-%m-%d %H:%M:%S%z'),
            },
            {
                "page": "about",
                "updated_at": cls.get_latest_modified_date([
                    "apps/data/about_data.py",
                    "apps/about/templates/about/about.html"
                ]),
            },
            {
                "page": "career",
                "updated_at": cls.get_template_last_modified(
                    "apps/career/templates/career/career.html"
                )[0],
            },
            {
                "page": "projects",
                "updated_at": cls.get_latest_modified_date([
                    "apps/data/projects_data.py",
                    "apps/projects/templates/projects/projects.html"
                ]),
            },
            {
                "page": "blog",
                "updated_at": cls.get_latest_modified_date([
                    "apps/data/blog_data.py",
                    "apps/blog/templates/blog/blog.html"
                ]),
            },
            {
                "page": "contact",
                "updated_at": cls.get_template_last_modified(
                    "apps/contact/templates/contact/contact.html"
                )[0],
            },
        ]
