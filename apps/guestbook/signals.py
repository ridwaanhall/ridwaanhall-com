"""
Signal handlers for guestbook app.
Sends email notifications when new guestbook messages are posted.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from apps.guestbook.models import ChatMessage
from apps.core.email_handler import (
    send_guestbook_notification,
    send_guestbook_user_confirmation,
    send_guestbook_reply_notification,
)
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
        email = user.email or ''
        
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
        
        if instance.reply_to:
            # This is a reply to an existing message.
            # Determine if the replier is the site owner/author.
            is_author = getattr(getattr(user, 'userprofile', None), 'is_author', False)
            
            if is_author:
                # Site owner replied — notify the original message sender.
                original_user = instance.reply_to.user
                original_name = original_user.get_full_name() or original_user.username
                original_email = original_user.email or ''
                
                reply_data = {
                    'original_name': original_name,
                    'original_email': original_email,
                    'original_message': instance.reply_to.message,
                    'reply_name': name,
                    'reply_message': instance.message,
                    'timestamp': timestamp,
                    'guestbook_url': guestbook_url,
                }
                sent = send_guestbook_reply_notification(reply_data)
                if sent:
                    logger.info(f"Guestbook reply notification sent for message ID {instance.id} to {original_email}")
                else:
                    logger.warning(f"Failed to send guestbook reply notification for message ID {instance.id}")
            else:
                # Non-owner reply — notify the site owner.
                guestbook_data = {
                    'name': name,
                    'email': email or 'noreply@ridwaanhall.com',
                    'message': instance.message,
                    'timestamp': timestamp,
                    'guestbook_url': guestbook_url,
                }
                send_guestbook_notification(guestbook_data)
        else:
            # New top-level message — notify owner and confirm to the user.
            guestbook_data = {
                'name': name,
                'email': email or 'noreply@ridwaanhall.com',
                'message': instance.message,
                'timestamp': timestamp,
                'guestbook_url': guestbook_url,
            }
            
            # Send owner notification
            email_sent = send_guestbook_notification(guestbook_data)
            if email_sent:
                logger.info(f"Guestbook notification sent for message ID {instance.id} from {name}")
            else:
                logger.warning(f"Failed to send guestbook notification for message ID {instance.id}")
            
            # Send user confirmation (skip if the user is the site owner)
            if email:
                contact_recipient = getattr(settings, 'CONTACT_EMAIL_RECIPIENT', 'hi@ridwaanhall.com')
                if isinstance(contact_recipient, str):
                    owner_emails = [contact_recipient]
                else:
                    owner_emails = list(contact_recipient)
                
                if email not in owner_emails:
                    send_guestbook_user_confirmation(guestbook_data)
            
    except Exception as e:
        # Log error but don't raise exception to prevent message creation from failing
        logger.error(f"Error sending guestbook notification for message ID {instance.id}: {e}")
