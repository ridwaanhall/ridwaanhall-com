"""The guestbook renders its thread server-side, and keeps doing so over AJAX.

The point of these is the *single* rendering path: posting a message and
pinning one both used to hand the browser JSON that a script turned into markup
of its own, and this pins the arrangement that replaced it.

SECURE_SSL_REDIRECT is forced off because it is tied to ``not DEBUG``, and CI
runs with DEBUG=False, where every request would 301 before reaching the view.
"""

import json

from django.contrib.auth.models import User
from django.test import TestCase, override_settings

from apps.about.models import Profile
from apps.guestbook.models import ChatMessage
from apps.guestbook.tree import MAX_DEPTH


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class ThreadRenderingTest(TestCase):
    def setUp(self):
        Profile.objects.create(name="Me")
        self.author = User.objects.create_user("author", "author@example.com", "pw")
        # Through the cached relation and save(), never .filter().update():
        # force_login() saves the User, whose post_save re-saves the cached
        # userprofile, which would write is_author=False straight back over an
        # update(). test_pin_message.py hit this first and documents it.
        self.author.userprofile.is_author = True
        self.author.userprofile.save()
        self.visitor = User.objects.create_user("visitor", "visitor@example.com", "pw")

    def post_chain(self, length):
        """A reply chain `length` messages deep, returned oldest first."""
        chain = [ChatMessage.objects.create(user=self.visitor, message="message 1")]
        for n in range(2, length + 1):
            chain.append(ChatMessage.objects.create(
                user=self.visitor, message=f"message {n}", reply_to=chain[-1]
            ))
        return chain

    def test_the_page_nests_replies_rather_than_listing_them_flat(self):
        parent = ChatMessage.objects.create(user=self.visitor, message="the parent")
        ChatMessage.objects.create(user=self.visitor, message="the reply", reply_to=parent)

        html = self.client.get("/guestbook/").content.decode()

        # The reply's node has to sit inside the parent's replies container --
        # that container is what draws the rail. A flat list would put the two
        # messages side by side instead, which is what this replaced.
        self.assertIn(f'data-message-id="{parent.pk}"', html)
        after_parents_container = html.split(f'data-replies-for="{parent.pk}"')[1]
        before_next_root = after_parents_container.split('data-replies-for="')[0]
        self.assertIn("the reply", before_next_root)
        self.assertIn('data-depth="1"', before_next_root)

    def test_depth_attributes_stop_at_the_cap(self):
        self.post_chain(6)

        html = self.client.get("/guestbook/").content.decode()

        depths = {int(part.split('"')[0]) for part in html.split('data-depth="')[1:]}
        self.assertTrue(depths)
        self.assertLessEqual(max(depths), MAX_DEPTH - 1)

    def test_a_reply_with_no_parent_in_the_window_still_renders(self):
        """Its parent is simply older than the fetched window."""
        parent = ChatMessage.objects.create(user=self.visitor, message="the ancestor")
        ChatMessage.objects.create(user=self.visitor, message="the orphan", reply_to=parent)
        parent.delete()  # cascade would take the reply, so re-create it detached
        lone = ChatMessage.objects.create(user=self.visitor, message="the orphan")

        html = self.client.get("/guestbook/").content.decode()

        self.assertIn(f'data-message-id="{lone.pk}"', html)
        self.assertIn("the orphan", html)

    def test_posting_returns_the_rendered_thread_not_message_fields(self):
        """The client used to assemble a message's markup from these fields,
        which meant every change to how a message looks had to be made twice."""
        self.client.force_login(self.visitor)

        response = self.client.post("/guestbook/send-message/", {"message": "hello there"})

        data = json.loads(response.content)
        self.assertTrue(data["success"])
        self.assertIn("html", data)
        self.assertIn("hello there", data["html"])
        self.assertIn("gb-message", data["html"])
        self.assertNotIn("profile_image", data)

    def test_a_posted_reply_comes_back_already_nested(self):
        parent = ChatMessage.objects.create(user=self.author, message="the parent")
        self.client.force_login(self.visitor)

        response = self.client.post(
            "/guestbook/send-message/",
            {"message": "the reply", "reply_to": parent.pk},
        )

        html = json.loads(response.content)["html"]
        nested = html.split(f'data-replies-for="{parent.pk}"')[1]
        self.assertIn("the reply", nested)

    def test_a_reply_to_a_message_that_vanished_still_posts(self):
        self.client.force_login(self.visitor)

        response = self.client.post(
            "/guestbook/send-message/", {"message": "still fine", "reply_to": "999999"}
        )

        self.assertTrue(json.loads(response.content)["success"])
        self.assertIsNone(ChatMessage.objects.get(message="still fine").reply_to)

    def test_a_non_numeric_reply_to_does_not_500(self):
        self.client.force_login(self.visitor)

        response = self.client.post(
            "/guestbook/send-message/", {"message": "still fine", "reply_to": "abc"}
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(json.loads(response.content)["success"])

    def test_a_one_character_message_is_refused_with_a_readable_error(self):
        """This is what the browser used to put in a native alert() box."""
        self.client.force_login(self.visitor)

        response = self.client.post("/guestbook/send-message/", {"message": "x"})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content)["error"],
            "Message must be at least 2 characters long",
        )

    def test_pinning_returns_the_rendered_card(self):
        message = ChatMessage.objects.create(user=self.visitor, message="pin me")
        self.client.force_login(self.author)

        response = self.client.post("/guestbook/pin-message/", {"message_id": message.pk})

        data = json.loads(response.content)
        self.assertTrue(data["is_pinned"])
        self.assertIn("pin me", data["html"])
        self.assertIn(f'data-pinned-message-id="{message.pk}"', data["html"])

    def test_posting_comes_back_with_a_confirmation_to_show(self):
        """Only failures used to say anything, so a message that posted fine
        gave no acknowledgement at all -- the panel just redrew."""
        self.client.force_login(self.visitor)

        response = self.client.post("/guestbook/send-message/", {"message": "hello there"})

        self.assertEqual(json.loads(response.content)["notice"], "Message posted.")

    def test_a_reply_says_reply_rather_than_message(self):
        parent = ChatMessage.objects.create(user=self.author, message="the parent")
        self.client.force_login(self.visitor)

        response = self.client.post(
            "/guestbook/send-message/", {"message": "the reply", "reply_to": parent.pk}
        )

        self.assertEqual(json.loads(response.content)["notice"], "Reply posted.")

    def test_deleting_comes_back_with_a_confirmation(self):
        message = ChatMessage.objects.create(user=self.visitor, message="delete me")
        self.client.force_login(self.author)

        response = self.client.post(
            "/guestbook/delete-message/", {"message_id": message.pk}
        )

        self.assertEqual(json.loads(response.content)["notice"], "Message deleted.")

    def test_pinning_and_unpinning_each_say_which_happened(self):
        message = ChatMessage.objects.create(user=self.visitor, message="pin me")
        self.client.force_login(self.author)

        pinned = self.client.post("/guestbook/pin-message/", {"message_id": message.pk})
        unpinned = self.client.post("/guestbook/pin-message/", {"message_id": message.pk})

        self.assertEqual(json.loads(pinned.content)["notice"], "Message pinned.")
        self.assertEqual(json.loads(unpinned.content)["notice"], "Message unpinned.")

    def test_the_wording_is_worded_server_side_not_in_the_script(self):
        """So the guestbook and the comment sections, which say the same things
        through django.contrib.messages, cannot drift apart."""
        html = self.client.get("/guestbook/").content.decode()

        self.assertNotIn('"Message posted."', html)
        self.assertIn("data.notice", html)

    def test_deleting_uses_the_shared_confirm_dialog_not_a_native_confirm(self):
        ChatMessage.objects.create(user=self.visitor, message="deletable")
        self.client.force_login(self.author)

        html = self.client.get("/guestbook/").content.decode()

        self.assertIn('data-confirm-event="guestbook:delete-message"', html)
        self.assertIn('data-confirm-title="Delete this message?"', html)
        self.assertIn('id="confirm-dialog"', html)

    def test_a_visitor_who_cannot_delete_gets_no_delete_control(self):
        ChatMessage.objects.create(user=self.visitor, message="not yours")
        self.client.force_login(self.visitor)

        html = self.client.get("/guestbook/").content.decode()

        # The attribute, not the bare event name -- the page's script listens
        # for that name whether or not any button can raise it.
        self.assertNotIn('data-confirm-event="guestbook:delete-message"', html)

    def test_message_text_is_escaped_in_the_rendered_thread(self):
        ChatMessage.objects.create(user=self.visitor, message='<img src=x onerror=alert(1)>')

        html = self.client.get("/guestbook/").content.decode()

        self.assertNotIn("<img src=x onerror", html)
        self.assertIn("&lt;img src=x onerror", html)

    def test_message_text_is_escaped_in_the_ajax_response_too(self):
        """The response is inserted with innerHTML, so this is the same hazard
        the old hand-rolled escapeHtml() existed to cover."""
        self.client.force_login(self.visitor)

        response = self.client.post(
            "/guestbook/send-message/", {"message": '<script>alert(1)</script>'}
        )

        html = json.loads(response.content)["html"]
        self.assertNotIn("<script>alert(1)</script>", html)
        self.assertIn("&lt;script&gt;", html)
