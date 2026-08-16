"""Content caching and its per-namespace invalidation.

The suite as a whole runs with ``CONTENT_CACHE_ENABLED = False`` so that tests
see writes the instant they happen; this module turns it back on, which makes
it the only place the caching is actually exercised.

Two properties carry the design and are what these tests are really for:

* a warm read costs **no** database queries, because payloads are held in
  process memory; and
* invalidation is **per namespace** -- saving a blog post must not throw away
  the projects, about, or privacy caches, since each of those costs a fresh
  round trip to Supabase to rebuild.
"""

from datetime import UTC, datetime
from unittest import mock

from django.core.cache import cache
from django.db import connection
from django.test import TestCase, override_settings
from django.test.utils import CaptureQueriesContext

from apps.about.manager import AboutManager
from apps.about.models import Award, Profile, ProfileSkillHighlight, Skill
from apps.blog.models import BlogPost
from apps.core import cache as content_cache
from apps.core.content_manager import ContentManager
from apps.core.models import ContentVersion
from apps.legal.manager import LegalManager
from apps.legal.models import LegalDocument
from apps.openhire.manager import OpenHireManager
from apps.openhire.models import OpenToWorkProfile
from apps.projects.models import Project

AT = datetime(2026, 1, 1, tzinfo=UTC)


@override_settings(CONTENT_CACHE_ENABLED=True, CONTENT_CACHE_VERSION_TTL=60)
class ContentCacheTest(TestCase):
    def setUp(self):
        # LocMemCache lives in a module-level dict, so it outlives the per-test
        # transaction rollback that resets the version stamps. Without this,
        # one test's payloads would be visible to the next under a recycled
        # version number.
        cache.clear()
        self.addCleanup(cache.clear)

    @staticmethod
    def make_blog(title="First", slug="first"):
        return BlogPost.objects.create(
            title=title, slug=slug, author="A", created_at=AT, updated_at=AT
        )

    @staticmethod
    def make_project(title="Proj", slug="proj"):
        return Project.objects.create(title=title, slug=slug, created_at=AT, updated_at=AT)

    def warm(self):
        """Populate every cache entry under test."""
        ContentManager.get_blogs()
        ContentManager.get_projects()
        AboutManager.get_about_data()
        LegalManager.get_documents()
        AboutManager.get_awards()

    # -- the cache works -------------------------------------------------

    def test_a_warm_read_costs_no_queries(self):
        self.make_blog()
        ContentManager.get_blogs()

        with self.assertNumQueries(0):
            ContentManager.get_blogs()

    def test_a_warm_read_returns_the_same_content(self):
        self.make_blog(title="Cached title")
        first = ContentManager.get_blogs()
        second = ContentManager.get_blogs()

        self.assertEqual(first, second)
        self.assertEqual(second[0]["title"], "Cached title")

    def test_version_stamps_are_read_once_not_per_entry(self):
        """The stamp lookup is the only query a fully warm page makes, so it
        must be memoised rather than repeated for each manager call."""
        self.warm()

        with self.assertNumQueries(0):
            for _ in range(5):
                self.warm()

    def test_disabling_the_cache_bypasses_it_entirely(self):
        self.make_blog()
        with override_settings(CONTENT_CACHE_ENABLED=False):
            ContentManager.get_blogs()
            # No caching *and* no version lookup -- just the posts and their
            # prefetched images, exactly as before caching existed.
            with self.assertNumQueries(2):
                ContentManager.get_blogs()

    # -- invalidation is targeted ----------------------------------------

    def test_saving_a_blog_refreshes_blogs(self):
        self.make_blog(title="Before")
        self.assertEqual(ContentManager.get_blogs()[0]["title"], "Before")

        post = BlogPost.objects.get(slug="first")
        post.title = "After"
        post.save()

        self.assertEqual(ContentManager.get_blogs()[0]["title"], "After")

    def test_saving_a_blog_leaves_the_other_caches_warm(self):
        """The whole point of namespacing: a blog edit must not force projects,
        about and privacy to be rebuilt from Supabase."""
        self.make_blog()
        self.make_project()
        Profile.objects.create(name="Me")
        LegalDocument.objects.get(slug="privacy-policy")  # seeded by migration
        self.warm()

        self.make_blog(title="Second", slug="second")

        # Exactly one query: re-reading the version stamps, which the bump
        # invalidated locally. Rebuilding any of these four would cost several
        # more, so this count is what proves they were left alone.
        with self.assertNumQueries(1):
            ContentManager.get_projects()
            AboutManager.get_about_data()
            LegalManager.get_documents()
            AboutManager.get_awards()

    def test_deleting_a_row_refreshes_its_namespace(self):
        self.make_blog()
        self.assertEqual(len(ContentManager.get_blogs()), 1)

        BlogPost.objects.get(slug="first").delete()

        self.assertEqual(ContentManager.get_blogs(), [])

    def test_a_skill_edit_reaches_both_entries_that_embed_skills(self):
        """Projects embed whole tech_stack records and the about dict embeds
        highlighted skill names, so neither can ignore a Skill rename."""
        skill = Skill.objects.create(name="Django", slug="django", icon_svg="<svg/>")
        project = self.make_project()
        project.tech_stack.add(skill)
        profile = Profile.objects.create(name="Me")
        ProfileSkillHighlight.objects.create(profile=profile, skill=skill, order=0)

        self.assertEqual(ContentManager.get_projects()[0]["tech_stack"][0]["name"], "Django")
        self.assertEqual(AboutManager.get_about_data()["skills"], ["Django"])

        skill.name = "Django REST"
        skill.save()

        self.assertEqual(ContentManager.get_projects()[0]["tech_stack"][0]["name"], "Django REST")
        self.assertEqual(AboutManager.get_about_data()["skills"], ["Django REST"])

    def test_attaching_a_m2m_refreshes_projects(self):
        """tech_stack changes fire neither side's post_save -- only m2m_changed."""
        skill = Skill.objects.create(name="Flask", slug="flask", icon_svg="<svg/>")
        project = self.make_project()
        self.assertEqual(ContentManager.get_projects()[0]["tech_stack"], [])

        project.tech_stack.add(skill)

        self.assertEqual(len(ContentManager.get_projects()[0]["tech_stack"]), 1)

    def test_removing_a_m2m_refreshes_projects(self):
        skill = Skill.objects.create(name="Flask", slug="flask", icon_svg="<svg/>")
        project = self.make_project()
        project.tech_stack.add(skill)
        self.assertEqual(len(ContentManager.get_projects()[0]["tech_stack"]), 1)

        project.tech_stack.remove(skill)

        self.assertEqual(ContentManager.get_projects()[0]["tech_stack"], [])

    def test_singleton_edits_refresh_their_own_namespace_only(self):
        Profile.objects.create(name="Me")
        policy = LegalDocument.objects.get(slug="privacy-policy")  # seeded by migration
        self.make_project()
        self.warm()

        policy.summary = "Changed"
        policy.save()

        self.assertEqual(LegalManager.get_document("privacy-policy")["summary"], "Changed")
        with self.assertNumQueries(0):
            ContentManager.get_projects()

    def test_openhire_data_refreshes_on_its_own_model(self):
        profile = OpenToWorkProfile.load()
        profile.status = "Open"
        profile.save()
        self.assertEqual(OpenHireManager.get_open_to_work_data()["status"], "Open")

        profile.status = "Closed"
        profile.save()

        self.assertEqual(OpenHireManager.get_open_to_work_data()["status"], "Closed")

    def test_filtered_variants_are_cached_separately(self):
        Award.objects.create(title="A", institution="I", issued_month="Jan", issued_year=2024)
        Award.objects.create(title="B", institution="I", issued_month="Jan", issued_year=2024)

        descending = [a["title"] for a in AboutManager.get_awards(sort_by_id=True)]
        ascending = [a["title"] for a in AboutManager.get_awards(sort_by_id=False)]

        self.assertEqual(descending, list(reversed(ascending)))

    # -- values that must never be cached ---------------------------------

    def test_working_hours_flag_is_recomputed_not_frozen(self):
        """is_active comes from the Jakarta clock; a cached copy would pin the
        availability indicator to whatever it was when the page was first built."""
        Profile.objects.create(name="Me")

        with mock.patch.object(AboutManager, "is_working_hours", return_value=True):
            self.assertTrue(AboutManager.get_about_data()["is_active"])

        with mock.patch.object(AboutManager, "is_working_hours", return_value=False):
            self.assertFalse(AboutManager.get_about_data()["is_active"])

    def test_callers_cannot_corrupt_the_cached_copy(self):
        """The openhire view assigns into the dict it gets back, so a shared
        reference would leak that mutation into every later request."""
        OpenToWorkProfile.load()
        first = OpenHireManager.get_open_to_work_data()
        first["injected"] = "boom"

        self.assertNotIn("injected", OpenHireManager.get_open_to_work_data())

    # -- fixture loading ---------------------------------------------------

    def test_raw_saves_do_not_bump_versions(self):
        """loaddata replays rows verbatim; it shouldn't churn version stamps."""
        from django.db.models.signals import post_save

        post = self.make_blog()
        self.warm()
        # Captured after the ordinary save above, so only the raw send below
        # can move these numbers.
        before = dict(ContentVersion.objects.values_list("namespace", "version"))

        post_save.send(sender=BlogPost, instance=post, created=False,
                       raw=True, using="default", update_fields=None)

        self.assertEqual(dict(ContentVersion.objects.values_list("namespace", "version")), before)

    # -- resilience --------------------------------------------------------

    def test_unreadable_version_table_serves_uncached_instead_of_failing(self):
        """A half-applied migration must degrade to "slow", never to a 500."""
        self.make_blog(title="Still served")
        with mock.patch.object(
            content_cache, "_load_versions", return_value=None
        ):
            self.assertEqual(ContentManager.get_blogs()[0]["title"], "Still served")

    def test_a_failed_version_bump_does_not_break_the_save(self):
        self.make_blog()
        with mock.patch(
            "apps.core.models.ContentVersion.objects.filter",
            side_effect=RuntimeError("db down"),
        ):
            post = BlogPost.objects.get(slug="first")
            post.title = "Saved anyway"
            # assertLogs both asserts the failure is reported and keeps the
            # traceback out of the test runner's output, where it reads as a
            # crash rather than as the behaviour being exercised.
            with self.assertLogs("apps.core.cache", level="WARNING") as logs:
                post.save()  # must not raise
            self.assertIn("Could not bump content versions", logs.output[0])

        self.assertEqual(BlogPost.objects.get(slug="first").title, "Saved anyway")

    def test_unknown_entry_is_a_programming_error(self):
        with self.assertRaises(KeyError):
            content_cache.get_or_build("not_a_real_entry", lambda: 1)

    # -- cross-instance behaviour -----------------------------------------

    def test_a_bump_from_elsewhere_is_picked_up_once_the_memo_expires(self):
        """Simulates a second lambda: the version row moves underneath us, and
        the stale local payload must stop being served."""
        self.make_blog(title="Before")
        self.assertEqual(ContentManager.get_blogs()[0]["title"], "Before")

        # Change the row *without* going through the signal, exactly as another
        # instance's write would look from here.
        BlogPost.objects.filter(slug="first").update(title="Changed elsewhere")
        ContentVersion.objects.filter(namespace="blog").update(version=999)
        cache.delete("content:versions")  # memo expiry

        self.assertEqual(ContentManager.get_blogs()[0]["title"], "Changed elsewhere")

    def test_namespaces_cover_every_entry_dependency(self):
        """A typo in ENTRY_DEPENDENCIES would silently make an entry
        permanently cached, since an unknown namespace is never bumped."""
        for entry, deps in content_cache.ENTRY_DEPENDENCIES.items():
            for namespace in deps:
                self.assertIn(namespace, content_cache.NAMESPACES,
                              f"{entry} depends on unknown namespace {namespace!r}")

    def test_every_mapped_model_actually_exists(self):
        from django.apps import apps as django_apps

        for label in content_cache.MODEL_NAMESPACES:
            app_label, model_name = label.split(".")
            django_apps.get_model(app_label, model_name)  # raises if wrong


@override_settings(CONTENT_CACHE_ENABLED=True, CONTENT_CACHE_VERSION_TTL=60,
                   ALLOWED_HOSTS=["testserver"], SECURE_SSL_REDIRECT=False)
class DetailPageLookupTest(TestCase):
    """Detail pages resolve their slug against the cached list.

    The full post/project list is already in memory, so going back to Postgres
    for a row we're holding would buy nothing but a round trip.

    SECURE_SSL_REDIRECT is forced off because it is tied to ``not DEBUG``: with
    DEBUG=True locally these pages render, but under CI (DEBUG=False) every
    request 301s to https:// before reaching the view.
    """

    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)
        Profile.objects.create(name="Me")
        self.post = BlogPost.objects.create(
            title="Cached Post", slug="cached-post", author="A",
            created_at=AT, updated_at=AT,
        )
        self.project = Project.objects.create(
            title="Cached Project", slug="cached-project", created_at=AT, updated_at=AT,
        )

    def test_blog_detail_renders_the_right_post(self):
        response = self.client.get("/blog/cached-post/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Cached Post")

    def test_project_detail_renders_the_right_project(self):
        response = self.client.get("/projects/cached-project/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Cached Project")

    def test_unknown_slug_still_404s(self):
        self.assertEqual(self.client.get("/blog/no-such-post/").status_code, 404)
        self.assertEqual(self.client.get("/projects/no-such-project/").status_code, 404)

    # These assert on the SQL rather than a query count. The pages also load
    # comments, which are deliberately uncached, so a bare count would move
    # every time the comment section changes and would stop saying anything
    # about what it is here to protect: that the post/project itself is served
    # from cache and never re-fetched.

    def test_a_warm_project_detail_does_not_requery_the_project(self):
        self.client.get("/projects/cached-project/")

        with CaptureQueriesContext(connection) as queries:
            self.client.get("/projects/cached-project/")

        reads = [q["sql"] for q in queries.captured_queries
                 if 'FROM "projects_project"' in q["sql"]]
        self.assertEqual(reads, [], "the project should come from cache, not the DB")

    def test_a_warm_blog_detail_only_touches_the_post_to_bump_views(self):
        """The counter bump is a write and has to stay; the post's own content
        should already be in memory."""
        self.client.get("/blog/cached-post/")

        with CaptureQueriesContext(connection) as queries:
            self.client.get("/blog/cached-post/")

        touching_post = [q["sql"] for q in queries.captured_queries
                         if "blog_blogpost" in q["sql"]]
        self.assertEqual(len(touching_post), 1, touching_post)
        self.assertTrue(touching_post[0].lstrip().upper().startswith("UPDATE"))

    def test_the_view_counter_still_increments(self):
        self.client.get("/blog/cached-post/")
        self.client.get("/blog/cached-post/")

        self.post.refresh_from_db()
        self.assertEqual(self.post.views, 2)

    def test_find_by_slug_rejects_a_non_string(self):
        from django.core.exceptions import SuspiciousOperation

        from apps.core.base_views import DetailView

        with self.assertRaises(SuspiciousOperation):
            DetailView().find_by_slug([{"slug": "x"}], ["not", "a", "string"])
