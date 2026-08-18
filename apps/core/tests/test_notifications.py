"""The site-wide notification surface.

These cover the two things that are easy to break and invisible when broken:
where the toast stack sits in the document, and whether Django messages still
render without JavaScript.

SECURE_SSL_REDIRECT is forced off because it is tied to ``not DEBUG``, and CI
runs with DEBUG=False, where every request would 301 before reaching the view.
"""

from html.parser import HTMLParser

from django.template.loader import render_to_string
from django.test import SimpleTestCase, TestCase, override_settings

from apps.about.models import Profile


class _Ancestry(HTMLParser):
    """Records whether #notifications was found inside #page-content."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth_of_page_content = None
        self.depth = 0
        self.notifications_nested = None
        self.found_notifications = False

    def handle_starttag(self, tag, attrs):
        if tag in ("br", "img", "input", "meta", "link", "hr", "source", "path"):
            return
        attributes = dict(attrs)
        if attributes.get("id") == "page-content":
            self.depth_of_page_content = self.depth
        if attributes.get("id") == "notifications":
            self.found_notifications = True
            self.notifications_nested = self.depth_of_page_content is not None
        self.depth += 1

    def handle_endtag(self, tag):
        if tag in ("br", "img", "input", "meta", "link", "hr", "source", "path"):
            return
        self.depth -= 1
        if self.depth_of_page_content is not None and self.depth == self.depth_of_page_content:
            # #page-content just closed.
            self.depth_of_page_content = None


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class NotificationPlacementTest(TestCase):
    def setUp(self):
        Profile.objects.create(name="Me")

    def test_the_toast_stack_is_not_inside_page_content(self):
        """#page-content carries a transform, and a transformed ancestor
        becomes the containing block for its position:fixed descendants -- a
        stack inside it would be positioned against the content column instead
        of the viewport. Nothing else in this repo catches that."""
        html = self.client.get("/guestbook/").content.decode()

        parser = _Ancestry()
        parser.feed(html)

        self.assertTrue(parser.found_notifications, "no #notifications on the page")
        self.assertFalse(
            parser.notifications_nested,
            "#notifications rendered inside #page-content; its fixed positioning "
            "will resolve against the content column, not the viewport",
        )

    def test_every_variant_template_is_available_to_clone(self):
        """notify() clones these rather than carrying its own class table, so a
        missing one silently turns into a no-op toast."""
        html = self.client.get("/guestbook/").content.decode()

        for variant in ("success", "error", "info"):
            self.assertIn(f'id="notify-toast-{variant}"', html)

    def test_the_script_is_loaded(self):
        html = self.client.get("/guestbook/").content.decode()

        self.assertIn("js/notify.js", html)

    def test_the_stack_is_present_on_pages_beyond_the_guestbook(self):
        """It lives in base_seo.html precisely so every page has one."""
        for path in ("/", "/contact/", "/about/"):
            with self.subTest(path=path):
                html = self.client.get(path).content.decode()
                self.assertIn('id="notifications"', html)


class ToastMarkupTest(SimpleTestCase):
    def render(self, variant, text=""):
        return render_to_string(
            "components/_toast.html", {"toast_variant": variant, "toast_text": text}
        )

    def test_each_variant_gets_its_own_colours(self):
        self.assertIn("border-green-700", self.render("success"))
        self.assertIn("border-red-700", self.render("error"))
        self.assertIn("border-blue-700", self.render("info"))

    def test_an_unknown_variant_falls_back_to_info_rather_than_rendering_unstyled(self):
        self.assertIn("border-blue-700", self.render("nonsense"))

    def test_the_variant_is_stated_in_words_for_screen_readers(self):
        """Colour alone cannot carry it."""
        self.assertIn("Error:", self.render("error"))
        self.assertIn("Success:", self.render("success"))

    def test_message_text_is_escaped(self):
        html = self.render("info", "<script>alert(1)</script>")

        self.assertNotIn("<script>alert(1)</script>", html)
        self.assertIn("&lt;script&gt;", html)

    def test_the_stack_renders_django_messages_server_side(self):
        """So flash feedback survives with JavaScript unavailable -- notify.js
        only adds dismissal and the client-raised toasts on top."""
        html = render_to_string(
            "components/notifications.html",
            {"messages": [type("M", (), {"tags": "error", "__str__": lambda s: "It failed."})()]},
        )

        self.assertIn("It failed.", html)
        self.assertIn("border-red-700", html)


class RetiredNotificationMarkupTest(SimpleTestCase):
    """The five separate implementations this replaced must stay gone -- each
    was its own copy of the same green/red/blue strip, and three of them
    shipped a dismissal handler too."""

    def test_the_per_page_message_blocks_are_gone(self):
        from django.template import TemplateDoesNotExist
        from django.template.loader import get_template

        for retired in (
            "guestbook/components/messages.html",
            "comments/_messages.html",
            "core/components/contact_messages.html",
        ):
            with self.subTest(template=retired):
                with self.assertRaises(TemplateDoesNotExist):
                    get_template(retired)
