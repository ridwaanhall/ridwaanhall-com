from django.contrib.auth.mixins import LoginRequiredMixin
from django.db import transaction
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.utils import timezone
from django.views import View

from apps.core.base_views import BaseView
from apps.seo.mixins import GuestbookSEOMixin

from .models import ChatMessage
from .tree import build_thread


class UserProfileMixin:
    """
    Mixin to handle user profile data extraction
    """
    @staticmethod
    def mask_email(email):
        """
        Mask email for privacy: 1234567@gmail.com -> 12****7@gmail.com
        The number of asterisks matches the number of hidden characters.
        """
        if not email or '@' not in email:
            return email
        
        local, domain = email.split('@', 1)
        local_len = len(local)
        
        if local_len <= 1:
            # If only 1 character, show as is (no masking needed)
            return email
        elif local_len == 2:
            # For 2 characters: 12@gmail.com -> 1*@gmail.com
            return f"{local[0]}*@{domain}"
        elif local_len == 3:
            # For 3 characters: 123@gmail.com -> 1*3@gmail.com
            return f"{local[0]}*{local[-1]}@{domain}"
        elif local_len == 4:
            # For 4 characters: 1234@gmail.com -> 1**4@gmail.com
            return f"{local[0]}{'*' * 2}{local[-1]}@{domain}"
        else:
            # For 5+ characters: show first 2, mask middle, show last 1
            # 1234567@gmail.com -> 12****7@gmail.com
            hidden_count = local_len - 3  # Total - first 2 - last 1
            return f"{local[:2]}{'*' * hidden_count}{local[-1]}@{domain}"
    
    @staticmethod
    def get_user_profile_data(user):
        """
        Get user's full name, profile image from OAuth providers, and author/co-author status
        Optimized to use prefetched social account data to avoid N+1 queries
        """
        profile_data = {
            'full_name': user.get_full_name() or user.username,
            'profile_image': None,
            'is_author': False,
            'is_co_author': False,
            'co_author_order': 0,
            'email': user.email
        }
        
        # Check if user is author or co-author using prefetched userprofile
        try:
            if hasattr(user, 'userprofile'):
                profile_data['is_author'] = user.userprofile.is_author
                profile_data['is_co_author'] = user.userprofile.is_co_author
                profile_data['co_author_order'] = user.userprofile.co_author_order if user.userprofile.is_co_author else 0
            else:
                # Fallback if userprofile does not exist
                profile_data['is_author'] = user.is_staff
                profile_data['is_co_author'] = False
                profile_data['co_author_order'] = 0
        except:
            pass
        
        try:
            # Use prefetched social accounts to avoid database queries
            # This assumes socialaccount_set is already prefetched
            google_account = None
            github_account = None
            
            # Process prefetched social accounts
            for account in user.socialaccount_set.all():
                if account.provider == 'google':
                    google_account = account
                elif account.provider == 'github':
                    github_account = account
            
            # Get Google social account data first
            if google_account and google_account.extra_data:
                # Get full name from Google
                google_name = google_account.extra_data.get('name', '')
                if google_name:
                    profile_data['full_name'] = google_name
                else:
                    # Fallback to username if no name is available
                    profile_data['full_name'] = user.username
                
                # Get profile image from Google
                profile_image = google_account.extra_data.get('picture', '')
                if profile_image:
                    profile_data['profile_image'] = profile_image
                else:
                    # Fallback to default avatar if no image is available
                    profile_data['profile_image'] = 'https://www.gravatar.com/avatar/'

                # Get email from Google if available
                google_email = google_account.extra_data.get('email', '')
                if google_email:
                    profile_data['email'] = google_email
                else:
                    # Fallback to Django user email if Google email is not available
                    profile_data['email'] = user.email
            
            # Get GitHub social account data if Google is not available
            elif not profile_data['profile_image'] and github_account:
                if github_account and github_account.extra_data:
                    # Get full name from GitHub
                    github_name = github_account.extra_data.get('name', '') or github_account.extra_data.get('login', '')
                    if github_name:
                        profile_data['full_name'] = github_name
                      # Get profile image from GitHub
                    avatar_url = github_account.extra_data.get('avatar_url', '')
                    if avatar_url:
                        profile_data['profile_image'] = avatar_url
                    else:
                        # Fallback to default avatar if no image is available
                        profile_data['profile_image'] = 'https://www.gravatar.com/avatar/'
                    
                    # Get email from GitHub if available
                    github_email = github_account.extra_data.get('email', '')
                    if github_email:
                        profile_data['email'] = github_email
                    else:
                        # Fallback to Django user email if GitHub email is not available
                        profile_data['email'] = user.email
            
            # Set default profile image if none found
            if not profile_data['profile_image']:
                profile_data['profile_image'] = 'https://www.gravatar.com/avatar/'

        except Exception as e:
            # Fallback to Django user data
            pass

        # Authors and co-authors can pin/unpin messages
        profile_data['can_pin'] = profile_data['is_author'] or profile_data['is_co_author']

        return profile_data


class ThreadedMessagesMixin(UserProfileMixin):
    """
    Builds the threaded message panel.

    Shared by the page view and the AJAX post, so both go through exactly the
    same query, the same profile enrichment and the same call to build_thread().
    SendMessageView re-renders the whole panel rather than appending one node
    client-side: where a reply lands depends on the depth cap and on whether its
    parent fell inside the fetched window, and reimplementing that in JavaScript
    would be a second copy of apps/guestbook/tree.py free to disagree with this
    one -- the drift hazard the old hand-built message template already was.
    """

    # Matches what the panel can usefully scroll through. Threads whose root is
    # older than this still render; their replies just come back as roots
    # carrying a caption naming who they answered (see tree.build_thread).
    MESSAGE_WINDOW = 50

    def get_thread_context(self, request):
        """chat_messages (roots, oldest first), pinned cards, counts, viewer."""
        chat_messages = ChatMessage.objects.select_related(
            'user',
            'user__userprofile',
            'reply_to__user',
            'reply_to__user__userprofile'
        ).prefetch_related(
            'user__socialaccount_set',
            'reply_to__user__socialaccount_set'
        )[:self.MESSAGE_WINDOW]

        pinned_messages = ChatMessage.objects.filter(is_pinned=True).select_related(
            'user', 'user__userprofile'
        ).prefetch_related(
            'user__socialaccount_set'
        ).order_by('-pinned_at')[:ChatMessage.MAX_PINNED_MESSAGES]

        total_message_count = ChatMessage.objects.count()

        # Collect all users first and derive each profile once: the same person
        # usually appears many times over in a thread, and get_user_profile_data
        # walks their social accounts every call.
        all_users = set()
        for message in chat_messages:
            all_users.add(message.user)
            if message.reply_to:
                all_users.add(message.reply_to.user)
        for message in pinned_messages:
            all_users.add(message.user)

        user_profile_cache = {}
        for user in all_users:
            user_profile_cache[user.pk] = self.get_user_profile_data(user)

        enriched_messages = []
        for message in chat_messages:
            profile_data = user_profile_cache[message.user.pk]
            enriched_message = {
                'id': message.pk,
                'message': message.message,
                'timestamp': message.timestamp,
                'is_pinned': message.is_pinned,
                'user_full_name': profile_data['full_name'],
                'user_profile_image': profile_data['profile_image'],
                'user_is_author': profile_data['is_author'],
                'user_is_co_author': profile_data['is_co_author'],
                'user_co_author_order': profile_data['co_author_order'],
                'user_email': self.mask_email(profile_data['email']),
                'user_id': message.user.pk,
                'reply_to': None
            }

            if message.reply_to:
                reply_profile_data = user_profile_cache[message.reply_to.user.pk]
                enriched_message['reply_to'] = {
                    'id': message.reply_to.pk,
                    'message': message.reply_to.message,
                    'user_full_name': reply_profile_data['full_name'],
                    'user_profile_image': reply_profile_data['profile_image'],
                    'user_is_author': reply_profile_data['is_author'],
                    'user_is_co_author': reply_profile_data['is_co_author'],
                    'user_co_author_order': reply_profile_data['co_author_order'],
                    'user_email': self.mask_email(reply_profile_data['email']),
                    'user_id': message.reply_to.user.pk
                }
            enriched_messages.append(enriched_message)

        enriched_pinned_messages = []
        for message in pinned_messages:
            profile_data = user_profile_cache[message.user.pk]
            enriched_pinned_messages.append({
                'id': message.pk,
                'message': message.message,
                'user_full_name': profile_data['full_name'],
                'user_profile_image': profile_data['profile_image'],
                'user_is_author': profile_data['is_author'],
                'user_is_co_author': profile_data['is_co_author'],
            })

        if request.user.is_authenticated:
            current_user_profile = self.get_user_profile_data(request.user)
            current_user_profile['email'] = self.mask_email(current_user_profile['email'])
        else:
            current_user_profile = {
                'full_name': 'Guest',
                'profile_image': 'https://www.gravatar.com/avatar/',
                'is_author': False,
                'is_co_author': False,
                'co_author_order': 0,
                'email': '',
                'can_pin': False,
            }

        return {
            'chat_messages': build_thread(enriched_messages),
            'pinned_messages': enriched_pinned_messages,
            'pin_limit': ChatMessage.MAX_PINNED_MESSAGES,
            'message_count': total_message_count,
            'current_user_profile': current_user_profile,
        }

    def render_thread(self, request):
        """The messages panel as HTML, for the AJAX post to swap in."""
        return render_to_string(
            'guestbook/partials/_thread.html',
            self.get_thread_context(request),
            request=request,
        )


class GuestbookView(ThreadedMessagesMixin, GuestbookSEOMixin, BaseView):
    """
    Guestbook page view - displays the live chat page
    """
    template_name = 'guestbook/guestbook.html'

    def _get(self, request, *args, **kwargs):
        context = self.get_context_data()
        context.update(self.get_thread_context(request))
        context['about'] = self.get_about_data()
        return self.render_to_response(context)


class SendMessageView(LoginRequiredMixin, ThreadedMessagesMixin, View):
    """
    Handle sending chat messages via AJAX
    """

    def post(self, request, *args, **kwargs):
        """
        Create a new chat message
        """
        message_text = request.POST.get('message', '').strip()
        reply_to_id = request.POST.get('reply_to', '').strip()

        # Validate message is not empty and within length limits
        if not message_text:
            return JsonResponse({'success': False, 'error': 'Message cannot be empty'}, status=400)

        if len(message_text) < 2:
            return JsonResponse({'success': False, 'error': 'Message must be at least 2 characters long'}, status=400)

        if len(message_text) > 500:
            return JsonResponse({'success': False, 'error': 'Message must be 500 characters or less'}, status=400)

        # Handle reply
        reply_to_message = None
        if reply_to_id:
            try:
                reply_to_message = ChatMessage.objects.get(id=reply_to_id)
            except (ChatMessage.DoesNotExist, ValueError):
                # ValueError covers a non-numeric reply_to, which the ORM raises
                # before DoesNotExist can be checked. Either way the message is
                # still posted, just not as a reply.
                pass

        chat_message = ChatMessage.objects.create(
            user=request.user,
            message=message_text,
            reply_to=reply_to_message
        )

        # Hand back the rendered panel rather than the new message's fields: the
        # client used to assemble the markup itself from this JSON, which meant
        # every change to how a message looks had to be made twice.
        #
        # `notice` is the confirmation the browser shows. It is worded here, not
        # in the script, so the AJAX views and the comment views (which say the
        # same things through django.contrib.messages) stay parallel -- the two
        # surfaces are the same feature to a reader and shouldn't phrase it
        # differently. Errors already come back the same way, in `error`.
        return JsonResponse({
            'success': True,
            'message_id': chat_message.pk,
            'html': self.render_thread(request),
            'notice': 'Reply posted.' if reply_to_message else 'Message posted.',
        })

    def get(self, request, *args, **kwargs):
        """
        Handle GET requests (not allowed for this endpoint)
        """
        return JsonResponse({'success': False, 'error': 'GET method not allowed'})


class DeleteMessageView(LoginRequiredMixin, UserProfileMixin, View):
    """
    Handle deleting chat messages via AJAX - only for authors
    """
    
    def post(self, request, *args, **kwargs):
        """
        Delete a chat message
        """
        message_id = request.POST.get('message_id', '').strip()
        
        if not message_id:
            return JsonResponse({'success': False, 'error': 'Message ID is required'})
        
        try:
            message = ChatMessage.objects.get(id=message_id)
        except ChatMessage.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Message not found'})
        
        # Check permissions
        user_profile = self.get_user_profile_data(request.user)
        
        if not user_profile['is_author']:
            return JsonResponse({
                'success': False, 
                'error': 'Permission denied - Only authors can delete messages'
            })
        
        try:
            message.delete()
            return JsonResponse({
                'success': True,
                'notice': 'Message deleted.',
            })
        except Exception:
            return JsonResponse({'success': False, 'error': 'An error occurred while deleting the message'})

    def get(self, request, *args, **kwargs):
        """
        Handle GET requests (not allowed for this endpoint)
        """
        return JsonResponse({'success': False, 'error': 'GET method not allowed'})


class PinMessageView(LoginRequiredMixin, UserProfileMixin, View):
    """
    Handle pinning/unpinning chat messages via AJAX - authors and co-authors only.
    Toggles the pin state; enforces a maximum of ChatMessage.MAX_PINNED_MESSAGES at a time.
    """

    def post(self, request, *args, **kwargs):
        """
        Toggle the pinned state of a chat message
        """
        message_id = request.POST.get('message_id', '').strip()

        if not message_id:
            return JsonResponse({'success': False, 'error': 'Message ID is required'})

        try:
            message = ChatMessage.objects.select_related(
                'user', 'user__userprofile'
            ).prefetch_related('user__socialaccount_set').get(id=message_id)
        except (ChatMessage.DoesNotExist, ValueError):
            # ValueError covers a non-numeric message_id, which Django's ORM otherwise
            # raises before DoesNotExist can be checked.
            return JsonResponse({'success': False, 'error': 'Message not found'})

        # Check permissions - authors and co-authors can pin/unpin
        user_profile = self.get_user_profile_data(request.user)

        if not user_profile['can_pin']:
            return JsonResponse({
                'success': False,
                'error': 'Permission denied - Only authors and co-authors can pin messages'
            })

        if message.is_pinned:
            message.is_pinned = False
            message.pinned_at = None
            message.save(update_fields=['is_pinned', 'pinned_at'])
            return JsonResponse({
                'success': True,
                'is_pinned': False,
                'message_id': message.pk,
                'notice': 'Message unpinned.',
            })

        with transaction.atomic():
            # Serialize concurrent pin requests on one deterministic row lock (the
            # lowest-pk message, which every pinner contends on) before counting.
            # Locking just the currently-pinned rows isn't enough: that set locks
            # nothing when no message is pinned yet, and it can never cover a row a
            # concurrent transaction is in the middle of flipping to pinned - so two
            # requests could both read a count under the limit and both save, pushing
            # the pinned count past MAX_PINNED_MESSAGES. (No-op on SQLite, which is
            # dev/test only; production runs PostgreSQL.)
            ChatMessage.objects.select_for_update().order_by('pk').values_list('pk', flat=True).first()

            # Exclude this message from the count so a concurrent request that already
            # pinned it doesn't make re-pinning it look like it would exceed the cap.
            pinned_count = ChatMessage.objects.filter(is_pinned=True).exclude(pk=message.pk).count()
            if pinned_count >= ChatMessage.MAX_PINNED_MESSAGES:
                return JsonResponse({
                    'success': False,
                    'error': f'Maximum of {ChatMessage.MAX_PINNED_MESSAGES} pinned messages reached. Unpin one first.'
                })

            message.is_pinned = True
            message.pinned_at = timezone.now()
            message.save(update_fields=['is_pinned', 'pinned_at'])

        message_profile = self.get_user_profile_data(message.user)
        # The card comes back rendered, from the same partial the page load uses.
        # The client used to assemble it from these fields, which meant a change
        # to the card had to be made in the template and in the script both.
        card_html = render_to_string(
            'guestbook/partials/_pinned_card.html',
            {
                'pinned': {
                    'id': message.pk,
                    'message': message.message,
                    'user_full_name': message_profile['full_name'],
                    'user_profile_image': message_profile['profile_image'],
                    'user_is_author': message_profile['is_author'],
                    'user_is_co_author': message_profile['is_co_author'],
                },
                'current_user_profile': user_profile,
            },
            request=request,
        )
        return JsonResponse({
            'success': True,
            'is_pinned': True,
            'message_id': message.pk,
            'html': card_html,
            'notice': 'Message pinned.',
        })

    def get(self, request, *args, **kwargs):
        """
        Handle GET requests (not allowed for this endpoint)
        """
        return JsonResponse({'success': False, 'error': 'GET method not allowed'})