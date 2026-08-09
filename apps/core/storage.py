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

_TIMEOUT = 30
_MAX_ATTEMPTS = 3


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
        response = None
        for attempt in range(_MAX_ATTEMPTS):
            response = requests.post(self._object_url(name), headers=headers, data=data, timeout=_TIMEOUT)
            if response.status_code in (200, 201):
                return name
            if attempt < _MAX_ATTEMPTS - 1:
                time.sleep(1.5 * (attempt + 1))
        raise SuspiciousFileOperation(
            f"Failed to upload '{name}' to Supabase Storage after {_MAX_ATTEMPTS} attempts: "
            f"{response.status_code} {response.text}"
        )

    def _open(self, name, mode="rb"):
        response = requests.get(self._public_url(name), timeout=_TIMEOUT)
        response.raise_for_status()
        return ContentFile(response.content, name=name)

    def exists(self, name):
        response = requests.head(self._public_url(name), timeout=15)
        return response.status_code == 200

    def url(self, name):
        return self._public_url(name)

    def delete(self, name):
        response = requests.delete(self._object_url(name), headers=self._auth_headers, timeout=15)
        if response.status_code not in (200, 404):
            raise SuspiciousFileOperation(
                f"Failed to delete '{name}' from Supabase Storage: {response.status_code} {response.text}"
            )

    def size(self, name):
        response = requests.head(self._public_url(name), timeout=15)
        response.raise_for_status()
        return int(response.headers.get("Content-Length", 0))

    def get_accessed_time(self, name):
        raise NotImplementedError("SupabaseStorage doesn't track access time")

    def get_created_time(self, name):
        raise NotImplementedError("SupabaseStorage doesn't track creation time")
