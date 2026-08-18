"""
Django Storage backend for Supabase Storage, talking directly to Supabase's
own object REST API (not the S3-compatible layer) using `requests` -- already
a project dependency. This avoids adding django-storages/boto3, which would
risk Vercel's 15mb Lambda size cap for comparatively little benefit here.
"""

import mimetypes
import time
from urllib.parse import quote

import requests
from django.conf import settings
from django.core.exceptions import SuspiciousFileOperation
from django.core.files.base import ContentFile
from django.core.files.storage import Storage

_TIMEOUT = 10
_MAX_ATTEMPTS = 3

# Hard ceiling on how long a single upload may occupy the request, retries and
# backoff included.
#
# This exists because the per-attempt timeout is not a limit on the call: a
# 30s `timeout=` with three attempts and 1.5s/3.0s backoff added up to 94.5s,
# past every Vercel function limit, so a struggling upload returned a 504 from
# the gateway rather than either saving or failing cleanly. Worse, `requests`'
# timeout is the gap allowed between socket reads rather than a deadline for
# the whole call, so a slow-but-progressing upload had no bound at all.
#
# A healthy upload takes a couple of seconds; this only governs what happens
# when Supabase is unhealthy, and there the useful behaviour is to give up
# while the request still belongs to us.
_TOTAL_BUDGET = 25

# Retrying these can plausibly succeed. Anything else -- a bad key, a malformed
# request, an object too large -- will fail identically every time, so retrying
# only spends the budget that the retryable cases need.
_RETRYABLE_STATUSES = frozenset({408, 429})


def _is_retryable(status_code):
    return status_code in _RETRYABLE_STATUSES or 500 <= status_code < 600


class SupabaseStorage(Storage):
    """Stores files in a single Supabase Storage bucket, authenticated with the
    service-role key (server-side only -- never expose this key to clients)."""

    def __init__(self, bucket=None):
        self.supabase_url = settings.SUPABASE_URL.rstrip("/")
        self.bucket = bucket or settings.SUPABASE_STORAGE_BUCKET
        self._auth_headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        }

    def generate_filename(self, filename):
        # Django's default implementation joins path segments with os.path.join
        # and normalizes with os.path.normpath, which uses backslashes on
        # Windows -- force forward slashes so object keys are consistent
        # regardless of which OS this code runs on (dev machine vs. Linux prod).
        return super().generate_filename(filename).replace("\\", "/")

    def get_available_name(self, name, max_length=None):
        # Skip Django's exists()-check-and-rename loop (which also uses
        # os.path.join internally, reintroducing backslashes on Windows).
        # Uploads here are upsert-safe (_save sends x-upsert: true) and
        # already deduped by the importer's own cache, so deterministic
        # names are what we want -- not randomized collision avoidance.
        return name

    def _object_url(self, name):
        return f"{self.supabase_url}/storage/v1/object/{self.bucket}/{quote(name)}"

    def _public_url(self, name):
        return f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{quote(name)}"

    def _save(self, name, content):
        content.seek(0)
        data = content.read()
        content_type = mimetypes.guess_type(name)[0] or "application/octet-stream"
        headers = {**self._auth_headers, "Content-Type": content_type, "x-upsert": "true"}
        deadline = time.monotonic() + _TOTAL_BUDGET
        response = None
        attempts = 0
        for attempt in range(_MAX_ATTEMPTS):
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                break
            attempts += 1
            response = requests.post(
                self._object_url(name),
                headers=headers,
                data=data,
                # Never let one attempt outlive the budget meant for all of them.
                timeout=min(_TIMEOUT, remaining),
            )
            if response.status_code in (200, 201):
                return name
            if not _is_retryable(response.status_code):
                break
            if attempt < _MAX_ATTEMPTS - 1:
                backoff = 1.5 * (attempt + 1)
                # Sleeping past the deadline would only delay the failure.
                if time.monotonic() + backoff >= deadline:
                    break
                time.sleep(backoff)

        detail = (
            f"{response.status_code} {response.text}" if response is not None
            else f"no attempt completed within {_TOTAL_BUDGET}s"
        )
        raise SuspiciousFileOperation(
            f"Failed to upload '{name}' to Supabase Storage after {attempts} attempt(s): {detail}"
        )

    def _open(self, name, mode="rb"):
        # Read through the authenticated object endpoint, not the public URL.
        # The public one is fronted by a CDN that will happily serve the
        # previous copy of a file that was just replaced (observed as
        # CF-Cache-Status: HIT immediately after an upsert), which would make
        # Storage.open() return superseded content. Browsers still fetch
        # images from the public URL -- this path is only for server-side reads,
        # where being authoritative matters more than being edge-cached.
        response = requests.get(
            self._object_url(name), headers=self._auth_headers, timeout=_TIMEOUT
        )
        response.raise_for_status()
        return ContentFile(response.content, name=name)

    def exists(self, name):
        response = requests.head(self._public_url(name), timeout=15)
        return response.status_code == 200

    def url(self, name):
        return self._public_url(name)

    def delete(self, name):
        # Deliberately shorter than the cleanup budget in file_cleanup.py: one
        # delete must not be able to consume the whole allowance on its own,
        # since a cascade issues one of these per row.
        response = requests.delete(self._object_url(name), headers=self._auth_headers, timeout=5)
        if response.status_code == 200 or self._is_missing(response):
            return
        raise SuspiciousFileOperation(
            f"Failed to delete '{name}' from Supabase Storage: {response.status_code} {response.text}"
        )

    @staticmethod
    def _is_missing(response):
        """Did Supabase say "no such object"?

        Django's Storage.delete() contract is that a missing file is not an
        error, but Supabase reports one as HTTP *400* carrying a JSON body of
        ``{"statusCode": "404", "code": "NoSuchKey", ...}`` rather than a plain
        404 -- so the status code alone is not enough to recognise it.
        """
        if response.status_code == 404:
            return True
        if response.status_code != 400:
            return False
        try:
            body = response.json()
        except ValueError:
            return False
        return str(body.get("statusCode")) == "404" or body.get("code") == "NoSuchKey"

    def size(self, name):
        response = requests.head(self._public_url(name), timeout=15)
        response.raise_for_status()
        return int(response.headers.get("Content-Length", 0))

    def get_accessed_time(self, name):
        raise NotImplementedError("SupabaseStorage doesn't track access time")

    def get_created_time(self, name):
        raise NotImplementedError("SupabaseStorage doesn't track creation time")
