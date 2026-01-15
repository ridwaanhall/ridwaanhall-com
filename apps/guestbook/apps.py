from django.apps import AppConfig


class GuestbookConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.guestbook'
    
    def ready(self):
        """
        Import signal handlers when the app is ready.
        This ensures signals are registered when Django starts.
        """
        import apps.guestbook.signals  # noqa: F401
