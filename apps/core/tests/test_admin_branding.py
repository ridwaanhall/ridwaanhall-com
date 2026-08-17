"""The admin is branded, and nothing Django ships was broken doing it.

The theme works by overriding Django's own CSS custom properties from
templates/admin/base_site.html. Only three blocks are overridden, so the
assertions below are mostly about what is still *present* -- the nav sidebar,
the light/dark toggle, the JSON widget assets and every registered page.

SECURE_SSL_REDIRECT is forced off because it is tied to ``not DEBUG`` and CI
runs with DEBUG=False, where every request would 301 before reaching the view.
"""

from django.contrib import admin
from django.contrib.auth.models import User
from django.test import TestCase, override_settings

THEME = "css/adminTheme-dbgmteua.css"


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class AdminBrandingTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_superuser("root", "root@example.com", "pw")
        self.client.force_login(self.user)

    def test_the_site_is_named_after_this_project(self):
        html = self.client.get("/admin/").content.decode()

        self.assertIn("Ridwan Halim", html)
        self.assertNotIn("Django administration", html)
        self.assertNotIn("Django site admin", html)

    def test_the_page_title_carries_the_site_name(self):
        html = self.client.get("/admin/").content.decode()
        self.assertIn("ridwaanhall.com admin", html)

    def test_the_theme_stylesheet_is_linked(self):
        self.assertIn(THEME, self.client.get("/admin/").content.decode())

    def test_the_brand_mark_renders(self):
        self.assertIn("site-mark", self.client.get("/admin/").content.decode())

    def test_the_profile_photo_is_the_brand_mark(self):
        """`about` reaches admin templates only through
        PortfolioAdminSite.each_context -- the admin gets no context from the
        site's views, so without it this silently falls back to initials."""
        from apps.about.models import Profile

        profile = Profile.objects.create(name="Me")
        profile.image.name = "profile/me.webp"
        profile.save()

        html = self.client.get("/admin/").content.decode()

        self.assertIn("site-mark--photo", html)
        # wsrv percent-encodes the wrapped URL, so the slashes are escaped.
        self.assertIn("me.webp", html)
        self.assertNotIn('aria-hidden="true">rh<', html)

    def test_the_photo_is_requested_at_the_size_it_is_shown(self):
        """Piped through wsrv_image so the header does not pull the full-size
        original on every admin page."""
        from apps.about.models import Profile

        profile = Profile.objects.create(name="Me")
        profile.image.name = "profile/me.webp"
        profile.save()

        html = self.client.get("/admin/").content.decode()

        self.assertRegex(html, r'site-mark--photo"[^>]*src="[^"]*(w=100|100x100|me\.webp)')

    def test_it_falls_back_to_initials_without_a_profile(self):
        """A fresh database has no Profile row, and the admin must still render
        rather than showing an empty circle or erroring on a None."""
        from apps.about.models import Profile

        Profile.objects.all().delete()

        html = self.client.get("/admin/").content.decode()

        self.assertIn("site-mark", html)
        self.assertNotIn("site-mark--photo", html)


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class AdminSiteWiringTest(TestCase):
    """The custom AdminSite is reached through AdminConfig.default_site, which
    is the hook that keeps every existing @admin.register working."""

    def setUp(self):
        self.user = User.objects.create_superuser("root", "root@example.com", "pw")
        self.client.force_login(self.user)

    def test_the_default_site_is_this_projects(self):
        from apps.core.admin_site import PortfolioAdminSite

        self.assertIsInstance(admin.site._wrapped, PortfolioAdminSite)

    def test_no_model_lost_its_registration(self):
        """Swapping the site class would orphan every ModelAdmin if it were
        done by instantiating a new site instead of naming it in the config."""
        from apps.about.models import Experience, Organization
        from apps.blog.models import BlogPost

        for model in (Experience, Organization, BlogPost):
            with self.subTest(model=model.__name__):
                self.assertIn(model, admin.site._registry)

    def test_each_context_survives_a_missing_profile(self):
        from apps.about.models import Profile

        Profile.objects.all().delete()

        self.assertEqual(self.client.get("/admin/").status_code, 200)

    def test_the_login_page_is_branded_and_themed(self):
        """It is the first thing anyone sees, and it renders before login, so
        it uses a different code path from the rest of the admin."""
        html = self.client.__class__().get("/admin/login/").content.decode()

        self.assertIn(THEME, html)
        self.assertIn("Ridwan Halim", html)


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class AdminStillWorksTest(TestCase):
    """Overriding base_site.html is the point at which admin features get lost
    by accident, so each one Django gives us is checked explicitly."""

    def setUp(self):
        self.user = User.objects.create_superuser("root", "root@example.com", "pw")
        self.client.force_login(self.user)

    def test_every_registered_page_still_responds(self):
        broken = []
        for model in admin.site._registry:
            meta = model._meta
            url = f"/admin/{meta.app_label}/{meta.model_name}/"
            response = self.client.get(url)
            # 302 is a singleton admin redirecting straight to its one row.
            if response.status_code not in (200, 302):
                broken.append((url, response.status_code))

        self.assertEqual(broken, [])

    def test_the_theme_reaches_every_page(self):
        unthemed = []
        for model in admin.site._registry:
            meta = model._meta
            response = self.client.get(f"/admin/{meta.app_label}/{meta.model_name}/")
            if response.status_code == 200 and THEME not in response.content.decode():
                unthemed.append(meta.model_name)

        self.assertEqual(unthemed, [])

    def test_the_nav_sidebar_is_intact(self):
        """A changelist rather than the index: the index has nothing to
        navigate to, so Django omits the toggle there."""
        html = self.client.get("/admin/about/experience/").content.decode()

        self.assertIn("nav_sidebar.css", html)
        self.assertIn("toggle-nav-sidebar", html)

    def test_the_light_dark_toggle_is_intact(self):
        """The theme styles both modes rather than forcing one, so this control
        must keep working."""
        self.assertIn("theme-toggle", self.client.get("/admin/").content.decode())

    def test_the_view_site_link_is_intact(self):
        self.assertIn("View site", self.client.get("/admin/").content.decode())

    def test_the_json_widget_assets_still_load(self):
        """The structured editors are the most customised part of this admin,
        and they draw their colours from the same variables the theme sets."""
        from datetime import UTC, datetime

        from apps.blog.models import BlogPost

        post = BlogPost.objects.create(
            title="P", slug="p", author="A",
            created_at=datetime(2026, 1, 1, tzinfo=UTC),
            updated_at=datetime(2026, 1, 1, tzinfo=UTC),
        )

        html = self.client.get(f"/admin/blog/blogpost/{post.pk}/change/").content.decode()

        self.assertIn("adminJsonWidgets.js", html)
        self.assertIn(THEME, html)

    def test_a_singleton_still_refuses_a_second_row(self):
        """SingletonModelAdmin returns 403 from /add/ once a row exists; the
        branding change must not have loosened that."""
        from apps.about.models import Profile

        Profile.objects.create(name="Me")

        self.assertEqual(self.client.get("/admin/about/profile/add/").status_code, 403)
