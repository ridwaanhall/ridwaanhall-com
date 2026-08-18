"""Storage cleanup when image rows are deleted or their file is replaced.

The shared-file cases matter most: several stored files are deliberately reused
across rows (the author photo appears on every BlogPost), so cleanup that
ignored reference counting would delete images still in use on the live site.

Logos now live on Organization rather than on each Experience or Certification,
which removes most of that duplication -- but not all of it. Distinct
organisations still share a logo file where they share a brand: "LinkedIn" and
"LinkedIn Learning" are separate issuers on one mark, as are three Al-Mukmin
schools. Those are the cases below.
"""

import io
import itertools
import shutil
import tempfile
from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from apps.about.models import Organization
from apps.core.file_cleanup import is_file_referenced


def make_image(colour="red"):
    """A genuinely valid PNG -- ImageField runs it through Pillow on upload."""
    from PIL import Image

    buffer = io.BytesIO()
    Image.new("RGB", (2, 2), colour).save(buffer, format="PNG")
    return buffer.getvalue()


def upload(name, colour="red"):
    return SimpleUploadedFile(name, make_image(colour), content_type="image/png")


_counter = itertools.count()


def make_org(**kwargs):
    """An organisation, which is where logos live now."""
    defaults = {"name": f"Org {next(_counter)}"}
    defaults.update(kwargs)
    return Organization.objects.create(**defaults)


class FileCleanupTest(TestCase):
    """Exercised against local FileSystemStorage, which tests use by default."""

    def setUp(self):
        self.media = tempfile.mkdtemp()
        self.override = override_settings(MEDIA_ROOT=self.media)
        self.override.enable()
        self.addCleanup(self.override.disable)
        self.addCleanup(shutil.rmtree, self.media, ignore_errors=True)

    @staticmethod
    def stored(field_file):
        return field_file.storage.exists(field_file.name)

    # -- deletion --------------------------------------------------------

    def test_deleting_a_row_deletes_its_unreferenced_file(self):
        org = make_org(logo=upload("solo.png"))
        name = org.logo.name
        storage = org.logo.storage
        self.assertTrue(storage.exists(name))

        org.delete()

        self.assertFalse(storage.exists(name), "the file should be gone with its only row")

    def test_deleting_one_row_keeps_a_file_another_row_still_uses(self):
        first = make_org(logo=upload("shared.png"))
        name = first.logo.name
        storage = first.logo.storage
        # A second row pointing at the very same stored file, exactly as the
        # real data does for repeated company logos.
        second = make_org()
        second.logo.name = name
        second.save()

        first.delete()

        self.assertTrue(storage.exists(name), "file is still used by another row")
        second.refresh_from_db()
        self.assertEqual(second.logo.name, name)

    def test_shared_file_is_removed_once_the_last_row_goes(self):
        first = make_org(logo=upload("last.png"))
        name = first.logo.name
        storage = first.logo.storage
        second = make_org()
        second.logo.name = name
        second.save()

        first.delete()
        second.delete()

        self.assertFalse(storage.exists(name))

    def test_two_organisations_can_share_one_logo_file(self):
        """"LinkedIn" and "LinkedIn Learning" really do share a mark in the real
        data, as do three Al-Mukmin schools -- so deleting one organisation must
        not take the other's logo with it."""
        first = make_org(name="LinkedIn", logo=upload("brand.png"))
        name = first.logo.name
        storage = first.logo.storage
        second = make_org(name="LinkedIn Learning")
        second.logo.name = name
        second.save()

        first.delete()

        self.assertTrue(storage.exists(name), "still referenced by the other organisation")

    def test_deleting_a_row_without_a_file_is_harmless(self):
        make_org().delete()  # no logo set; must not raise

    # -- replacement -----------------------------------------------------

    def test_replacing_an_image_deletes_the_previous_file(self):
        org = make_org(logo=upload("before.png"))
        old_name = org.logo.name
        storage = org.logo.storage

        org.logo = upload("after.png", "blue")
        org.save()

        self.assertNotEqual(org.logo.name, old_name)
        self.assertFalse(storage.exists(old_name), "the replaced file should be gone")
        self.assertTrue(storage.exists(org.logo.name))

    def test_replacing_an_image_keeps_a_file_another_row_still_uses(self):
        first = make_org(logo=upload("keepme.png"))
        shared_name = first.logo.name
        storage = first.logo.storage
        second = make_org()
        second.logo.name = shared_name
        second.save()

        first.logo = upload("fresh.png", "blue")
        first.save()

        self.assertTrue(storage.exists(shared_name), "still used by the second row")

    def test_saving_without_touching_the_image_keeps_it(self):
        org = make_org(logo=upload("stable.png"))
        name = org.logo.name
        storage = org.logo.storage

        org.name = "Renamed"
        org.save()

        self.assertTrue(storage.exists(name))

    # -- helper ----------------------------------------------------------

    def test_is_file_referenced_reports_usage_across_all_models(self):
        org = make_org(logo=upload("counted.png"))
        self.assertTrue(is_file_referenced(org.logo.name))
        self.assertFalse(is_file_referenced("logo/never-existed.png"))
        # An empty name means "nothing to delete", so it counts as in use.
        self.assertTrue(is_file_referenced(""))


class CleanupTimeBudgetTest(TestCase):
    """Cleanup must not be able to run a request past the gateway timeout.

    Same shape as the upload 504: a per-operation timeout is not a bound on the
    work, because the number of operations is not bounded. Deleting one project
    cascades to a post_delete per image -- seven for the largest live row -- and
    each of those is its own storage round trip. At the old 15s delete timeout a
    slow Supabase turned that into ~105s, and nothing about a longer post would
    have made it better.

    The budget is per request rather than per call precisely because the calls
    arrive one-per-cascaded-row; a per-call limit would reset seven times over
    and bound nothing.
    """

    def setUp(self):
        from apps.core import file_cleanup

        self.file_cleanup = file_cleanup

    def _slow_storage(self, seconds, clock):
        storage = mock.Mock()

        def slow_delete(name):
            clock["t"] += seconds

        storage.delete.side_effect = slow_delete
        return storage

    def test_a_cascade_of_slow_deletes_stops_at_the_budget(self):
        clock = {"t": 0.0}
        storage = self._slow_storage(5.0, clock)

        with mock.patch.object(self.file_cleanup.time, "monotonic", lambda: clock["t"]), \
                mock.patch.object(self.file_cleanup, "is_file_referenced", return_value=False):
            self.file_cleanup.start_cleanup_budget()
            # One call per cascaded row, as the post_delete receiver produces.
            for i in range(30):
                self.file_cleanup.delete_unreferenced_files(storage, [f"img/{i}.webp"])

        self.assertLess(
            clock["t"], 30.0,
            f"cleanup occupied {clock['t']}s of the request; that is a 504",
        )
        self.assertLess(
            storage.delete.call_count, 30,
            "cleanup should have abandoned the remaining files once out of budget",
        )

    def test_without_a_budget_everything_is_still_cleaned(self):
        """Management commands have no gateway to answer to -- no budget applies."""
        clock = {"t": 0.0}
        storage = self._slow_storage(5.0, clock)

        with mock.patch.object(self.file_cleanup.time, "monotonic", lambda: clock["t"]), \
                mock.patch.object(self.file_cleanup, "is_file_referenced", return_value=False):
            self.file_cleanup.clear_cleanup_budget()
            for i in range(30):
                self.file_cleanup.delete_unreferenced_files(storage, [f"img/{i}.webp"])

        self.assertEqual(storage.delete.call_count, 30)
