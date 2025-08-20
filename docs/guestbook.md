# Guestbook App Documentation

## Overview

The Guestbook app is an interactive, chat-like messaging system that allows visitors to leave messages after authenticating with Google or GitHub OAuth. It features author/co-author roles, message threading with replies, real-time interactions, and comprehensive moderation capabilities. The guestbook can be easily enabled or disabled through configuration settings.

## Table of Contents

- [App Structure](#app-structure)
- [OAuth Integration](#oauth-integration)
- [Authentication Flow](#authentication-flow)
- [Models and Database Structure](#models-and-database-structure)
- [Views and Functionality](#views-and-functionality)
- [Real-time Features](#real-time-features)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Message Management](#message-management)
- [Configuration](#configuration)
- [OAuth Setup Instructions](#oauth-setup-instructions)
- [Templates and UI](#templates-and-ui)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## App Structure

```txt
apps/guestbook/
├── __init__.py
├── admin.py              # Django admin configuration
├── apps.py              # App configuration
├── models.py            # UserProfile and ChatMessage models
├── views.py             # Guestbook views and API endpoints
├── urls.py              # URL patterns including allauth
├── tests.py
├── migrations/          # Database migrations
├── management/          # Custom management commands
│   └── commands/
├── templates/           # Guestbook templates
│   └── guestbook/
│       ├── guestbook.html      # Main guestbook page
│       └── partials/           # Template components
└── static/             # Guestbook-specific static files
    ├── css/
    ├── js/
    └── img/
```

## OAuth Integration

### Supported Providers

The Guestbook integrates with two OAuth providers:

1. **Google OAuth**
   - Full name and profile picture from Google account
   - Email address for identification
   - Rich profile data integration

2. **GitHub OAuth**
   - Username and avatar from GitHub profile
   - Public profile information
   - Developer-friendly authentication

### OAuth Workflow

```python
# OAuth provider configuration
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        }
    },
    'github': {
        'SCOPE': [
            'user:email',
        ],
    }
}
```

### Profile Data Extraction

The app automatically extracts profile information from OAuth providers:

```python
# apps/guestbook/views.py - UserProfileMixin
class UserProfileMixin:
    @staticmethod
    def get_user_profile_data(user):
        """
        Get user's full name, profile image from OAuth providers,
        and author/co-author status
        """
        profile_data = {
            'full_name': user.get_full_name() or user.username,
            'profile_image': None,
            'is_author': False,
            'is_co_author': False,
            'email': user.email
        }
        
        # Check Google account first
        google_account = SocialAccount.objects.filter(user=user, provider='google').first()
        if google_account and google_account.extra_data:
            profile_data['full_name'] = google_account.extra_data.get('name', user.username)
            profile_data['profile_image'] = google_account.extra_data.get('picture', '')
            profile_data['email'] = google_account.extra_data.get('email', user.email)
        
        # Fallback to GitHub if Google not available
        elif not profile_data['profile_image']:
            github_account = SocialAccount.objects.filter(user=user, provider='github').first()
            if github_account and github_account.extra_data:
                profile_data['full_name'] = (
                    github_account.extra_data.get('name') or 
                    github_account.extra_data.get('login', user.username)
                )
                profile_data['profile_image'] = github_account.extra_data.get('avatar_url', '')
                profile_data['email'] = github_account.extra_data.get('email', user.email)
        
        # Check author/co-author status
        if hasattr(user, 'userprofile'):
            profile_data['is_author'] = user.userprofile.is_author
            profile_data['is_co_author'] = user.userprofile.is_co_author
        
        return profile_data
```

## Authentication Flow

### Login Process

1. **User clicks login button**
2. **Redirected to OAuth provider** (Google or GitHub)
3. **User grants permissions** to the application
4. **OAuth provider redirects back** with authorization code
5. **Application exchanges code** for access token
6. **Profile data extracted** and user created/updated
7. **User redirected to guestbook** with authenticated session

### User Registration

```python
# Automatic user profile creation
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'userprofile'):
        instance.userprofile.save()
    else:
        UserProfile.objects.create(user=instance)
```

## Models and Database Structure

### UserProfile Model

Extends Django's User model with guestbook-specific data:

```python
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_author = models.BooleanField(
        default=False, 
        help_text="Designates whether this user is the site author/owner"
    )
    is_co_author = models.BooleanField(
        default=False, 
        help_text="Designates whether this user is a co-author (max 2)"
    )
    co_author_order = models.PositiveIntegerField(
        default=0, 
        help_text="Order of co-author assignment (for FIFO removal)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
```

#### UserProfile Fields

| Field | Type | Description |
|-------|------|-------------|
| `user` | OneToOneField | Link to Django User model |
| `is_author` | BooleanField | Site owner/author status |
| `is_co_author` | BooleanField | Co-author status (max 2 users) |
| `co_author_order` | PositiveIntegerField | FIFO order for co-author management |
| `created_at` | DateTimeField | Profile creation timestamp |

### ChatMessage Model

Stores guestbook messages with threading support:

```python
class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField(max_length=500)
    timestamp = models.DateTimeField(default=timezone.now)
    reply_to = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='replies'
    )
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username}: {self.message[:50]}..."
```

#### ChatMessage Fields

| Field | Type | Description |
|-------|------|-------------|
| `user` | ForeignKey | Message author (User model) |
| `message` | TextField | Message content (max 500 chars) |
| `timestamp` | DateTimeField | Message creation time |
| `reply_to` | ForeignKey | Parent message for threading |

## Views and Functionality

### GuestbookView - Main Guestbook Page

```python
class GuestbookView(GuestbookSEOMixin, BaseView):
    """
    Main guestbook view displaying messages and handling authentication.
    """
    template_name = 'guestbook/guestbook.html'
    
    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)
    
    def _get(self, request, *args, **kwargs):
        about = self.get_about_data()
        
        # Get all messages with user profiles
        messages = []
        chat_messages = ChatMessage.objects.select_related('user').all()
        
        for msg in chat_messages:
            user_data = UserProfileMixin.get_user_profile_data(msg.user)
            
            message_data = {
                'id': msg.id,
                'user': msg.user,
                'message': msg.message,
                'timestamp': msg.timestamp,
                'reply_to': msg.reply_to,
                'user_profile': user_data,
            }
            messages.append(message_data)
        
        context = {
            'about': about,
            'messages': messages,
            'is_authenticated': request.user.is_authenticated,
        }
        
        # Add user profile data if authenticated
        if request.user.is_authenticated:
            context['user_profile'] = UserProfileMixin.get_user_profile_data(request.user)
        
        # Add SEO data
        context.update(self.get_context_data(**context))
        return self.render_to_response(context)
```

### SendMessageView - AJAX Message Posting

```python
class SendMessageView(LoginRequiredMixin, View):
    """
    AJAX endpoint for sending new messages.
    Requires authentication and handles message validation.
    """
    
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            message_text = data.get('message', '').strip()
            reply_to_id = data.get('reply_to')
            
            # Validate message
            if not message_text:
                return JsonResponse({'error': 'Message cannot be empty'}, status=400)
            
            if len(message_text) > 500:
                return JsonResponse({'error': 'Message too long (max 500 characters)'}, status=400)
            
            # Handle reply
            reply_to = None
            if reply_to_id:
                try:
                    reply_to = ChatMessage.objects.get(id=reply_to_id)
                except ChatMessage.DoesNotExist:
                    return JsonResponse({'error': 'Reply message not found'}, status=400)
            
            # Create message
            message = ChatMessage.objects.create(
                user=request.user,
                message=message_text,
                reply_to=reply_to
            )
            
            # Get user profile data
            user_profile = UserProfileMixin.get_user_profile_data(request.user)
            
            # Return message data
            return JsonResponse({
                'success': True,
                'message': {
                    'id': message.id,
                    'message': message.message,
                    'timestamp': message.timestamp.isoformat(),
                    'user': {
                        'username': message.user.username,
                        'profile': user_profile
                    },
                    'reply_to': reply_to.id if reply_to else None,
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            return JsonResponse({'error': 'Server error'}, status=500)
```

### MessageManagementView - Admin Operations

```python
class MessageManagementView(LoginRequiredMixin, View):
    """
    AJAX endpoint for message management operations (delete, etc.).
    Only available to authors and co-authors.
    """
    
    def post(self, request, *args, **kwargs):
        # Check permissions
        user_profile = UserProfileMixin.get_user_profile_data(request.user)
        if not (user_profile['is_author'] or user_profile['is_co_author']):
            return JsonResponse({'error': 'Permission denied'}, status=403)
        
        try:
            data = json.loads(request.body)
            action = data.get('action')
            message_id = data.get('message_id')
            
            if not message_id:
                return JsonResponse({'error': 'Message ID required'}, status=400)
            
            try:
                message = ChatMessage.objects.get(id=message_id)
            except ChatMessage.DoesNotExist:
                return JsonResponse({'error': 'Message not found'}, status=404)
            
            if action == 'delete':
                message.delete()
                return JsonResponse({'success': True, 'action': 'deleted'})
            else:
                return JsonResponse({'error': 'Unknown action'}, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            logger.error(f"Error in message management: {e}")
            return JsonResponse({'error': 'Server error'}, status=500)
```

## Real-time Features

### AJAX-Based Messaging

The guestbook uses AJAX for real-time messaging without page reloads:

```javascript
// guestbook.js - AJAX message sending
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    
    if (!messageText) {
        showError('Please enter a message');
        return;
    }
    
    try {
        const response = await fetch('/guestbook/send/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                message: messageText,
                reply_to: currentReplyTo
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            addMessageToChat(data.message);
            messageInput.value = '';
            clearReply();
        } else {
            showError(data.error || 'Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Network error. Please try again.');
    }
}

// Add new message to chat UI
function addMessageToChat(messageData) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageElement = createMessageElement(messageData);
    messagesContainer.insertBefore(messageElement, messagesContainer.firstChild);
    
    // Scroll to new message
    messageElement.scrollIntoView({ behavior: 'smooth' });
}
```

### WebSocket Enhancement (Optional)

For real-time updates across multiple users, WebSocket integration can be added:

```python
# websocket_consumer.py (optional enhancement)
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GuestbookConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = 'guestbook'
        self.room_group_name = f'guestbook_{self.room_name}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def new_message(self, event):
        message_data = event['message_data']
        
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': message_data
        }))
```

## User Roles and Permissions

### Role Hierarchy

1. **Author** (`is_author=True`)
   - Site owner/main author
   - Full moderation permissions
   - Can delete any message
   - Can manage co-authors

2. **Co-Author** (`is_co_author=True`)
   - Up to 2 co-authors allowed
   - Message moderation permissions
   - Can delete messages
   - FIFO removal when limit exceeded

3. **Regular User** (Authenticated)
   - Can post messages
   - Can reply to messages
   - Can only delete own messages

4. **Anonymous User**
   - Can view messages
   - Must authenticate to participate

### Permission System

```python
# Permission checking utility
class GuestbookPermissions:
    @staticmethod
    def can_moderate(user):
        """Check if user can moderate messages."""
        if not user.is_authenticated:
            return False
        
        profile_data = UserProfileMixin.get_user_profile_data(user)
        return profile_data['is_author'] or profile_data['is_co_author']
    
    @staticmethod
    def can_delete_message(user, message):
        """Check if user can delete specific message."""
        if not user.is_authenticated:
            return False
        
        # Own message
        if message.user == user:
            return True
        
        # Moderator permissions
        return GuestbookPermissions.can_moderate(user)
    
    @staticmethod
    def can_manage_users(user):
        """Check if user can manage other users."""
        if not user.is_authenticated:
            return False
        
        profile_data = UserProfileMixin.get_user_profile_data(user)
        return profile_data['is_author']  # Only authors can manage users
```

### Co-Author Management

```python
# Co-author management system
class CoAuthorManager:
    MAX_CO_AUTHORS = 2
    
    @classmethod
    def add_co_author(cls, user):
        """Add user as co-author with FIFO management."""
        current_co_authors = UserProfile.objects.filter(is_co_author=True).count()
        
        if current_co_authors >= cls.MAX_CO_AUTHORS:
            # Remove oldest co-author (FIFO)
            oldest_co_author = UserProfile.objects.filter(
                is_co_author=True
            ).order_by('co_author_order').first()
            
            if oldest_co_author:
                oldest_co_author.is_co_author = False
                oldest_co_author.co_author_order = 0
                oldest_co_author.save()
        
        # Add new co-author
        user_profile = user.userprofile
        user_profile.is_co_author = True
        user_profile.co_author_order = timezone.now().timestamp()
        user_profile.save()
    
    @classmethod
    def remove_co_author(cls, user):
        """Remove user from co-author role."""
        user_profile = user.userprofile
        user_profile.is_co_author = False
        user_profile.co_author_order = 0
        user_profile.save()
```

## Message Management

### Message Threading

The guestbook supports threaded conversations with replies:

```python
# Message threading utilities
class MessageThreading:
    @staticmethod
    def get_thread_messages(parent_message):
        """Get all replies to a message."""
        return ChatMessage.objects.filter(
            reply_to=parent_message
        ).order_by('timestamp')
    
    @staticmethod
    def get_message_with_replies(message_id):
        """Get message with all its replies."""
        try:
            parent_message = ChatMessage.objects.get(id=message_id)
            replies = MessageThreading.get_thread_messages(parent_message)
            
            return {
                'parent': parent_message,
                'replies': replies,
                'reply_count': replies.count()
            }
        except ChatMessage.DoesNotExist:
            return None
    
    @staticmethod
    def build_thread_tree(messages):
        """Build hierarchical thread structure."""
        message_dict = {msg.id: msg for msg in messages}
        threads = []
        
        for message in messages:
            if message.reply_to_id is None:
                # Top-level message
                message.replies = []
                threads.append(message)
            else:
                # Reply message
                parent = message_dict.get(message.reply_to_id)
                if parent:
                    if not hasattr(parent, 'replies'):
                        parent.replies = []
                    parent.replies.append(message)
        
        return threads
```

### Message Moderation

```python
# Message moderation utilities
class MessageModeration:
    @staticmethod
    def delete_message_cascade(message_id):
        """Delete message and all its replies."""
        try:
            message = ChatMessage.objects.get(id=message_id)
            
            # Delete all replies first
            replies = ChatMessage.objects.filter(reply_to=message)
            reply_count = replies.count()
            replies.delete()
            
            # Delete the message
            message.delete()
            
            return {
                'success': True,
                'deleted_replies': reply_count
            }
        except ChatMessage.DoesNotExist:
            return {'success': False, 'error': 'Message not found'}
    
    @staticmethod
    def get_moderation_stats():
        """Get statistics for moderation dashboard."""
        total_messages = ChatMessage.objects.count()
        total_users = User.objects.filter(
            chatmessage__isnull=False
        ).distinct().count()
        
        recent_messages = ChatMessage.objects.filter(
            timestamp__gte=timezone.now() - timezone.timedelta(days=7)
        ).count()
        
        return {
            'total_messages': total_messages,
            'total_users': total_users,
            'recent_messages': recent_messages,
            'messages_per_user': total_messages / max(total_users, 1)
        }
```

## Configuration

### Environment Variables

```env
# Guestbook Configuration
GUESTBOOK_PAGE=True  # Enable/disable guestbook

# Google OAuth (required when guestbook enabled)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth (required when guestbook enabled)
GH_CLIENT_ID="your-github-client-id"
GH_CLIENT_SECRET="your-github-client-secret"

# Optional Configuration
GUESTBOOK_MESSAGE_MAX_LENGTH=500
GUESTBOOK_MESSAGES_PER_PAGE=20
GUESTBOOK_ENABLE_THREADING=True
```

### Django Settings

```python
# Conditional guestbook configuration
GUESTBOOK_PAGE = os.getenv('GUESTBOOK_PAGE', 'True').lower() == 'true'

if GUESTBOOK_PAGE:
    # Add allauth apps
    INSTALLED_APPS += [
        'allauth',
        'allauth.account',
        'allauth.socialaccount',
        'allauth.socialaccount.providers.google',
        'allauth.socialaccount.providers.github',
    ]
    
    # Allauth configuration
    AUTHENTICATION_BACKENDS = [
        'django.contrib.auth.backends.ModelBackend',
        'allauth.account.auth_backends.AuthenticationBackend',
    ]
    
    # OAuth provider settings
    SOCIALACCOUNT_PROVIDERS = {
        'google': {
            'SCOPE': ['profile', 'email'],
            'AUTH_PARAMS': {'access_type': 'online'},
            'APP': {
                'client_id': os.getenv('GOOGLE_CLIENT_ID'),
                'secret': os.getenv('GOOGLE_CLIENT_SECRET'),
                'key': ''
            }
        },
        'github': {
            'SCOPE': ['user:email'],
            'APP': {
                'client_id': os.getenv('GH_CLIENT_ID'),
                'secret': os.getenv('GH_CLIENT_SECRET'),
                'key': ''
            }
        }
    }
    
    # Allauth settings
    ACCOUNT_EMAIL_VERIFICATION = 'none'
    SOCIALACCOUNT_EMAIL_VERIFICATION = 'none'
    LOGIN_REDIRECT_URL = '/guestbook/'
    LOGOUT_REDIRECT_URL = '/guestbook/'

# Guestbook-specific settings
GUESTBOOK_MESSAGE_MAX_LENGTH = int(os.getenv('GUESTBOOK_MESSAGE_MAX_LENGTH', 500))
GUESTBOOK_MESSAGES_PER_PAGE = int(os.getenv('GUESTBOOK_MESSAGES_PER_PAGE', 20))
```

### URL Configuration

```python
# FlexForge/urls.py - Conditional guestbook URLs
if getattr(settings, 'GUESTBOOK_PAGE', True):
    urlpatterns.insert(-1, path('guestbook/', include('apps.guestbook.urls')))

# apps/guestbook/urls.py
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.GuestbookView.as_view(), name='guestbook'),
    path('send/', views.SendMessageView.as_view(), name='send_message'),
    path('manage/', views.MessageManagementView.as_view(), name='manage_message'),
    path('accounts/', include('allauth.urls')),  # OAuth URLs
]
```

## OAuth Setup Instructions

### Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Go to APIs & Services → Library
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Your Portfolio Guestbook"

4. **Configure Authorized Redirect URIs**
   ```
   Development:
   http://localhost:8000/guestbook/accounts/google/login/callback/
   
   Production:
   https://your-domain.com/guestbook/accounts/google/login/callback/
   ```

5. **Copy Client ID and Secret**
   ```env
   GOOGLE_CLIENT_ID="your-google-client-id.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

### GitHub OAuth Setup

1. **Go to GitHub Settings**
   - Visit https://github.com/settings/developers
   - Click "New OAuth App"

2. **Configure OAuth App**
   - Application name: "Your Portfolio Guestbook"
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-domain.com/guestbook/accounts/github/login/callback/`

3. **Copy Client ID and Secret**
   ```env
   GH_CLIENT_ID="your-github-client-id"
   GH_CLIENT_SECRET="your-github-client-secret"
   ```

### Testing OAuth Configuration

```bash
# Test OAuth setup
python manage.py shell
>>> from allauth.socialaccount.models import SocialApp
>>> from django.contrib.sites.models import Site

# Check Google app
>>> google_app = SocialApp.objects.filter(provider='google').first()
>>> print(f"Google app configured: {bool(google_app)}")

# Check GitHub app
>>> github_app = SocialApp.objects.filter(provider='github').first()
>>> print(f"GitHub app configured: {bool(github_app)}")
```

## Templates and UI

### Main Guestbook Template

```html
<!-- guestbook/guestbook.html -->
{% extends 'base.html' %}
{% load static %}

{% block extra_head %}
<link rel="stylesheet" href="{% static 'guestbook/css/guestbook.css' %}">
{% endblock %}

{% block content %}
<div class="guestbook-container">
    <!-- Header -->
    <div class="guestbook-header">
        <h1>💬 Guestbook</h1>
        <p>Leave a message and connect with the community!</p>
    </div>
    
    <!-- Authentication Section -->
    {% if not is_authenticated %}
        <div class="auth-section">
            <p>Please sign in to leave a message:</p>
            <div class="auth-buttons">
                <a href="{% url 'google_oauth2_login' %}" class="btn btn-google">
                    <img src="{% static 'img/google-icon.svg' %}" alt="Google">
                    Sign in with Google
                </a>
                <a href="{% url 'github_login' %}" class="btn btn-github">
                    <img src="{% static 'img/github-icon.svg' %}" alt="GitHub">
                    Sign in with GitHub
                </a>
            </div>
        </div>
    {% else %}
        <!-- Message Input Section -->
        <div class="message-input-section">
            <div class="user-info">
                <img src="{{ user_profile.profile_image }}" alt="Profile" class="profile-image">
                <div class="user-details">
                    <span class="username">{{ user_profile.full_name }}</span>
                    {% if user_profile.is_author %}
                        <span class="badge author-badge">Author</span>
                    {% elif user_profile.is_co_author %}
                        <span class="badge co-author-badge">Co-Author</span>
                    {% endif %}
                </div>
                <a href="{% url 'account_logout' %}" class="logout-btn">Logout</a>
            </div>
            
            <div class="message-input-container">
                <textarea id="messageInput" 
                         placeholder="Share your thoughts..." 
                         maxlength="500"></textarea>
                <div class="input-footer">
                    <span class="char-counter">0/500</span>
                    <button id="sendButton" onclick="sendMessage()">Send Message</button>
                </div>
                <div id="replyIndicator" class="reply-indicator" style="display: none;">
                    Replying to <span id="replyToUsername"></span>
                    <button onclick="clearReply()">×</button>
                </div>
            </div>
        </div>
    {% endif %}
    
    <!-- Messages Section -->
    <div class="messages-section">
        <div id="messagesContainer" class="messages-container">
            {% for message in messages %}
                {% include 'guestbook/partials/message.html' with message=message %}
            {% endfor %}
        </div>
    </div>
</div>
{% endblock %}

{% block extra_scripts %}
<script src="{% static 'guestbook/js/guestbook.js' %}"></script>
{% endblock %}
```

### Message Component Template

```html
<!-- guestbook/partials/message.html -->
<div class="message" data-message-id="{{ message.id }}">
    <div class="message-avatar">
        <img src="{{ message.user_profile.profile_image }}" 
             alt="{{ message.user_profile.full_name }}">
    </div>
    
    <div class="message-content">
        <div class="message-header">
            <span class="message-author">{{ message.user_profile.full_name }}</span>
            {% if message.user_profile.is_author %}
                <span class="badge author-badge">Author</span>
            {% elif message.user_profile.is_co_author %}
                <span class="badge co-author-badge">Co-Author</span>
            {% endif %}
            <span class="message-timestamp">{{ message.timestamp|timesince }} ago</span>
        </div>
        
        {% if message.reply_to %}
            <div class="reply-context">
                Replying to {{ message.reply_to.user.get_full_name }}
            </div>
        {% endif %}
        
        <div class="message-text">{{ message.message }}</div>
        
        <div class="message-actions">
            <button onclick="replyToMessage({{ message.id }}, '{{ message.user_profile.full_name }}')" 
                    class="reply-btn">Reply</button>
            
            {% if user.is_authenticated %}
                {% if user == message.user or user_profile.is_author or user_profile.is_co_author %}
                    <button onclick="deleteMessage({{ message.id }})" 
                            class="delete-btn">Delete</button>
                {% endif %}
            {% endif %}
        </div>
    </div>
</div>
```

## Security Considerations

### Input Validation

```python
# Message validation
class MessageValidator:
    @staticmethod
    def validate_message(message_text):
        """Validate message content."""
        errors = []
        
        # Length validation
        if len(message_text) > 500:
            errors.append("Message too long (max 500 characters)")
        
        if not message_text.strip():
            errors.append("Message cannot be empty")
        
        # Content filtering (basic example)
        forbidden_words = ['spam', 'abuse']  # Expand as needed
        for word in forbidden_words:
            if word.lower() in message_text.lower():
                errors.append("Message contains inappropriate content")
                break
        
        return errors
    
    @staticmethod
    def sanitize_message(message_text):
        """Sanitize message content."""
        # Remove HTML tags
        import bleach
        cleaned_message = bleach.clean(message_text, tags=[], strip=True)
        
        # Limit line breaks
        lines = cleaned_message.split('\n')
        if len(lines) > 10:  # Max 10 lines
            cleaned_message = '\n'.join(lines[:10])
        
        return cleaned_message.strip()
```

### CSRF Protection

```javascript
// CSRF token handling
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Include CSRF token in AJAX requests
const csrftoken = getCookie('csrftoken');
fetch('/guestbook/send/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
    },
    body: JSON.stringify(data)
});
```

### Rate Limiting

```python
# Rate limiting for message sending
from django.core.cache import cache
from django.http import HttpResponseTooManyRequests

class RateLimitMixin:
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return super().dispatch(request, *args, **kwargs)
        
        # Check rate limit
        user_id = request.user.id
        cache_key = f'guestbook_rate_limit_{user_id}'
        
        current_count = cache.get(cache_key, 0)
        if current_count >= 5:  # Max 5 messages per minute
            return JsonResponse(
                {'error': 'Rate limit exceeded. Please wait before sending another message.'}, 
                status=429
            )
        
        # Increment counter
        cache.set(cache_key, current_count + 1, 60)  # 1 minute timeout
        
        return super().dispatch(request, *args, **kwargs)

# Apply to SendMessageView
class SendMessageView(LoginRequiredMixin, RateLimitMixin, View):
    # View implementation...
```

## Troubleshooting

### Common Issues

#### OAuth Login Not Working
**Problem**: OAuth login fails or redirects incorrectly
**Solution**:
1. Verify OAuth app configuration in provider settings
2. Check redirect URIs match exactly
3. Ensure client ID and secret are correct
4. Check that OAuth apps are created in Django admin

```bash
# Check OAuth configuration
python manage.py shell
>>> from allauth.socialaccount.models import SocialApp
>>> SocialApp.objects.all()
```

#### Messages Not Appearing
**Problem**: Sent messages don't appear in guestbook
**Solution**:
1. Check JavaScript console for errors
2. Verify CSRF token is included in requests
3. Check Django logs for server errors
4. Verify database migrations are applied

```bash
# Check messages in database
python manage.py shell
>>> from apps.guestbook.models import ChatMessage
>>> ChatMessage.objects.count()
>>> ChatMessage.objects.all()[:5]
```

#### Profile Images Not Loading
**Problem**: User profile images not displaying
**Solution**:
1. Check OAuth provider returns image URL
2. Verify image URLs are valid
3. Check for CORS issues with external images
4. Implement fallback for missing images

#### Permission Errors
**Problem**: Users can't perform actions they should be able to
**Solution**:
1. Verify user profile is created correctly
2. Check author/co-author flags in database
3. Ensure permission checking logic is correct
4. Check if user authentication is working

### Debug Commands

```bash
# Check guestbook configuration
python manage.py shell
>>> from django.conf import settings
>>> print(f"Guestbook enabled: {settings.GUESTBOOK_PAGE}")
>>> print(f"Google OAuth configured: {bool(settings.SOCIALACCOUNT_PROVIDERS.get('google'))}")

# Check user profiles
>>> from apps.guestbook.models import UserProfile
>>> profiles = UserProfile.objects.all()
>>> for p in profiles:
...     print(f"{p.user.username}: Author={p.is_author}, Co-Author={p.is_co_author}")

# Test message operations
>>> from apps.guestbook.models import ChatMessage
>>> from django.contrib.auth.models import User
>>> user = User.objects.first()
>>> message = ChatMessage.objects.create(user=user, message="Test message")
>>> print(f"Message created: {message.id}")
```

## Best Practices

### User Experience
1. **Clear authentication**: Make OAuth process obvious and trustworthy
2. **Responsive design**: Ensure mobile-friendly interface
3. **Loading states**: Show progress during message operations
4. **Error handling**: Provide clear error messages
5. **Keyboard shortcuts**: Support Enter key for sending messages

### Security
1. **Input validation**: Always validate and sanitize user input
2. **Rate limiting**: Prevent spam and abuse
3. **CSRF protection**: Use proper CSRF tokens
4. **XSS prevention**: Escape output and validate HTML
5. **Authentication verification**: Always verify user permissions

### Performance
1. **Database optimization**: Use select_related for user data
2. **Pagination**: Implement pagination for large message lists
3. **Caching**: Cache frequently accessed data
4. **Image optimization**: Optimize profile image loading
5. **AJAX efficiency**: Minimize unnecessary requests

### Content Management
1. **Message threading**: Organize conversations logically
2. **Moderation tools**: Provide easy moderation interface
3. **User roles**: Clear distinction between user types
4. **Message limits**: Reasonable character and rate limits
5. **Content policies**: Clear community guidelines

### Maintenance
1. **Regular cleanup**: Remove old or inappropriate messages
2. **User management**: Monitor author/co-author assignments
3. **Analytics**: Track usage patterns and engagement
4. **Backup strategy**: Regular database backups
5. **Performance monitoring**: Monitor response times and errors

The Guestbook app provides a rich, interactive messaging experience that enhances visitor engagement while maintaining security and providing powerful moderation capabilities for site owners.