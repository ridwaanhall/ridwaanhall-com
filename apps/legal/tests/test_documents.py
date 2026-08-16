"""Legal documents: model invariants, the pages, and the privacy migration.

SECURE_SSL_REDIRECT is forced off because it is tied to ``not DEBUG`` and CI
runs with DEBUG=False, where every request would 301 before reaching the view.
"""

from django.test import TestCase, override_settings

from apps.about.models import Profile
from apps.legal.manager import LegalManager
from apps.legal.models import LegalDocument, LegalSection


class LegalModelTest(TestCase):
    def setUp(self):
        self.document = LegalDocument.objects.create(title="Cookie Policy", slug="cookie-policy")

    def test_slug_is_derived_from_the_title_when_blank(self):
        document = LegalDocument.objects.create(title="Acceptable Use Policy")
        self.assertEqual(document.slug, "acceptable-use-policy")

    def test_sections_keep_their_order(self):
        for order, heading in [(2, "Second"), (1, "First"), (3, "Third")]:
            LegalSection.objects.create(document=self.document, heading=heading, order=order)

        self.assertEqual(
            [s.heading for s in self.document.sections.all()], ["First", "Second", "Third"]
        )

    def test_nesting_is_capped_at_one_level(self):
        """A child of a child re-parents to its grandparent, so the template
        never has to recurse and the page stays readable."""
        top = LegalSection.objects.create(document=self.document, heading="Top")
        child = LegalSection.objects.create(document=self.document, heading="Child", parent=top)
        grandchild = LegalSection.objects.create(document=self.document, heading="Deep", parent=child)

        self.assertEqual(grandchild.parent, top)

    def test_a_child_inherits_its_parents_document(self):
        other = LegalDocument.objects.create(title="Other", slug="other")
        top = LegalSection.objects.create(document=self.document, heading="Top")

        child = LegalSection.objects.create(document=other, heading="Child", parent=top)

        self.assertEqual(child.document, self.document)

    def test_the_privacy_policy_keeps_its_original_url(self):
        """It is referenced by the sitemap, SEO config, page footer and search
        modal, none of which know about this model."""
        # Seeded by the migration rather than created here, since the slug is unique.
        privacy = LegalDocument.objects.get(slug="privacy-policy")
        self.assertEqual(privacy.get_absolute_url(), "/privacy-policy/")

    def test_other_documents_get_the_generic_route(self):
        self.assertEqual(self.document.get_absolute_url(), "/legal/cookie-policy/")


class LegalManagerTest(TestCase):
    def test_unpublished_documents_are_not_returned(self):
        LegalDocument.objects.create(title="Draft", slug="draft", is_published=False)
        self.assertIsNone(LegalManager.get_document("draft"))

    def test_a_document_carries_its_sections_and_children(self):
        document = LegalDocument.objects.create(title="Terms", slug="t")
        top = LegalSection.objects.create(document=document, heading="Top", items={"a": "b"})
        LegalSection.objects.create(document=document, heading="Child", parent=top)

        data = LegalManager.get_document("t")

        self.assertEqual(len(data["sections"]), 1, "children must not appear at top level")
        self.assertEqual(data["sections"][0]["items"], {"a": "b"})
        self.assertEqual(data["sections"][0]["children"][0]["heading"], "Child")


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class LegalPageTest(TestCase):
    def setUp(self):
        Profile.objects.create(name="Me")

    def test_the_privacy_policy_page_renders(self):
        response = self.client.get("/privacy-policy/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Privacy Policy")

    def test_the_terms_page_renders(self):
        response = self.client.get("/terms/")

        self.assertEqual(response.status_code, 200)
        # The heading accents its last word in indigo, as the other pages do,
        # so the title is split across two elements.
        self.assertContains(response, "Terms &amp;")
        self.assertContains(response, '<span class="text-indigo-400">Conditions</span>')

    def test_a_document_is_reachable_by_its_generic_url(self):
        LegalDocument.objects.create(title="Cookie Policy", slug="cookie-policy")
        self.assertEqual(self.client.get("/legal/cookie-policy/").status_code, 200)

    def test_an_unknown_document_404s(self):
        self.assertEqual(self.client.get("/legal/nope/").status_code, 404)

    def test_an_unpublished_document_404s(self):
        LegalDocument.objects.create(title="Draft", slug="draft", is_published=False)
        self.assertEqual(self.client.get("/legal/draft/").status_code, 404)

    def test_section_content_is_rendered(self):
        document = LegalDocument.objects.get(slug="privacy-policy")
        LegalSection.objects.create(
            document=document, heading="A Distinctive Heading",
            items={"Some term": "Its description"}, order=99,
        )

        response = self.client.get("/privacy-policy/")

        self.assertContains(response, "A Distinctive Heading")
        self.assertContains(response, "Some term")
        self.assertContains(response, "Its description")

    def test_the_summary_is_not_repeated_as_a_section(self):
        """The old migration copied `overview` into both the document summary
        and an "Overview" section, so the same paragraph rendered twice."""
        document = LegalDocument.objects.get(slug="privacy-policy")
        document.summary = "A uniquely worded introduction."
        document.save()
        LegalSection.objects.create(
            document=document, heading="Real Section", body="Different text.", order=50,
        )

        html = self.client.get("/privacy-policy/").content.decode()

        self.assertEqual(html.count("A uniquely worded introduction."), 1)

    def test_entries_are_light_rows_inside_one_section_card(self):
        """These lists run to eleven entries. One bordered card per section with
        subtle rows inside is the pattern the rest of the site uses; a border
        per entry turned the page into a wall of boxes."""
        document = LegalDocument.objects.get(slug="privacy-policy")
        document.sections.all().delete()
        LegalSection.objects.create(
            document=document, heading="Terms",
            items={f"term {i}": f"description {i}" for i in range(8)}, order=1,
        )

        html = self.client.get("/privacy-policy/").content.decode()

        # Two bordered cards: the one section, plus the "Related documents"
        # card at the foot of the page. The eight entries inside carry no
        # border of their own.
        self.assertEqual(html.count("border border-zinc-700 rounded-lg p-4"), 2)
        self.assertEqual(html.count("bg-zinc-800/30 rounded"), 8)
        for i in range(8):
            self.assertIn(f"description {i}", html)

    def test_the_page_uses_the_site_wide_layout_shell(self):
        """The old page sat in flex-1 md:ml-62 > max-w-7xl like every other
        page; a narrower wrapper made it look misplaced against the sidebar."""
        html = self.client.get("/privacy-policy/").content.decode()

        self.assertIn("flex-1 md:ml-62", html)
        self.assertIn("max-w-7xl", html)

    def test_the_page_has_a_scroll_to_top_button(self):
        html = self.client.get("/privacy-policy/").content.decode()

        self.assertIn('id="scrollToTopBtn"', html)
        self.assertIn("js/backScroll.js", html)

    def test_the_terms_page_has_one_too(self):
        html = self.client.get("/terms/").content.decode()
        self.assertIn('id="scrollToTopBtn"', html)

    def test_documents_cross_link_to_each_other(self):
        html = self.client.get("/privacy-policy/").content.decode()
        self.assertIn("/terms/", html)


class PrivacyMigrationResultTest(TestCase):
    """The seeded content the data migrations produced.

    These run against the migrated test database, so they assert the migration
    actually did its job rather than re-implementing it.
    """

    def test_the_privacy_policy_was_migrated(self):
        document = LegalDocument.objects.get(slug="privacy-policy")

        self.assertEqual(document.document_type, "privacy")
        self.assertTrue(document.sections.exists())

    def test_a_fresh_install_still_gets_a_privacy_page(self):
        """The migration only converts data when an old PrivacyPolicy row
        exists. On a fresh database there is nothing to convert, but
        /privacy-policy/ is in the sitemap and every page footer, so the
        migration seeds an empty document rather than leaving a 404.

        (The conversion of real content is verified separately: a
        forward/reverse round trip restored all twelve original fields
        byte-for-byte.)
        """
        document = LegalDocument.objects.get(slug="privacy-policy")
        self.assertTrue(document.is_published)
        self.assertGreaterEqual(document.sections.count(), 5)

    def test_terms_were_seeded_with_content(self):
        document = LegalDocument.objects.get(slug="terms-and-conditions")

        self.assertEqual(document.document_type, "terms")
        self.assertGreaterEqual(document.sections.count(), 10)
        headings = [s.heading for s in document.sections.all()]
        self.assertIn("Acceptable use", headings)
        self.assertIn("Content you post", headings)
