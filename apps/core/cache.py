"""
Content caching for the ORM-backed manager layer.

Page latency here is dominated by round trips to Supabase rather than by query
complexity: opening a connection costs ~190ms and each subsequent query ~27ms,
so a page issuing sixteen queries spends almost all of its time waiting on the
network. Caching what the managers return removes those round trips outright.

The awkward part is Vercel: every lambda has its own memory, so an edit made
through the admin on one instance must not leave the others serving stale
content. The scheme here separates the two concerns:

* **Payloads live in local process memory** (``CACHES["default"]``). A hit
  costs no network at all and no Supabase quota.
* **Correctness is anchored by a shared version stamp** per namespace, kept in
  Postgres (``apps.core.models.ContentVersion``). A payload's cache key embeds
  the versions of the namespaces it was built from, so bumping one instantly
  orphans every key derived from it -- on every instance at once, with no
  cross-instance messaging and no cache-busting broadcast.
* **Reading the stamps is one small indexed query**, itself memoised locally
  for a few seconds, so the steady state is zero queries per request.

Invalidation is per namespace and never global: saving a blog post bumps only
``blog``, leaving the projects, about, openhire and privacy caches untouched.

Two things deliberately stay outside the cache:

* ``is_active`` on the about dict is derived from the current Jakarta time, so
  ``AboutManager.get_about_data`` recomputes it on every read.
* The homepage's shuffled skill rows are built in the view from cached data,
  so they still vary per request.
"""

import logging
from collections.abc import Iterable

from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.db.models import F

logger = logging.getLogger(__name__)

_VERSIONS_KEY = "content:versions"
_PAYLOAD_PREFIX = "content:payload:"
_MISSING = object()

#: Which namespace each model belongs to. A model that isn't listed takes no
#: part in content caching (guestbook messages, auth, sessions, admin logs).
MODEL_NAMESPACES = {
    "about.Profile": "profile",
    "about.DonateLink": "profile",
    "about.ProfileSkillHighlight": "profile",
    "about.Experience": "experience",
    "about.Education": "education",
    "about.Certification": "certification",
    "about.Award": "award",
    "about.Skill": "skill",
    "about.Organization": "organization",
    "about.Application": "application",
    "about.JourneyStep": "application",
    "blog.BlogPost": "blog",
    "blog.BlogImage": "blog",
    "projects.Project": "project",
    "projects.Feature": "project",
    "projects.ProjectImage": "project",
    "openhire.HiringProfile": "hiring",
    "openhire.Position": "hiring",
    "openhire.OpenToWorkProfile": "opentowork",
    "openhire.PortfolioHighlight": "opentowork",
    "legal.LegalDocument": "legal",
    "legal.LegalSection": "legal",
}

NAMESPACES = tuple(sorted(set(MODEL_NAMESPACES.values())))

#: What each cached entry is built from. Listing a dependency that isn't really
#: one only costs an occasional needless rebuild; *omitting* a real one serves
#: stale content, so err towards listing it.
ENTRY_DEPENDENCIES = {
    # The about dict embeds highlighted skill *names*, so renaming a Skill
    # changes it even though no Profile row was touched.
    "about_data": ("profile", "skill"),
    "experiences": ("experience", "organization"),
    "education": ("education", "organization"),
    "certifications": ("certification", "organization"),
    "skills": ("skill",),
    "skills_by_category": ("skill",),
    "awards": ("award", "organization"),
    "applications": ("application",),
    "legal_documents": ("legal",),
    "blogs": ("blog",),
    # Project dicts embed whole tech_stack skill records, not just ids.
    "projects": ("project", "skill"),
    "hiring_data": ("hiring",),
    "open_to_work_data": ("opentowork",),
}


def _version_ttl() -> int:
    """Seconds a version stamp is trusted before being re-read.

    This is the only staleness window in the design: it bounds how long an
    instance that didn't handle the edit can keep serving the old content.
    """
    return getattr(settings, "CONTENT_CACHE_VERSION_TTL", 5)


def _payload_ttl() -> int:
    """Safety net for writes that bypass signals.

    ``QuerySet.update()`` and ``bulk_create()`` don't fire ``post_save``, so
    they never bump a version -- the blog detail view's ``F("views") + 1``
    increment is exactly such a write. Expiring payloads eventually means those
    changes still surface without anyone having to remember this.
    """
    return getattr(settings, "CONTENT_CACHE_TTL", 900)


def enabled() -> bool:
    return getattr(settings, "CONTENT_CACHE_ENABLED", True)


def namespaces_for_model(model) -> tuple[str, ...]:
    """The namespace a model's rows belong to, if any."""
    label = f"{model._meta.app_label}.{model.__name__}"
    namespace = MODEL_NAMESPACES.get(label)
    return (namespace,) if namespace else ()


def _load_versions():
    """Read every stamp in one query. ``None`` means "cache must be bypassed"."""
    from apps.core.models import ContentVersion

    try:
        return dict(ContentVersion.objects.values_list("namespace", "version"))
    except Exception:
        # A missing table (fresh checkout, part-way through a migrate) must not
        # take the site down. Returning None disables caching rather than
        # letting everything share a bogus version 0 forever.
        logger.warning("Content version table unreadable; serving uncached.", exc_info=True)
        return None


def current_versions():
    """Version stamps, memoised locally for a few seconds."""
    versions = cache.get(_VERSIONS_KEY, _MISSING)
    if versions is _MISSING:
        versions = _load_versions()
        if versions is None:
            return None
        cache.set(_VERSIONS_KEY, versions, _version_ttl())
    return versions


def _payload_key(entry, params, versions):
    stamp = ".".join(f"{ns}{versions.get(ns, 0)}" for ns in ENTRY_DEPENDENCIES[entry])
    suffix = f":{params}" if params else ""
    return f"{_PAYLOAD_PREFIX}{entry}{suffix}:{stamp}"


def get_or_build(entry: str, builder, *, params: str = ""):
    """Return ``entry`` from cache, building it with ``builder()`` on a miss.

    ``params`` distinguishes variants of the same entry (a filtered call, say)
    without giving each its own dependency list.
    """
    if entry not in ENTRY_DEPENDENCIES:
        raise KeyError(f"unknown cache entry {entry!r}; add it to ENTRY_DEPENDENCIES")
    if not enabled():
        return builder()

    versions = current_versions()
    if versions is None:
        return builder()

    key = _payload_key(entry, params, versions)
    value = cache.get(key, _MISSING)
    if value is _MISSING:
        value = builder()
        # LocMemCache pickles on set and unpickles on get, so callers that
        # mutate what they receive (the openhire view assigns into the
        # open-to-work dict) can't corrupt the cached copy.
        cache.set(key, value, _payload_ttl())
    return value


def invalidate(namespaces: Iterable[str]) -> None:
    """Bump the stamps for ``namespaces``, orphaning every key built from them."""
    from apps.core.models import ContentVersion

    names = sorted({n for n in namespaces if n in NAMESPACES})
    if not names:
        return
    try:
        with transaction.atomic():
            updated = ContentVersion.objects.filter(namespace__in=names).update(
                version=F("version") + 1
            )
            if updated != len(names):
                # First write for a namespace whose row doesn't exist yet.
                ContentVersion.objects.bulk_create(
                    [ContentVersion(namespace=n, version=1) for n in names],
                    ignore_conflicts=True,
                )
    except Exception:
        # Never let cache bookkeeping break the save that triggered it.
        logger.warning("Could not bump content versions %s", names, exc_info=True)
    finally:
        # Drop the local memo so *this* process sees the change immediately;
        # other instances pick it up within CONTENT_CACHE_VERSION_TTL.
        cache.delete(_VERSIONS_KEY)


def invalidate_all() -> None:
    """Bump every namespace. For management commands and bulk imports."""
    invalidate(NAMESPACES)
