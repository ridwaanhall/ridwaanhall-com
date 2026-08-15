"""
Delete stored image files once nothing points at them any more.

Django deliberately stopped deleting files on model delete in 1.3, so without
this every removed or replaced image would leave an orphan in the Supabase
Storage bucket (and in local ``media/``).

Reference counting is not optional here: several files are deliberately shared
between rows -- the author photo is reused by every BlogPost, and one company
logo covers six Experience rows -- so deleting purely because *one* referring
row went away would break the others. Nothing is removed from storage until no
row anywhere still names it.

Deletion happens in ``post_save``/``post_delete`` rather than ``pre_save``, so
the database already reflects the new state and the reference check needs no
special-casing for the row being edited.
"""

import logging

from django.apps import apps
from django.db import models

logger = logging.getLogger(__name__)

__all__ = ["delete_unreferenced_files", "file_fields_for", "is_file_referenced"]


def file_fields_for(model):
    """The concrete FileField/ImageField instances declared on ``model``."""
    return [f for f in model._meta.get_fields() if isinstance(f, models.FileField)]


def _models_with_files():
    for model in apps.get_models():
        fields = file_fields_for(model)
        if fields:
            yield model, fields


def is_file_referenced(name):
    """Does any row, on any model, still store this storage name?"""
    if not name:
        return True  # nothing to delete; treat as "in use" so we leave it alone
    for model, fields in _models_with_files():
        for field in fields:
            if model._default_manager.filter(**{field.name: name}).exists():
                return True
    return False


def delete_unreferenced_files(storage, names):
    """Remove each name from ``storage`` unless something still references it.

    Cleanup must never be the reason a save or delete fails, so storage errors
    are logged rather than raised -- an orphaned object is a much smaller
    problem than a 500 on the admin page that triggered it.
    """
    for name in {n for n in names if n}:
        if is_file_referenced(name):
            continue
        try:
            storage.delete(name)
        except Exception as exc:  # noqa: BLE001 - see docstring
            logger.warning("Could not delete unreferenced file %r: %s", name, exc)
        else:
            logger.info("Deleted unreferenced file %r", name)
