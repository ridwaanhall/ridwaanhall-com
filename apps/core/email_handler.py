"""
Email handler for contact form submissions.
Handles email composition and delivery with professional HTML formatting.
"""

from django.core.mail import EmailMultiAlternatives
from typing import Dict
from .email_templates import generate_html_email, generate_text_email
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
    
    # Generate HTML email content
    html_content = generate_html_email(name, sender_email, message_text)
    
    # Generate plain text content
    text_content = generate_text_email(name, sender_email, message_text)
    
    try:
        # Determine recipient(s) from settings, with a safe fallback
        contact_recipient = getattr(settings, 'CONTACT_EMAIL_RECIPIENT', 'hi@ridwaanhall.com')
        if isinstance(contact_recipient, str):
            to_recipients = [contact_recipient]
        else:
            to_recipients = list(contact_recipient)

        # Create email message
        # FROM: notify@rone.dev (alias of notif.rone@gmail.com)
        # TO: configurable contact recipient(s)
        # REPLY-TO: user's email from the form
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=to_recipients,
            reply_to=[sender_email],  # Reply goes directly to sender
        )
        
        # Attach HTML version
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        email.send(fail_silently=False)
        return True
        
    except Exception as e:
        logger.error(f"Email sending error: {e}")
        return False