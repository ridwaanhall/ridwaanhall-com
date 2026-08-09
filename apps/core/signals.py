"""
Signal handlers for the core app.

Ensures Row Level Security is enabled on every public-schema table after
each `manage.py migrate` run.
"""

import logging

from django.db.models.signals import post_migrate
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_migrate)
def enable_row_level_security(sender, **kwargs):
    """Enable RLS on every public-schema table (Postgres only, idempotent).

    Supabase exposes a PostgREST API over the `public` schema to anyone
    holding the project's anon/service keys, entirely independent of this
    Django app. Without RLS, those tables (including auth_user and
    socialaccount_socialtoken) are readable/writable directly through that
    API, bypassing Django's own auth and permission checks entirely.

    This app's own Postgres role has BYPASSRLS (confirmed via
    `SELECT rolbypassrls FROM pg_roles`), so enabling RLS here has zero
    effect on Django's own queries -- it only closes off the PostgREST
    surface. Running this after every migrate means new tables from future
    migrations are covered automatically, without needing to remember a
    manual step.
    """
    from django.db import connection

    if connection.vendor != "postgresql":
        return

    with connection.cursor() as cursor:
        cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        tables = [row[0] for row in cursor.fetchall()]
        for table in tables:
            cursor.execute(f'ALTER TABLE public."{table}" ENABLE ROW LEVEL SECURITY;')

    if tables:
        logger.info("Ensured Row Level Security is enabled on %d public table(s).", len(tables))
