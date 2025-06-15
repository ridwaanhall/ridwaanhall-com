from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from allauth.socialaccount.models import SocialAccount
from .models import ChatMessage

def get_user_profile_data(user):
    """
    Get user's full name, profile image from Google, and author status
    """
    profile_data = {
        'full_name': user.get_full_name() or user.username,
        'profile_image': None,
        'is_author': False
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
                
    except Exception as e:
        # Fallback to Django user data
        pass
    
    return profile_data

# Create your views here.

def guestbook(request):
    """
    Guestbook page view - displays the live chat page
    """
    # Get all chat messages with user profile data and replies
    chat_messages = ChatMessage.objects.select_related('user', 'reply_to__user').all()[:50]  # Latest 50 messages
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
    
    context = {
        'title': 'Live Chat',
        'chat_messages': enriched_messages,
        'current_user_profile': current_user_profile,
    }
    return render(request, 'guestbook/guestbook.html', context)

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