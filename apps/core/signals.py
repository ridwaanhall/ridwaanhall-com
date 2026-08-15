"""
Signal handlers for the core app.

Two concerns live here:

* Row Level Security is re-asserted on every public-schema table after each
  ``manage.py migrate``.
* Stored image files are cleaned out of Supabase Storage (and local ``media/``)
  once no row references them any more.
"""

import logging

from django.db.models.signals import (
    m2m_changed,
    post_delete,
    post_migrate,
    post_save,
    pre_save,
)
from django.dispatch import receiver

from apps.core.cache import invalidate, namespaces_for_model
from apps.core.file_cleanup import delete_unreferenced_files, file_fields_for

logger = logging.getLogger(__name__)

# Stashed on the instance between pre_save and post_save.
_OLD_FILES_ATTR = "_core_old_file_names"


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


@receiver(pre_save)
def remember_replaced_files(sender, instance, **kwargs):
    """Record the file names currently in the database, before they're overwritten.

    Reading them here (rather than diffing in post_save) is the only chance --
    once the UPDATE lands the old names are gone.
    """
    if kwargs.get("raw") or instance.pk is None:
        return
    fields = file_fields_for(sender)
    if not fields:
        return
    try:
        previous = sender._default_manager.filter(pk=instance.pk).values(
            *[f.name for f in fields]
        ).first()
    except Exception:  # noqa: BLE001 - never block a save over cleanup bookkeeping
        return
    if previous:
        setattr(instance, _OLD_FILES_ATTR, previous)


@receiver(post_save)
def cleanup_replaced_files(sender, instance, **kwargs):
    """Drop the previous file of any field whose image was swapped out."""
    previous = getattr(instance, _OLD_FILES_ATTR, None)
    if kwargs.get("raw") or not previous:
        return
    delattr(instance, _OLD_FILES_ATTR)

    stale = []
    for field in file_fields_for(sender):
        old = previous.get(field.name)
        new = getattr(instance, field.name)
        if old and old != (new.name if new else ""):
            stale.append(old)
    if stale:
        # By now the row holds the new name, so the reference check sees the
        # real post-save state and won't count this row against itself.
        delete_unreferenced_files(_storage_for(sender), stale)


@receiver(post_delete)
def cleanup_deleted_files(sender, instance, **kwargs):
    """Drop the files of a deleted row, if nothing else points at them.

    Also covers cascades: deleting a BlogPost fires post_delete for each of its
    BlogImage rows, so their files are considered too.
    """
    fields = file_fields_for(sender)
    if not fields:
        return
    names = []
    for field in fields:
        value = getattr(instance, field.name, None)
        if value and value.name:
            names.append(value.name)
    if names:
        delete_unreferenced_files(_storage_for(sender), names)


def _storage_for(model):
    """The storage backend these fields use (they all share one per model)."""
    return file_fields_for(model)[0].storage


@receiver(post_save)
@receiver(post_delete)
def invalidate_content_cache(sender, instance, **kwargs):
    """Bump only the namespaces this model feeds.

    Editing a blog post must not throw away the projects, about or privacy
    caches -- each of those costs a fresh round trip to Supabase to rebuild.
    """
    if kwargs.get("raw"):
        return
    namespaces = namespaces_for_model(sender)
    if namespaces:
        invalidate(namespaces)


@receiver(m2m_changed)
def invalidate_content_cache_on_m2m(sender, instance, action, **kwargs):
    """Cover relation edits, which don't fire post_save on either side.

    ``Project.tech_stack`` is the live case: attaching a Skill changes the
    rendered project without touching a column on either row.
    """
    if action not in ("post_add", "post_remove", "post_clear"):
        return
    namespaces = set(namespaces_for_model(type(instance)))
    related = kwargs.get("model")
    if related is not None:
        namespaces |= set(namespaces_for_model(related))
    if namespaces:
        invalidate(namespaces)
