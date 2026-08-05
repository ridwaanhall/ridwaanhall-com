from django.test import TestCase, TransactionTestCase
from django.contrib.auth.models import User
from django.test.client import RequestFactory
from django.db import connection
from django.test.utils import override_settings
from django.urls import reverse
from allauth.socialaccount.models import SocialAccount, SocialApp
from apps.guestbook.models import ChatMessage, UserProfile
from apps.guestbook.views import GuestbookView
import time

class GuestbookPerformanceTestCase(TransactionTestCase):
    """
    Test case to verify the performance optimizations for guestbook queries.
    Tests that the N+1 query problem has been resolved.
    """
    
    def setUp(self):
        self.factory = RequestFactory()
        
        # Create test users
        self.user1 = User.objects.create_user(username='testuser1', email='test1@example.com')
        self.user2 = User.objects.create_user(username='testuser2', email='test2@example.com')
        self.user3 = User.objects.create_user(username='testuser3', email='test3@example.com')
        
        # Create user profiles
        UserProfile.objects.filter(user=self.user1).update(is_author=True)
        UserProfile.objects.filter(user=self.user2).update(is_co_author=True, co_author_order=1)
        
        # Create social accounts for testing
        # Note: In a real test, you'd create SocialApp objects first
        try:
            app = SocialApp.objects.create(
                provider='google',
                name='Google',
                client_id='test-client-id',
                secret='test-secret',
            )
            
            SocialAccount.objects.create(
                user=self.user1,
                provider='google',
                uid='google-uid-1',
                extra_data={
                    'name': 'Test User One',
                    'email': 'test1@gmail.com',
                    'picture': 'https://example.com/pic1.jpg'
                }
            )
            
            SocialAccount.objects.create(
                user=self.user2,
                provider='github',
                uid='github-uid-2', 
                extra_data={
                    'name': 'Test User Two',
                    'email': 'test2@github.com',
                    'avatar_url': 'https://example.com/pic2.jpg'
                }
            )
        except Exception:
            # Skip social account setup if allauth apps not configured for tests
            pass
        
        # Create test chat messages
        for i in range(20):
            user = [self.user1, self.user2, self.user3][i % 3]
            msg = ChatMessage.objects.create(
                user=user,
                message=f'Test message {i+1} from {user.username}'
            )
            
            # Add some replies
            if i % 5 == 0 and i > 0:
                ChatMessage.objects.create(
                    user=user,
                    message=f'Reply to message {i}',
                    reply_to=msg
                )
    
    def test_guestbook_view_query_efficiency(self):
        """
        Test that the guestbook view doesn't generate excessive database queries.
        This test verifies the N+1 query problem has been resolved.
        """
        request = self.factory.get('/guestbook/')
        request.user = self.user1
        
        view = GuestbookView()
        view.request = request  # Set request attribute
        
        # Reset query counter
        connection.queries_log.clear()
        
        # Call the view method that was causing performance issues
        with self.assertNumQueries(6):  # 5 base queries + 1 for pinned messages
            response = view._get(request)
        
        # Verify the response contains the expected data
        self.assertEqual(response.status_code, 200)
        
        # Check that queries were optimized
        query_count = len(connection.queries)
        self.assertLess(query_count, 15, f"Too many queries: {query_count}")
        
    def test_user_profile_cache_efficiency(self):
        """
        Test that user profile data is cached and not fetched redundantly.
        """
        messages = ChatMessage.objects.all()[:10]
        
        # Get all unique users
        users = set(msg.user for msg in messages)
        
        # Ensure we have some duplicate users for testing cache efficiency
        self.assertTrue(len(users) < len(messages), "Test needs duplicate users for cache testing")
        
        # The view should handle this efficiently with caching
        request = self.factory.get('/guestbook/')
        request.user = self.user1
        
        view = GuestbookView()
        view.request = request  # Set request attribute
        
        start_time = time.time()
        response = view._get(request)
        elapsed_time = time.time() - start_time
        
        # Should complete quickly (less than 1 second even with many messages)
        self.assertLess(elapsed_time, 1.0, f"View took too long: {elapsed_time:.2f}s")
        self.assertEqual(response.status_code, 200)

    def test_prefetch_related_works(self):
        """
        Test that social account data is properly prefetched.
        """
        view = GuestbookView()
        request = self.factory.get('/guestbook/')
        request.user = self.user1
        view.request = request  # Set request attribute
        
        # This should work without additional queries for social accounts
        with self.assertNumQueries(6):  # 5 base queries + 1 for pinned messages
            response = view._get(request)

        self.assertEqual(response.status_code, 200)


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
