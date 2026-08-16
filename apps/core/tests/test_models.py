"""Models remaining in apps/core.

The privacy policy used to live here as a singleton; it is now a row in
apps.legal.LegalDocument, covered by apps/legal/tests/.
"""

from django.test import TestCase

from apps.core.models import ContentVersion


class ContentVersionTest(TestCase):
    def test_a_namespace_starts_at_version_one(self):
        version = ContentVersion.objects.create(namespace="blog")
        self.assertEqual(version.version, 1)

    def test_the_namespace_is_the_primary_key(self):
        """One row per namespace, so a bump can never race a duplicate into
        existence alongside it.

        Scoped to this namespace on purpose: the seed migrations create legal
        documents, whose post_save fires the cache invalidation signal, so the
        test database already holds rows this test did not make.
        """
        ContentVersion.objects.create(namespace="blog")
        ContentVersion.objects.update_or_create(namespace="blog", defaults={"version": 7})

        self.assertEqual(ContentVersion.objects.filter(namespace="blog").count(), 1)
        self.assertEqual(ContentVersion.objects.get(namespace="blog").version, 7)

    def test_str_shows_namespace_and_version(self):
        version = ContentVersion.objects.create(namespace="projects", version=4)
        self.assertEqual(str(version), "projects v4")
