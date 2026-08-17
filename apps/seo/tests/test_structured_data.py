"""Structured data, robots directives and canonical URLs.

Every assertion here corresponds to something Google Search Console actually
reported, so the tests double as a record of what went wrong.

SECURE_SSL_REDIRECT is forced off because it is tied to ``not DEBUG`` and CI
runs with DEBUG=False, where every request would 301 before reaching the view.
"""

import json
import re

from django.test import TestCase, override_settings

from apps.about.models import Organization, Profile
from apps.seo.schema import SEOSchemaGenerator

ISO_DATE = re.compile(r"^\d{4}(-\d{2}){0,2}$")
ISO_DATETIME = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$")


def blocks(html):
    """Every JSON-LD block on a page, parsed."""
    raw = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    return [json.loads(chunk) for chunk in raw]


def walk(node):
    """Yield every (key, value) pair anywhere in a nested structure."""
    if isinstance(node, dict):
        for key, value in node.items():
            yield key, value
            yield from walk(value)
    elif isinstance(node, list):
        for item in node:
            yield from walk(item)


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class StructuredDataTest(TestCase):
    def setUp(self):
        Profile.objects.create(
            name="Me", social_email="hi@example.com",
            social_github="https://github.com/me",
        )

    def test_date_properties_are_iso_8601(self):
        """Search Console reported "Invalid datetime value" for dateCreated and
        dateModified, and startDate was being emitted as "Jan 2024"."""
        date_props = {"startDate", "endDate", "validFrom", "dateReceived"}
        datetime_props = {"dateCreated", "dateModified"}

        for path in ["/", "/about/", "/contact/", "/privacy-policy/", "/terms/"]:
            html = self.client.get(path).content.decode()
            for document in blocks(html):
                for key, value in walk(document):
                    if not isinstance(value, str) or not value:
                        continue
                    with self.subTest(page=path, prop=key, value=value):
                        if key in date_props:
                            self.assertRegex(value, ISO_DATE)
                        elif key in datetime_props:
                            self.assertRegex(value, ISO_DATETIME)

    def test_same_as_never_contains_a_bare_email(self):
        """An email in sameAs is resolved against the current page, which is how
        "https://ridwaanhall.com/about/hi@ridwaanhall.com" reached the index."""
        for path in ["/about/", "/contact/", "/"]:
            for document in blocks(self.client.get(path).content.decode()):
                for key, value in walk(document):
                    if key != "sameAs":
                        continue
                    for link in (value if isinstance(value, list) else [value]):
                        with self.subTest(page=path, link=link):
                            self.assertTrue(link.startswith(("http://", "https://")))
                            self.assertNotIn("@", link.split("://", 1)[1].split("/")[0])

    def test_no_url_template_is_advertised(self):
        """The WebSite schema used to declare a SearchAction pointing at
        /search?q={search_term_string}. There is no such endpoint, so Google
        crawled the literal URL and logged it as a 404."""
        html = self.client.get("/").content.decode()

        self.assertNotIn("search_term_string", html)
        for document in blocks(html):
            for key, value in walk(document):
                if key in ("url", "target", "urlTemplate") and isinstance(value, str):
                    self.assertNotIn("{", value)

    def test_every_public_page_declares_a_canonical(self):
        for path in ["/", "/about/", "/projects/", "/blog/", "/contact/",
                     "/privacy-policy/", "/terms/"]:
            html = self.client.get(path).content.decode()
            with self.subTest(page=path):
                self.assertIn('rel="canonical"', html)

    def test_legal_documents_carry_structured_data(self):
        """Terms shipped with no canonical, no meta description and no schema."""
        html = self.client.get("/terms/").content.decode()

        self.assertIn('rel="canonical"', html)
        documents = blocks(html)
        self.assertTrue(documents, "expected JSON-LD on the terms page")
        types = {d.get("@type") for d in documents}
        self.assertIn("WebPage", types)

    def test_a_current_role_omits_end_date(self):
        org = Organization.objects.create(name="Acme", website="https://acme.test")
        from datetime import date

        from apps.about.models import Experience

        Experience.objects.create(
            title="Dev", organization=org, period_start=date(2024, 1, 1),
            employment_type="Full-time", location_type="Remote",
            location="Remote", is_current=True, sort_order=0,
        )

        schema = SEOSchemaGenerator.generate_person_schema({"name": "Me", "skills": []})

        for role in schema.get("workExperience") or []:
            self.assertNotIn("endDate", role)


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class RobotsAndIndexingTest(TestCase):
    def setUp(self):
        Profile.objects.create(name="Me")

    def test_post_only_endpoints_are_disallowed(self):
        """Google logged these under "Not found (404)" after following them."""
        robots = self.client.get("/robots.txt").content.decode()

        for path in ["/guestbook/send-message/", "/guestbook/pin-message/",
                     "/guestbook/delete-message/", "/comments/"]:
            with self.subTest(path=path):
                self.assertIn(f"Disallow: {path}", robots)

    def test_redirect_endpoints_are_disallowed(self):
        """The CV routes redirect off-site; Google logged them as "Page with
        redirect"."""
        robots = self.client.get("/robots.txt").content.decode()

        for path in ["/cv/", "/cv-latest/", "/cv-copy/"]:
            with self.subTest(path=path):
                self.assertIn(f"Disallow: {path}", robots)

    def test_the_admin_stays_disallowed(self):
        self.assertIn("Disallow: /admin/", self.client.get("/robots.txt").content.decode())

    def test_sign_in_pages_are_noindexed_rather_than_blocked(self):
        """Blocking them stops the crawl, which also stops Google seeing a
        noindex -- so they sat in the index as "Blocked by robots.txt". They are
        crawlable now and carry the directive instead."""
        robots = self.client.get("/robots.txt").content.decode()
        self.assertNotIn("Disallow: /guestbook/accounts/", robots)

        response = self.client.get("/guestbook/accounts/login/")
        self.assertIn("noindex", response.headers.get("X-Robots-Tag", ""))

    def test_ordinary_pages_are_indexable(self):
        for path in ["/", "/about/", "/blog/"]:
            with self.subTest(path=path):
                header = self.client.get(path).headers.get("X-Robots-Tag", "")
                self.assertNotIn("noindex", header)

    def test_robots_lists_the_sitemaps(self):
        robots = self.client.get("/robots.txt").content.decode()
        self.assertEqual(robots.count("Sitemap:"), 4)


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class PaginationLinkTest(TestCase):
    """?page=1 and the bare URL serve identical content, so linking to both
    created the duplicate Google reported."""

    def setUp(self):
        Profile.objects.create(name="Me")

    def test_listings_never_link_to_page_one_explicitly(self):
        for path in ["/projects/", "/blog/"]:
            with self.subTest(path=path):
                self.assertNotIn("page=1", self.client.get(path).content.decode())

    def test_page_url_omits_the_parameter_for_page_one(self):
        from django.template import Context, Template
        from django.test import RequestFactory

        request = RequestFactory().get("/projects/")
        template = Template("{% load pagination_tags %}{% page_url 1 %}|{% page_url 2 %}")
        rendered = template.render(Context({"request": request}))

        self.assertEqual(rendered, "/projects/|/projects/?page=2")

    def test_a_search_query_survives_on_page_one(self):
        from django.template import Context, Template
        from django.test import RequestFactory

        request = RequestFactory().get("/projects/")
        template = Template("{% load pagination_tags %}{% page_url 1 'django' %}")

        self.assertEqual(template.render(Context({"request": request})), "/projects/?q=django")
