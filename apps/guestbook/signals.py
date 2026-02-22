"""
Signal handlers for guestbook app.
Sends email notifications when new guestbook messages are posted.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from apps.guestbook.models import ChatMessage
from apps.core.email_handler import (
    _get_owner_emails,
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

    Dispatch rules (applied to every new message, whether top-level or reply):
      1. Notify CONTACT_EMAIL_RECIPIENT   — unless the sender's email IS the owner.
      2. Confirm to the sender             — unless the sender's email IS the owner.
      3. If the message is a reply, notify the original poster (reply notification).

    Args:
        sender: The model class (ChatMessage)
        instance: The actual ChatMessage instance that was saved
        created: Boolean indicating if this is a new record
        **kwargs: Additional keyword arguments
    """
    if not created:
        return

    try:
        user = instance.user
        name = user.get_full_name() or user.username
        email = user.email or ''

        base_url = getattr(settings, 'BASE_URL', 'https://ridwaanhall.com')
        guestbook_url = f"{base_url}/guestbook/"

        timestamp = instance.timestamp.strftime('%B %d, %Y at %H:%M:%S')
        tz_name = instance.timestamp.tzname()
        if tz_name:
            timestamp = f"{timestamp} {tz_name}"

        owner_emails = _get_owner_emails()
        is_owner = email in owner_emails

        guestbook_data = {
            'name': name,
            'email': email or 'noreply@ridwaanhall.com',
            'message': instance.message,
            'timestamp': timestamp,
            'guestbook_url': guestbook_url,
        }

        if not is_owner:
            email_sent = send_guestbook_notification(guestbook_data)
            if email_sent:
                logger.info(f"Guestbook notification sent for message ID {instance.id} from {name}")
            else:
                logger.warning(f"Failed to send guestbook notification for message ID {instance.id}")

        if email and not is_owner:
            sent = send_guestbook_user_confirmation(guestbook_data)
            if sent:
                logger.info(f"Guestbook user confirmation sent for message ID {instance.id} to {email}")
            else:
                logger.warning(f"Failed to send guestbook user confirmation for message ID {instance.id}")

        if instance.reply_to:
            original_user = instance.reply_to.user
            original_name = original_user.get_full_name() or original_user.username
            original_email = original_user.email or ''

            if original_email and original_email != email:
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

    except Exception as e:
        # Log error but don't raise exception to prevent message creation from failing
        logger.error(f"Error sending guestbook notification for message ID {instance.id}: {e}")
