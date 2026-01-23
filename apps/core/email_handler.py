"""
Email handler for contact form submissions.
Handles email composition and delivery with professional HTML formatting.
"""

from django.core.mail import EmailMultiAlternatives
from typing import Dict
from .email_templates import (
    generate_html_email,
    generate_text_email,
    generate_contact_autoreply_html,
    generate_contact_autoreply_text,
    generate_guestbook_html_email,
    generate_guestbook_text_email,
)
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_contact_email(contact_data: Dict[str, str]) -> bool:
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
    html_content = generate_html_email(name, sender_email, message_text)
    
    # Generate plain text content for site owner
    text_content = generate_text_email(name, sender_email, message_text)
    
    try:
        # Determine recipient(s) from settings, with a safe fallback
        contact_recipient = getattr(settings, 'CONTACT_EMAIL_RECIPIENT', 'hi@ridwaanhall.com')
        if isinstance(contact_recipient, str):
            to_recipients = [contact_recipient]
        else:
            to_recipients = list(contact_recipient)

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
                auto_html = generate_contact_autoreply_html(name, sender_email, message_text)
                auto_text = generate_contact_autoreply_text(name, sender_email, message_text)

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


def send_guestbook_notification(guestbook_data: Dict[str, str]) -> bool:
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
    subject = f'New Guestbook Message from {name}'
    
    # Generate HTML email content
    html_content = generate_guestbook_html_email(name, sender_email, message_text, timestamp, guestbook_url)
    
    # Generate plain text content
    text_content = generate_guestbook_text_email(name, sender_email, message_text, timestamp, guestbook_url)
    
    try:
        # Determine recipient(s) from settings, with a safe fallback
        contact_recipient = getattr(settings, 'CONTACT_EMAIL_RECIPIENT', 'hi@ridwaanhall.com')
        if isinstance(contact_recipient, str):
            to_recipients = [contact_recipient]
        else:
            to_recipients = list(contact_recipient)

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