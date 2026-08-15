"""Query-count guards for the guestbook view."""

import time

from allauth.socialaccount.models import SocialAccount, SocialApp
from django.contrib.auth.models import User
from django.db import connection
from django.test import TransactionTestCase
from django.test.client import RequestFactory

from apps.about.models import Profile
from apps.guestbook.models import ChatMessage, UserProfile
from apps.guestbook.views import GuestbookView


class GuestbookPerformanceTestCase(TransactionTestCase):
    """
    Test case to verify the performance optimizations for guestbook queries.
    Tests that the N+1 query problem has been resolved.
    """

    def setUp(self):
        self.factory = RequestFactory()

        # BaseView.get_common_context() looks up a Profile row for the 'about'
        # context (now ORM-backed instead of always-available static data).
        Profile.objects.create(name="Test Author", role="Developer")

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
            SocialApp.objects.create(
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
        with self.assertNumQueries(9):  # 5 base + 1 pinned messages + 3 for the
            # ORM-backed about data: Profile, its DonateLinks, and its
            # skills_highlight M2M (one prefetch each, not N+1).
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
        with self.assertNumQueries(9):  # 5 base + 1 pinned messages + 3 for the
            # ORM-backed about data: Profile, its DonateLinks, and its
            # skills_highlight M2M (one prefetch each, not N+1).
            response = view._get(request)

        self.assertEqual(response.status_code, 200)
