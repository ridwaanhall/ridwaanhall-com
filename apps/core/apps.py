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
