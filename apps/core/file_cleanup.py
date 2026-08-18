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

import contextvars
import logging
import time

from django.apps import apps
from django.db import models

logger = logging.getLogger(__name__)

__all__ = [
    "clear_cleanup_budget",
    "delete_unreferenced_files",
    "file_fields_for",
    "is_file_referenced",
    "start_cleanup_budget",
]

# How long all storage cleanup in one request may take, in total.
#
# The bound has to span the whole request rather than each call, because the
# calls arrive one per cascaded row: deleting a project fires post_delete for
# each of its images -- seven on the largest live row -- and each of those is a
# separate round trip. A per-call limit would reset seven times over and bound
# nothing. This is the same failure the upload retry loop had: a per-operation
# timeout says nothing about total time when the operation count is unbounded.
#
# Overrunning it leaves orphaned objects in the bucket, which this module
# already treats as the acceptable outcome -- far better than running the
# request past the gateway timeout and losing the delete that triggered it.
CLEANUP_BUDGET_SECONDS = 10

# Unset outside a request. Management commands (loaddata, the guestbook sync)
# have no gateway to answer to and should clean up everything, however long it
# takes, so "no deadline" is the correct default rather than an oversight.
_deadline = contextvars.ContextVar("core_cleanup_deadline", default=None)


def start_cleanup_budget(seconds=None):
    """Begin a fresh cleanup budget for the request that is starting."""
    budget = CLEANUP_BUDGET_SECONDS if seconds is None else seconds
    _deadline.set(time.monotonic() + budget)


def clear_cleanup_budget():
    """Drop any deadline, so cleanup runs to completion however long it takes."""
    _deadline.set(None)


def _budget_exhausted():
    deadline = _deadline.get()
    return deadline is not None and time.monotonic() >= deadline


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
    pending = sorted({n for n in names if n})
    for position, name in enumerate(pending):
        if _budget_exhausted():
            logger.warning(
                "Cleanup budget of %ss exhausted; leaving %d file(s) orphaned rather "
                "than running the request past the gateway timeout: %r",
                CLEANUP_BUDGET_SECONDS,
                len(pending) - position,
                pending[position:],
            )
            return
        if is_file_referenced(name):
            continue
        try:
            storage.delete(name)
        except Exception as exc:  # noqa: BLE001 - see docstring
            logger.warning("Could not delete unreferenced file %r: %s", name, exc)
        else:
            logger.info("Deleted unreferenced file %r", name)
