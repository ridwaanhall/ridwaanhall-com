from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views import View
from allauth.socialaccount.models import SocialAccount
from apps.core.base_views import BaseView
from .models import ChatMessage
from apps.seo.mixins import GuestbookSEOMixin
import pytz


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
        """
        profile_data = {
            'full_name': user.get_full_name() or user.username,
            'profile_image': None,
            'is_author': False,
            'is_co_author': False,
            'co_author_order': 0,
            'email': user.email
        }
        
        # Check if user is author or co-author
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
            # Get Google social account data first
            google_account = SocialAccount.objects.filter(user=user, provider='google').first()
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
            elif not profile_data['profile_image']:
                github_account = SocialAccount.objects.filter(user=user, provider='github').first()
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
                    
        except Exception as e:
            # Fallback to Django user data
            pass
        
        return profile_data


class GuestbookView(UserProfileMixin, GuestbookSEOMixin, BaseView):
    """
    Guestbook page view - displays the live chat page
    """
    template_name = 'guestbook/guestbook.html'

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        about = self.get_about_data()
        
        # Get all chat messages with user profile data and replies
        chat_messages = ChatMessage.objects.select_related('user', 'reply_to__user').all()[:50]  # Latest 50 messages
        
        # Get total message count
        total_message_count = ChatMessage.objects.count()
        
        # Add profile data to each message
        enriched_messages = []
        for message in chat_messages:
            profile_data = self.get_user_profile_data(message.user)
            message.user_full_name = profile_data['full_name']
            message.user_profile_image = profile_data['profile_image']
            message.user_is_author = profile_data['is_author']
            message.user_is_co_author = profile_data['is_co_author']
            message.user_co_author_order = profile_data['co_author_order']
            message.user_email = self.mask_email(profile_data['email'])
            
            # Add reply_to profile data if it exists
            if message.reply_to:
                reply_profile_data = self.get_user_profile_data(message.reply_to.user)
                message.reply_to.user_full_name = reply_profile_data['full_name']
                message.reply_to.user_profile_image = reply_profile_data['profile_image']
                message.reply_to.user_is_author = reply_profile_data['is_author']
                message.reply_to.user_is_co_author = reply_profile_data['is_co_author']
                message.reply_to.user_co_author_order = reply_profile_data['co_author_order']
                message.reply_to.user_email = self.mask_email(reply_profile_data['email'])
            else:
                message.reply_to = None
            enriched_messages.append(message)
        
        # Get current user profile data
        current_user_profile = None
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
                'email': ''
            }
        
        # Get the base context with SEO data
        context = self.get_context_data()
        
        # Add guestbook-specific context
        context.update({
            'chat_messages': enriched_messages,
            'message_count': total_message_count,
            'current_user_profile': current_user_profile,
            'about': about,
        })
        
        return self.render_to_response(context)


class SendMessageView(LoginRequiredMixin, UserProfileMixin, View):
    """
    Handle sending chat messages via AJAX
    """
    
    def post(self, request, *args, **kwargs):
        """
        Create a new chat message
        """
        message_text = request.POST.get('message', '').strip()
        reply_to_id = request.POST.get('reply_to', '').strip()
        
        if not message_text:
            return JsonResponse({'success': False, 'error': 'Message cannot be empty'})
        
        # Handle reply
        reply_to_message = None
        if reply_to_id:
            try:
                reply_to_message = ChatMessage.objects.get(id=reply_to_id)
            except ChatMessage.DoesNotExist:
                pass
        
        # Create message
        chat_message = ChatMessage.objects.create(
            user=request.user,
            message=message_text,
            reply_to=reply_to_message
        )
        
        # Get user profile data
        profile_data = self.get_user_profile_data(request.user)
        
        # Prepare reply data if exists
        reply_data = None
        if reply_to_message:
            reply_profile_data = self.get_user_profile_data(reply_to_message.user)
            reply_data = {
                'id': reply_to_message.pk,
                'user': reply_profile_data['full_name'],
                'user_id': reply_to_message.user.id,
                'message': reply_to_message.message[:50] + ('...' if len(reply_to_message.message) > 50 else ''),
                'profile_image': reply_profile_data['profile_image'],
                'is_author': reply_profile_data['is_author'],
                'is_co_author': reply_profile_data['is_co_author'],
                'co_author_order': reply_profile_data['co_author_order'],
                'email': self.mask_email(reply_profile_data['email'])
            }
        else:
            reply_data = None
        
        # Convert timestamp to Jakarta timezone for consistency with template
        jakarta_tz = pytz.timezone('Asia/Jakarta')
        jakarta_timestamp = chat_message.timestamp.astimezone(jakarta_tz)
        
        return JsonResponse({
            'success': True,
            'message': {
                'id': chat_message.pk,
                'user': profile_data['full_name'],
                'user_id': chat_message.user.id,
                'message': chat_message.message,
                'timestamp': jakarta_timestamp.strftime('%d/%m/%Y, %H:%M'),
                'profile_image': profile_data['profile_image'],
                'is_author': profile_data['is_author'],
                'is_co_author': profile_data['is_co_author'],
                'co_author_order': profile_data['co_author_order'],
                'email': self.mask_email(profile_data['email']),
                'reply_to': reply_data
            }
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
                'message': 'Message deleted successfully'
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': 'An error occurred while deleting the message'})
    
    def get(self, request, *args, **kwargs):
        """
        Handle GET requests (not allowed for this endpoint)
        """
        return JsonResponse({'success': False, 'error': 'GET method not allowed'})