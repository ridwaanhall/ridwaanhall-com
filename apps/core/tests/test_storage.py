"""The custom Supabase Storage backend.

These are offline tests: the HTTP layer is stubbed so the suite stays fast and
runs without credentials. The behaviours pinned here are the ones that bit in
practice against the real service.
"""

import json
from unittest import mock

from django.core.exceptions import SuspiciousFileOperation
from django.core.files.base import ContentFile
from django.test import TestCase, override_settings

from apps.core.storage import SupabaseStorage

SETTINGS = {
    "SUPABASE_URL": "https://example.supabase.co",
    "SUPABASE_SERVICE_ROLE_KEY": "service-key",
    "SUPABASE_STORAGE_BUCKET": "media",
}


def response(status, body=None):
    stub = mock.Mock()
    stub.status_code = status
    stub.text = json.dumps(body) if body is not None else ""
    stub.json.side_effect = (
        (lambda: body) if body is not None else ValueError("no json")
    )
    stub.content = b""
    stub.headers = {}
    return stub


@override_settings(**SETTINGS)
class SupabaseStorageTest(TestCase):
    def setUp(self):
        self.storage = SupabaseStorage()

    # -- naming ----------------------------------------------------------

    def test_generated_names_always_use_forward_slashes(self):
        """Django's base Storage routes names through os.path.join/normpath,
        which yields backslashes on Windows and corrupts the object key."""
        self.assertEqual(self.storage.generate_filename("logo/acme.webp"), "logo/acme.webp")

    def test_names_are_deterministic_rather_than_collision_renamed(self):
        """Uploads are upsert-safe, so the base exists-check-and-rename dance
        (which also reintroduces backslashes) is deliberately skipped."""
        self.assertEqual(
            self.storage.get_available_name("logo/acme.webp"), "logo/acme.webp"
        )

    def test_public_url_points_at_the_bucket(self):
        self.assertEqual(
            self.storage.url("logo/acme.webp"),
            "https://example.supabase.co/storage/v1/object/public/media/logo/acme.webp",
        )

    def test_url_escapes_special_characters(self):
        self.assertIn("a%20b.webp", self.storage.url("logo/a b.webp"))

    # -- save ------------------------------------------------------------

    def test_save_returns_the_name_it_stored(self):
        with mock.patch("apps.core.storage.requests.post", return_value=response(200)):
            self.assertEqual(
                self.storage._save("logo/a.webp", ContentFile(b"data")), "logo/a.webp"
            )

    def test_save_retries_before_giving_up(self):
        """A single blip during a bulk import shouldn't abort the whole run."""
        attempts = [response(500), response(500), response(200)]
        with mock.patch("apps.core.storage.requests.post", side_effect=attempts) as post, \
                mock.patch("apps.core.storage.time.sleep"):
            self.storage._save("logo/a.webp", ContentFile(b"data"))
        self.assertEqual(post.call_count, 3)

    def test_save_raises_after_exhausting_retries(self):
        with mock.patch("apps.core.storage.requests.post", return_value=response(500)), \
                mock.patch("apps.core.storage.time.sleep"):
            with self.assertRaises(SuspiciousFileOperation):
                self.storage._save("logo/a.webp", ContentFile(b"data"))

    def test_save_sends_upsert_header_and_guessed_content_type(self):
        with mock.patch("apps.core.storage.requests.post", return_value=response(200)) as post:
            self.storage._save("logo/a.webp", ContentFile(b"data"))
        headers = post.call_args.kwargs["headers"]
        self.assertEqual(headers["x-upsert"], "true")
        self.assertEqual(headers["Content-Type"], "image/webp")

    # -- delete ----------------------------------------------------------

    def test_delete_succeeds_normally(self):
        with mock.patch("apps.core.storage.requests.delete", return_value=response(200)):
            self.storage.delete("logo/a.webp")  # must not raise

    def test_delete_of_a_missing_object_does_not_raise(self):
        """Regression: Supabase reports a missing object as HTTP 400 carrying
        {"statusCode": "404", "code": "NoSuchKey"}, not a plain 404, so the
        status code alone doesn't identify it -- and Django's Storage contract
        says deleting a missing file is not an error."""
        missing = response(400, {"statusCode": "404", "error": "not_found",
                                 "message": "Object not found", "code": "NoSuchKey"})
        with mock.patch("apps.core.storage.requests.delete", return_value=missing):
            self.storage.delete("logo/gone.webp")  # must not raise

    def test_delete_of_a_plain_404_does_not_raise(self):
        with mock.patch("apps.core.storage.requests.delete", return_value=response(404)):
            self.storage.delete("logo/gone.webp")

    def test_delete_still_raises_on_a_real_failure(self):
        denied = response(400, {"statusCode": "403", "code": "Unauthorized"})
        with mock.patch("apps.core.storage.requests.delete", return_value=denied):
            with self.assertRaises(SuspiciousFileOperation):
                self.storage.delete("logo/a.webp")

    # -- read ------------------------------------------------------------

    def test_open_reads_the_authenticated_endpoint_not_the_cdn(self):
        """Regression: the public URL sits behind a CDN that served the
        previous copy of a just-replaced file (CF-Cache-Status: HIT), so a
        server-side read has to go to the authoritative object endpoint."""
        stub = response(200)
        stub.content = b"fresh"
        with mock.patch("apps.core.storage.requests.get", return_value=stub) as get:
            self.assertEqual(self.storage._open("logo/a.webp").read(), b"fresh")
        url = get.call_args.args[0]
        self.assertNotIn("/public/", url)
        self.assertIn("Authorization", get.call_args.kwargs["headers"])

    def test_exists_reflects_the_head_response(self):
        with mock.patch("apps.core.storage.requests.head", return_value=response(200)):
            self.assertTrue(self.storage.exists("logo/a.webp"))
        with mock.patch("apps.core.storage.requests.head", return_value=response(404)):
            self.assertFalse(self.storage.exists("logo/a.webp"))

    def test_size_reads_the_content_length_header(self):
        stub = response(200)
        stub.headers = {"Content-Length": "1234"}
        with mock.patch("apps.core.storage.requests.head", return_value=stub):
            self.assertEqual(self.storage.size("logo/a.webp"), 1234)


@override_settings(**SETTINGS)
class SupabaseStorageTimeBudgetTest(TestCase):
    """The upload must fail fast enough to stay inside the platform's limit.

    Regression for a 504 on the Profile admin: with a 30s per-attempt timeout,
    three attempts and 1.5s/3.0s backoff, a struggling upload occupied the
    request for up to 94.5s -- past every Vercel function limit -- so the
    gateway returned a timeout instead of the save completing or failing
    cleanly. `requests`' timeout is per socket read rather than a deadline for
    the call, so in practice even that figure was optimistic.
    """

    def setUp(self):
        self.storage = SupabaseStorage()

    def _run_with_fake_clock(self, post_side_effect, per_call_seconds):
        """Run _save against a clock we control, returning elapsed seconds.

        Each stubbed request burns `per_call_seconds`, and sleeps advance the
        clock instead of really sleeping, so this measures the wall-clock the
        real thing would occupy without the test taking that long.
        """
        now = {"t": 0.0}

        def fake_post(*args, **kwargs):
            now["t"] += per_call_seconds
            result = post_side_effect(*args, **kwargs)
            if isinstance(result, Exception):
                raise result
            return result

        with mock.patch("apps.core.storage.requests.post", side_effect=fake_post), \
                mock.patch("apps.core.storage.time.monotonic", lambda: now["t"]), \
                mock.patch("apps.core.storage.time.sleep",
                           side_effect=lambda s: now.__setitem__("t", now["t"] + s)):
            try:
                self.storage._save("profile/a.webp", ContentFile(b"data"))
            except SuspiciousFileOperation:
                pass
        return now["t"]

    def test_a_failing_upload_gives_up_inside_the_request_budget(self):
        elapsed = self._run_with_fake_clock(lambda *a, **k: response(500), 30.0)
        self.assertLessEqual(
            elapsed,
            40.0,
            f"a failing upload occupied the request for {elapsed}s; that is what "
            "turns into a 504 at the gateway",
        )

    def test_a_permanent_client_error_is_not_retried(self):
        """Retrying a 4xx cannot succeed -- it only burns the request's budget."""
        calls = []

        def record(*args, **kwargs):
            calls.append(1)
            return response(400, {"statusCode": "400", "message": "invalid"})

        self._run_with_fake_clock(record, 1.0)
        self.assertEqual(
            len(calls), 1, "a permanent client error should fail on the first attempt"
        )

    def test_a_transient_server_error_is_still_retried(self):
        """The retry exists for real blips; that behaviour must survive."""
        calls = []

        def flaky(*args, **kwargs):
            calls.append(1)
            return response(500) if len(calls) < 3 else response(200)

        self._run_with_fake_clock(flaky, 0.5)
        self.assertEqual(len(calls), 3)
