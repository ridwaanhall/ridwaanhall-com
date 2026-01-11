"""
Email handler for contact form submissions.
Handles email composition and delivery with professional HTML formatting.
"""

from django.core.mail import EmailMultiAlternatives
from typing import Dict
from .email_templates import generate_html_email, generate_text_email
from django.conf import settings


def send_contact_email(contact_data: Dict[str, str]) -> bool:
    """
    Send a professional contact form email.
    
    Args:
        contact_data: Dictionary containing 'full_name', 'email', and 'message'
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    full_name = contact_data.get('full_name', '')
    sender_email = contact_data.get('email', '')
    message_text = contact_data.get('message', '')
    
    # Prepare email subject
    subject = f'RoneAI: Inquiry from {full_name}'
    
    # Generate HTML email content
    html_content = generate_html_email(full_name, sender_email, message_text)
    
    # Generate plain text content
    text_content = generate_text_email(full_name, sender_email, message_text)
    
    try:
        # Create email message
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.EMAIL_HOST_USER],
            reply_to=[sender_email],  # Reply goes directly to sender
        )
        
        # Attach HTML version
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        email.send(fail_silently=False)
        return True
        
    except Exception as e:
        print(f"Email sending error: {e}")
        return False