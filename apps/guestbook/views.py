from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from allauth.socialaccount.models import SocialAccount
from apps.core.base_views import BaseView
from .models import ChatMessage
from apps.seo.mixins import GuestbookSEOMixin

def get_user_profile_data(user):
    """
    Get user's full name, profile image from Google, and author status
    """
    profile_data = {
        'full_name': user.get_full_name() or user.username,
        'profile_image': None,
        'is_author': False,
        'email': user.email
    }
    
    # Check if user is author
    try:
        if hasattr(user, 'userprofile') and user.userprofile.is_author:
            profile_data['is_author'] = True
    except:
        pass
    
    try:
        # Get Google social account data
        social_account = SocialAccount.objects.filter(user=user, provider='google').first()
        if social_account and social_account.extra_data:
            # Get full name from Google
            google_name = social_account.extra_data.get('name', '')
            if google_name:
                profile_data['full_name'] = google_name
            
            # Get profile image from Google
            profile_image = social_account.extra_data.get('picture', '')
            if profile_image:
                profile_data['profile_image'] = profile_image
            
            # Get email from Google if available
            google_email = social_account.extra_data.get('email', '')
            if google_email:
                profile_data['email'] = google_email
                
    except Exception as e:
        # Fallback to Django user data
        pass
    
    return profile_data

class GuestbookView(GuestbookSEOMixin, BaseView):
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
            profile_data = get_user_profile_data(message.user)
            message.user_full_name = profile_data['full_name']
            message.user_profile_image = profile_data['profile_image']
            message.user_is_author = profile_data['is_author']
            
            # Add reply_to profile data if it exists
            if message.reply_to:
                reply_profile_data = get_user_profile_data(message.reply_to.user)
                message.reply_to.user_full_name = reply_profile_data['full_name']
                message.reply_to.user_profile_image = reply_profile_data['profile_image']
                message.reply_to.user_is_author = reply_profile_data['is_author']
            
            enriched_messages.append(message)
        
        # Get current user profile data for navbar
        current_user_profile = None
        if request.user.is_authenticated:
            current_user_profile = get_user_profile_data(request.user)
        
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

@login_required
def send_message(request):
    """
    Handle sending chat messages (AJAX)
    """
    if request.method == 'POST':
        message_text = request.POST.get('message', '').strip()
        reply_to_id = request.POST.get('reply_to', '').strip()
        
        if message_text:
            # Handle reply
            reply_to_message = None
            if reply_to_id:
                try:
                    reply_to_message = ChatMessage.objects.get(id=reply_to_id)
                except ChatMessage.DoesNotExist:
                    pass
            
            chat_message = ChatMessage.objects.create(
                user=request.user,
                message=message_text,
                reply_to=reply_to_message
            )
            
            # Get user profile data
            profile_data = get_user_profile_data(request.user)
              # Prepare reply data if exists
            reply_data = None
            if reply_to_message:
                reply_profile_data = get_user_profile_data(reply_to_message.user)
                reply_data = {
                    'id': reply_to_message.pk,
                    'user': reply_profile_data['full_name'],
                    'message': reply_to_message.message[:50] + ('...' if len(reply_to_message.message) > 50 else ''),
                    'profile_image': reply_profile_data['profile_image'],
                    'is_author': reply_profile_data['is_author']
                }
            
            return JsonResponse({
                'success': True,
                'message': {
                    'id': chat_message.pk,
                    'user': profile_data['full_name'],
                    'message': chat_message.message,
                    'timestamp': chat_message.timestamp.strftime('%d/%m/%Y, %H:%M'),
                    'profile_image': profile_data['profile_image'],
                    'is_author': profile_data['is_author'],
                    'reply_to': reply_data
                }
            })
        else:
            return JsonResponse({'success': False, 'error': 'Message cannot be empty'})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required
def delete_message(request):
    """
    Handle deleting chat messages (AJAX) - only for authors
    """
    if request.method == 'POST':
        message_id = request.POST.get('message_id', '').strip()
        
        if not message_id:
            return JsonResponse({'success': False, 'error': 'Message ID is required'})
        
        try:
            message = ChatMessage.objects.get(id=message_id)
              # Check if user can delete this message
            user_profile = get_user_profile_data(request.user)
            can_delete = False
            
            # Only authors can delete any message
            if user_profile['is_author']:
                can_delete = True
            
            if not can_delete:
                return JsonResponse({'success': False, 'error': 'Permission denied - Only authors can delete messages'})
            
            # Delete the message
            message.delete()
            
            return JsonResponse({
                'success': True,
                'message': 'Message deleted successfully'
            })
            
        except ChatMessage.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Message not found'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': 'An error occurred'})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

# Function-based view wrapper for URL compatibility
def guestbook(request):
    """Function-based view wrapper for GuestbookView"""
    view = GuestbookView.as_view()
    return view(request)