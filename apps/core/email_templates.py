"""Template loader and renderer for email templates.

Loads and renders HTML and text email templates from templates/core/email folder.
"""

from pathlib import Path
from typing import Dict, Any


class EmailTemplateLoader:
    """Loads and renders email templates from files."""

    # Point to apps/core/templates/core/email
    BASE_PATH = Path(__file__).resolve().parent / "templates" / "core" / "email"

    @staticmethod
    def _load_template(filename: str) -> str:
        """Load template content from file."""
        filepath = EmailTemplateLoader.BASE_PATH / filename
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()

    @staticmethod
    def _render_template(template: str, context: Dict[str, Any]) -> str:
        """Render template with context variables using simple string replacement."""
        result = template
        for key, value in context.items():
            placeholder = "{{ " + key + " }}"
            result = result.replace(placeholder, str(value))
        return result

    @staticmethod
    def render_contact_notification_html(name: str, sender_email: str, message_text: str) -> str:
        """Render contact notification HTML email template."""
        template = EmailTemplateLoader._load_template("contact_notification.html")
        formatted_message = message_text.replace("\n", "<br>")
        context = {
            "name": name,
            "sender_email": sender_email,
            "message_html": formatted_message,
        }
        return EmailTemplateLoader._render_template(template, context)

    @staticmethod
    def render_contact_notification_text(name: str, sender_email: str, message_text: str) -> str:
        """Render contact notification text email template."""
        template = EmailTemplateLoader._load_template("contact_notification.txt")
        context = {
            "name": name,
            "sender_email": sender_email,
            "message_text": message_text,
        }
        return EmailTemplateLoader._render_template(template, context)

    @staticmethod
    def render_contact_autoreply_html(name: str, sender_email: str, message_text: str) -> str:
        """Render contact autoreply HTML email template."""
        template = EmailTemplateLoader._load_template("contact_autoreply.html")
        display_name = name or "there"
        name_display = name if name else sender_email
        formatted_message = message_text.replace("\n", "<br>")
        context = {
            "display_name": display_name,
            "name": name if name else "",
            "name_display": name_display,
            "sender_email": sender_email,
            "message_html": formatted_message,
        }
        return EmailTemplateLoader._render_template(template, context)

    @staticmethod
    def render_contact_autoreply_text(name: str, sender_email: str, message_text: str) -> str:
        """Render contact autoreply text email template."""
        template = EmailTemplateLoader._load_template("contact_autoreply.txt")
        display_name = name or "there"
        name_display = name if name else sender_email
        context = {
            "display_name": display_name,
            "name": name if name else "",
            "name_display": name_display,
            "sender_email": sender_email,
            "message_text": message_text,
        }
        return EmailTemplateLoader._render_template(template, context)

    @staticmethod
    def render_guestbook_notification_html(
        name: str, sender_email: str, message_text: str, timestamp: str, guestbook_url: str
    ) -> str:
        """Render guestbook notification HTML email template."""
        template = EmailTemplateLoader._load_template("guestbook_notification.html")
        formatted_message = message_text.replace("\n", "<br>")
        context = {
            "name": name,
            "sender_email": sender_email,
            "timestamp": timestamp,
            "message_html": formatted_message,
            "guestbook_url": guestbook_url,
        }
        return EmailTemplateLoader._render_template(template, context)

    @staticmethod
    def render_guestbook_notification_text(
        name: str, sender_email: str, message_text: str, timestamp: str, guestbook_url: str
    ) -> str:
        """Render guestbook notification text email template."""
        template = EmailTemplateLoader._load_template("guestbook_notification.txt")
        context = {
            "name": name,
            "sender_email": sender_email,
            "timestamp": timestamp,
            "message_text": message_text,
            "guestbook_url": guestbook_url,
        }
        return EmailTemplateLoader._render_template(template, context)
