"""PinMessageView permissions and the pin cap."""


from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.urls import reverse

from apps.guestbook.models import ChatMessage


@override_settings(SECURE_SSL_REDIRECT=False)
class PinMessageViewTestCase(TestCase):
    """
    Tests for PinMessageView: permission checks, the MAX_PINNED_MESSAGES cap,
    and handling of a malformed message_id (regression test for a bug where a
    non-numeric id raised an uncaught ValueError instead of a JSON error).

    SECURE_SSL_REDIRECT is forced off here because it's tied to `not DEBUG`
    (FlexForge/settings.py) and the Django test Client makes plain-HTTP
    requests: with DEBUG=False (the default in FlexForge/config.py, and what
    CI runs with since it doesn't set DEBUG), SecurityMiddleware 301-redirects
    every request here before it reaches the view, which fails on
    response.json() / status_code assertions rather than exercising
    PinMessageView at all.
    """

    def setUp(self):
        self.author = User.objects.create_user(username='author', email='author@example.com')
        # Set is_author through the cached relation + save(), not a bare .filter().update().
        # The save_user_profile post_save signal re-saves instance.userprofile whenever the
        # User itself is saved (as self.client.force_login() does, via last_login); if that
        # relation is still cached from creation-time with is_author=False, a prior
        # .filter().update(is_author=True) gets silently clobbered back to False on login.
        self.author.userprofile.is_author = True
        self.author.userprofile.save()

        self.plain_user = User.objects.create_user(username='plain', email='plain@example.com')

        self.messages = [
            ChatMessage.objects.create(user=self.plain_user, message=f'Message {i}')
            for i in range(4)
        ]

    def test_requires_login(self):
        response = self.client.post(reverse('pin_message'), {'message_id': self.messages[0].pk})
        self.assertNotEqual(response.status_code, 200)

    def test_non_author_permission_denied(self):
        self.client.force_login(self.plain_user)
        response = self.client.post(reverse('pin_message'), {'message_id': self.messages[0].pk})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['success'])

    def test_author_can_pin_and_unpin(self):
        self.client.force_login(self.author)
        message = self.messages[0]

        response = self.client.post(reverse('pin_message'), {'message_id': message.pk})
        data = response.json()
        self.assertTrue(data['success'])
        self.assertTrue(data['is_pinned'])
        message.refresh_from_db()
        self.assertTrue(message.is_pinned)
        self.assertIsNotNone(message.pinned_at)

        response = self.client.post(reverse('pin_message'), {'message_id': message.pk})
        data = response.json()
        self.assertTrue(data['success'])
        self.assertFalse(data['is_pinned'])
        message.refresh_from_db()
        self.assertFalse(message.is_pinned)
        self.assertIsNone(message.pinned_at)

    def test_max_pinned_messages_enforced(self):
        self.client.force_login(self.author)
        for message in self.messages[:ChatMessage.MAX_PINNED_MESSAGES]:
            response = self.client.post(reverse('pin_message'), {'message_id': message.pk})
            self.assertTrue(response.json()['success'])

        over_limit = self.messages[ChatMessage.MAX_PINNED_MESSAGES]
        response = self.client.post(reverse('pin_message'), {'message_id': over_limit.pk})
        data = response.json()
        self.assertFalse(data['success'])
        over_limit.refresh_from_db()
        self.assertFalse(over_limit.is_pinned)

    def test_non_numeric_message_id_returns_json_error_not_500(self):
        self.client.force_login(self.author)
        response = self.client.post(reverse('pin_message'), {'message_id': 'not-a-number'})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('error', data)

    def test_missing_message_not_found(self):
        self.client.force_login(self.author)
        response = self.client.post(reverse('pin_message'), {'message_id': 999999})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['success'])
