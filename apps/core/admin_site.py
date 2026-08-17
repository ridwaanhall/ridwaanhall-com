"""
The project's admin site.

Exists for one reason the plain ``AdminSite`` cannot cover: admin templates get
their context from ``each_context()``, not from the views that render the
public site, so ``about`` -- and with it the profile photo used as the brand
mark -- is simply absent there.

Wired through ``AdminConfig.default_site`` (see ``apps/core/apps.py``), which is
Django's supported hook: ``admin.site`` is a lazy object that resolves the
class named by the admin app config, so every existing ``@admin.register``
keeps working untouched. Nothing needed re-registering.
"""

from django.contrib.admin import AdminSite
from django.contrib.admin.apps import AdminConfig


class PortfolioAdminSite(AdminSite):
    site_header = "Ridwan Halim"
    site_title = "ridwaanhall.com admin"
    index_title = "Content & operations"
    site_url = "/"

    def each_context(self, request):
        """Add the site's own profile data to every admin page.

        Read through DataService, which caches and swallows its own errors: a
        missing Profile row returns None rather than raising, so the header
        falls back to initials instead of taking the admin down. The call is
        served from the content cache, so a warm page pays nothing for it.
        """
        context = super().each_context(request)
        from apps.core.data_service import DataService

        context["about"] = DataService.get_about_data()
        return context


class PortfolioAdminConfig(AdminConfig):
    """Points the admin app at the site above.

    Replaces "django.contrib.admin" in INSTALLED_APPS. Deliberately not in
    apps/core/apps.py: Django scans that module for the core app's own default
    config and raises if it finds more than one AppConfig there.
    """

    default_site = "apps.core.admin_site.PortfolioAdminSite"
