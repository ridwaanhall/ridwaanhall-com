"""
Signal handlers for guestbook app.
Sends email notifications when new guestbook messages are posted.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from apps.guestbook.models import ChatMessage
from apps.core.email_handler import send_guestbook_notification
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ChatMessage)
def send_guestbook_email_notification(sender, instance, created, **kwargs):
    """
    Send email notification when a new guestbook message is created.
    
    Args:
        sender: The model class (ChatMessage)
        instance: The actual ChatMessage instance that was saved
        created: Boolean indicating if this is a new record
        **kwargs: Additional keyword arguments
    """
    # Only send notification for new messages, not updates
    if not created:
        return
    
    try:
        # Get user profile data
        user = instance.user
        name = user.get_full_name() or user.username
        # Use a more descriptive fallback for missing email
        email = user.email or 'noreply@ridwaanhall.com'
        
        # Get guestbook URL
        base_url = getattr(settings, 'BASE_URL', 'https://ridwaanhall.com')
        guestbook_url = f"{base_url}/guestbook/"
        
        # Format timestamp in a readable way with timezone-aware formatting
        # Use strftime without %Z to avoid empty string issues
        timestamp = instance.timestamp.strftime('%B %d, %Y at %H:%M:%S')
        # Add timezone name manually if available
        tz_name = instance.timestamp.tzname()
        if tz_name:
            timestamp = f"{timestamp} {tz_name}"
        
        # Prepare data for email
        guestbook_data = {
            'name': name,
            'email': email,
            'message': instance.message,
            'timestamp': timestamp,
            'guestbook_url': guestbook_url,
        }
        
        # Send email notification
        email_sent = send_guestbook_notification(guestbook_data)
        
        if email_sent:
            logger.info(f"Guestbook notification sent for message ID {instance.id} from {name}")
        else:
            logger.warning(f"Failed to send guestbook notification for message ID {instance.id}")
            
    except Exception as e:
        # Log error but don't raise exception to prevent message creation from failing
        logger.error(f"Error sending guestbook notification for message ID {instance.id}: {e}")
