"""
Email handler for contact form submissions.
Handles email composition and delivery with professional HTML formatting.
"""

from django.core.mail import EmailMultiAlternatives
from .email_templates import EmailTemplateLoader
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def _get_owner_emails() -> list:
    """Return the configured contact recipient email(s) as a list."""
    contact_recipient = getattr(settings, 'CONTACT_EMAIL_RECIPIENT', 'hi@ridwaanhall.com')
    if isinstance(contact_recipient, str):
        return [contact_recipient]
    return list(contact_recipient)


def send_contact_email(contact_data: dict[str, str]) -> bool:
    """
    Send a professional contact form email.
    
    Args:
        contact_data: Dictionary containing 'name', 'email', and 'message'
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    name = contact_data.get('name', '')
    sender_email = contact_data.get('email', '')
    message_text = contact_data.get('message', '')
    
    # Prepare email subject
    subject = f'New Contact Form Message from {name}'
    
    # Generate HTML email content for site owner
    html_content = EmailTemplateLoader.render_contact_notification_html(
        name, sender_email, message_text
    )

    # Generate plain text content for site owner
    text_content = EmailTemplateLoader.render_contact_notification_text(
        name, sender_email, message_text
    )
    
    try:
        # Determine recipient(s) from settings, with a safe fallback
        to_recipients = _get_owner_emails()

        # Create email message to site owner
        # FROM: DEFAULT_FROM_EMAIL
        # TO: configurable contact recipient(s)
        # REPLY-TO: user's email from the form
        owner_email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=to_recipients,
            reply_to=[sender_email],  # Reply goes directly to sender
        )

        # Attach HTML version
        owner_email.attach_alternative(html_content, "text/html")

        # Send owner notification email
        owner_email.send(fail_silently=False)

        # Send confirmation email to visitor (best-effort, don't fail contact flow on error)
        try:
            if sender_email:
                auto_subject = "Thanks for contacting Ridwan Halim"
                auto_html = EmailTemplateLoader.render_contact_autoreply_html(
                    name, sender_email, message_text
                )
                auto_text = EmailTemplateLoader.render_contact_autoreply_text(
                    name, sender_email, message_text
                )

                auto_reply = EmailMultiAlternatives(
                    subject=auto_subject,
                    body=auto_text,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[sender_email],
                    # When visitor replies, message goes to contact recipient(s)
                    reply_to=to_recipients,
                )
                auto_reply.attach_alternative(auto_html, "text/html")
                auto_reply.send(fail_silently=False)
        except Exception as auto_err:
            logger.error(f"Contact auto-reply email error: {auto_err}")

        return True
        
    except Exception as e:
        logger.error(f"Email sending error: {e}")
        return False


def send_guestbook_notification(guestbook_data: dict[str, str]) -> bool:
    """
    Send notification email when a new guestbook message is posted.
    
    Args:
        guestbook_data: Dictionary containing 'name', 'email', 'message', 'timestamp', and 'guestbook_url'
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    name = guestbook_data.get('name', '')
    sender_email = guestbook_data.get('email', '')
    message_text = guestbook_data.get('message', '')
    timestamp = guestbook_data.get('timestamp', '')
    guestbook_url = guestbook_data.get('guestbook_url', '')
    
    # Prepare email subject
    subject = f"New Guestbook Message from {name}"

    # Generate HTML email content
    html_content = EmailTemplateLoader.render_guestbook_notification_html(
        name, sender_email, message_text, timestamp, guestbook_url
    )

    # Generate plain text content
    text_content = EmailTemplateLoader.render_guestbook_notification_text(
        name, sender_email, message_text, timestamp, guestbook_url
    )
    
    try:
        # Determine recipient(s) from settings, with a safe fallback
        to_recipients = _get_owner_emails()

        # Create email message
        # FROM: notify@rone.dev (site's notification email)
        # TO: site owner's email (same as FROM for notifications)
        # NO REPLY-TO: This is a notification, not a message to reply to directly
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=to_recipients,
        )
        
        # Attach HTML version
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        email.send(fail_silently=False)
        logger.info(f"Guestbook notification sent for message from {name}")
        return True
        
    except Exception as e:
        logger.error(f"Guestbook notification email error: {e}")
        return False


def send_guestbook_user_confirmation(guestbook_data: dict[str, str]) -> bool:
    """
    Send confirmation email to the user who posted a new guestbook message.

    Args:
        guestbook_data: Dictionary containing 'name', 'email', 'message', 'timestamp', and 'guestbook_url'

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    name = guestbook_data.get('name', '')
    sender_email = guestbook_data.get('email', '')
    message_text = guestbook_data.get('message', '')
    timestamp = guestbook_data.get('timestamp', '')
    guestbook_url = guestbook_data.get('guestbook_url', '')

    if not sender_email:
        return False

    subject = "Your message has been sent."

    html_content = EmailTemplateLoader.render_guestbook_autoreply_html(
        name, sender_email, message_text, timestamp, guestbook_url
    )
    text_content = EmailTemplateLoader.render_guestbook_autoreply_text(
        name, sender_email, message_text, timestamp, guestbook_url
    )

    try:
        owner_emails = _get_owner_emails()

        confirmation = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[sender_email],
            reply_to=owner_emails,
        )
        confirmation.attach_alternative(html_content, "text/html")
        confirmation.send(fail_silently=False)
        logger.info(f"Guestbook user confirmation sent to {sender_email}")
        return True

    except Exception as e:
        logger.error(f"Guestbook user confirmation email error: {e}")
        return False


def send_guestbook_reply_notification(reply_data: dict[str, str]) -> bool:
    """
    Send notification email to the original poster when the site owner replies.

    Args:
        reply_data: Dictionary containing 'original_name', 'original_email', 'original_message',
                    'reply_name', 'reply_message', 'timestamp', and 'guestbook_url'

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    original_name = reply_data.get('original_name', '')
    original_email = reply_data.get('original_email', '')
    original_message = reply_data.get('original_message', '')
    reply_name = reply_data.get('reply_name', '')
    reply_message = reply_data.get('reply_message', '')
    timestamp = reply_data.get('timestamp', '')
    guestbook_url = reply_data.get('guestbook_url', '')

    if not original_email:
        return False

    subject = "You have received a reply."

    html_content = EmailTemplateLoader.render_guestbook_reply_notification_html(
        original_name, reply_name, reply_message, original_message, timestamp, guestbook_url
    )
    text_content = EmailTemplateLoader.render_guestbook_reply_notification_text(
        original_name, reply_name, reply_message, original_message, timestamp, guestbook_url
    )

    try:
        owner_emails = _get_owner_emails()

        notification = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[original_email],
            reply_to=owner_emails,
        )
        notification.attach_alternative(html_content, "text/html")
        notification.send(fail_silently=False)
        logger.info(f"Guestbook reply notification sent to {original_email}")
        return True

    except Exception as e:
        logger.error(f"Guestbook reply notification email error: {e}")
        return False