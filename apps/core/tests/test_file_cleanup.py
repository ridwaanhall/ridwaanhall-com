"""Storage cleanup when image rows are deleted or their file is replaced.

The shared-file cases matter most: several stored files are deliberately reused
across rows (the author photo appears on every BlogPost, one company logo
covers six Experience rows), so cleanup that ignored reference counting would
delete images still in use on the live site.
"""

import io
import shutil
import tempfile
from datetime import date

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from apps.about.models import Award, Certification, Experience
from apps.core.file_cleanup import is_file_referenced


def make_image(colour="red"):
    """A genuinely valid PNG -- ImageField runs it through Pillow on upload."""
    from PIL import Image

    buffer = io.BytesIO()
    Image.new("RGB", (2, 2), colour).save(buffer, format="PNG")
    return buffer.getvalue()


def upload(name, colour="red"):
    return SimpleUploadedFile(name, make_image(colour), content_type="image/png")


def make_experience(**kwargs):
    defaults = {
        "title": "Dev", "company": "Acme",
        "period_start": date(2024, 1, 1),
        "employment_type": "Full-time", "location_type": "Remote",
        "location": "Remote", "is_current": True, "sort_order": 0,
    }
    defaults.update(kwargs)
    return Experience.objects.create(**defaults)


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
        experience = make_experience(logo=upload("solo.png"))
        name = experience.logo.name
        storage = experience.logo.storage
        self.assertTrue(storage.exists(name))

        experience.delete()

        self.assertFalse(storage.exists(name), "the file should be gone with its only row")

    def test_deleting_one_row_keeps_a_file_another_row_still_uses(self):
        first = make_experience(logo=upload("shared.png"))
        name = first.logo.name
        storage = first.logo.storage
        # A second row pointing at the very same stored file, exactly as the
        # real data does for repeated company logos.
        second = make_experience(company="Other")
        second.logo.name = name
        second.save()

        first.delete()

        self.assertTrue(storage.exists(name), "file is still used by another row")
        second.refresh_from_db()
        self.assertEqual(second.logo.name, name)

    def test_shared_file_is_removed_once_the_last_row_goes(self):
        first = make_experience(logo=upload("last.png"))
        name = first.logo.name
        storage = first.logo.storage
        second = make_experience(company="Other")
        second.logo.name = name
        second.save()

        first.delete()
        second.delete()

        self.assertFalse(storage.exists(name))

    def test_cleanup_spans_models_not_just_the_one_being_deleted(self):
        """An Award and a Certification really do share a logo in the real data."""
        award = Award.objects.create(
            title="A", institution="Inst", issued=date(2024, 1, 1),
            logo=upload("cross-model.png"),
        )
        name = award.logo.name
        storage = award.logo.storage
        cert = Certification.objects.create(
            title="C", institution="Inst", issued=date(2024, 1, 1),
        )
        cert.logo.name = name
        cert.save()

        award.delete()

        self.assertTrue(storage.exists(name), "still referenced by a different model")

    def test_deleting_a_row_without_a_file_is_harmless(self):
        make_experience().delete()  # no logo set; must not raise

    # -- replacement -----------------------------------------------------

    def test_replacing_an_image_deletes_the_previous_file(self):
        experience = make_experience(logo=upload("before.png"))
        old_name = experience.logo.name
        storage = experience.logo.storage

        experience.logo = upload("after.png", "blue")
        experience.save()

        self.assertNotEqual(experience.logo.name, old_name)
        self.assertFalse(storage.exists(old_name), "the replaced file should be gone")
        self.assertTrue(storage.exists(experience.logo.name))

    def test_replacing_an_image_keeps_a_file_another_row_still_uses(self):
        first = make_experience(logo=upload("keepme.png"))
        shared_name = first.logo.name
        storage = first.logo.storage
        second = make_experience(company="Other")
        second.logo.name = shared_name
        second.save()

        first.logo = upload("fresh.png", "blue")
        first.save()

        self.assertTrue(storage.exists(shared_name), "still used by the second row")

    def test_saving_without_touching_the_image_keeps_it(self):
        experience = make_experience(logo=upload("stable.png"))
        name = experience.logo.name
        storage = experience.logo.storage

        experience.title = "Renamed"
        experience.save()

        self.assertTrue(storage.exists(name))

    # -- helper ----------------------------------------------------------

    def test_is_file_referenced_reports_usage_across_all_models(self):
        experience = make_experience(logo=upload("counted.png"))
        self.assertTrue(is_file_referenced(experience.logo.name))
        self.assertFalse(is_file_referenced("logo/never-existed.png"))
        # An empty name means "nothing to delete", so it counts as in use.
        self.assertTrue(is_file_referenced(""))
