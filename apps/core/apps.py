from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'

    def ready(self):
        """
        Import signal handlers when the app is ready.
        This ensures signals are registered when Django starts.
        """
        import apps.core.signals  # noqa: F401

        self._brand_admin()

    @staticmethod
    def _brand_admin():
        """Name the admin after this site rather than after Django.

        Set here rather than through a custom AdminSite subclass: these are
        three display strings, and swapping the site class would mean
        re-registering every ModelAdmin in the project for no gain.

        `site_url` is what the "View site" link points at; left at its default
        it targets "/", which is already right here, but stating it keeps the
        intent obvious next to the rest.
        """
        from django.contrib import admin

        admin.site.site_header = "Ridwan Halim"
        admin.site.site_title = "ridwaanhall.com admin"
        admin.site.index_title = "Content & operations"
        admin.site.site_url = "/"
