"""Template loader and renderer for email templates.

Loads and renders HTML and text email templates from templates/core/email folder.
"""

import html
from pathlib import Path
from typing import Any


class EmailTemplateLoader:
    """Loads and renders email templates from files."""

    # Point to apps/core/templates/core/email
    BASE_PATH = Path(__file__).resolve().parent / "templates" / "core" / "email"

    @staticmethod
    def _escape_html(text: str) -> str:
        """Escape HTML special characters to prevent XSS attacks."""
        return html.escape(str(text))

    @staticmethod
    def _load_template(filename: str) -> str:
        """Load template content from file."""
        filepath = EmailTemplateLoader.BASE_PATH / filename
        with open(filepath, encoding="utf-8") as f:
            return f.read()

    @staticmethod
    def _render_template(template: str, context: dict[str, Any]) -> str:
        """Render template with context variables using simple string replacement."""
        result = template
        for key, value in context.items():
            placeholder = "{{ " + key + " }}"
            result = result.replace(placeholder, str(value))
        return result

    @staticmethod
    def _display_name(name: str) -> str:
        """Greeting name, falling back to a generic term when no name is provided."""
        return name or "there"

    @staticmethod
    def _name_display(name: str, sender_email: str) -> str:
        """Name to show for the sender, falling back to their email address."""
        return name if name else sender_email

    @staticmethod
    def _format_message_html(message_text: str) -> str:
        """Escape HTML then convert newlines to <br> tags for HTML email bodies."""
        return EmailTemplateLoader._escape_html(message_text).replace("\n", "<br>")

    @staticmethod
    def render_contact_notification_html(name: str, sender_email: str, message_text: str) -> str:
        """Render contact notification HTML email template."""
        template = EmailTemplateLoader._load_template("contact_notification.html")
        context = {
            "name": EmailTemplateLoader._escape_html(name),
            "sender_email": EmailTemplateLoader._escape_html(sender_email),
            "message_html": EmailTemplateLoader._format_message_html(message_text),
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
        display_name = EmailTemplateLoader._display_name(name)
        name_display = EmailTemplateLoader._name_display(name, sender_email)
        context = {
            "display_name": EmailTemplateLoader._escape_html(display_name),
            "name": EmailTemplateLoader._escape_html(name) if name else "",
            "name_display": EmailTemplateLoader._escape_html(name_display),
            "sender_email": EmailTemplateLoader._escape_html(sender_email),
            "message_html": EmailTemplateLoader._format_message_html(message_text),
        }
        return EmailTemplateLoader._render_template(template, context)

    @staticmethod
    def render_contact_autoreply_text(name: str, sender_email: str, message_text: str) -> str:
        """Render contact autoreply text email template."""
        template = EmailTemplateLoader._load_template("contact_autoreply.txt")
        context = {
            "display_name": EmailTemplateLoader._display_name(name),
            "name": name if name else "",
            "name_display": EmailTemplateLoader._name_display(name, sender_email),
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
        context = {
            "name": EmailTemplateLoader._escape_html(name),
            "sender_email": EmailTemplateLoader._escape_html(sender_email),
            "timestamp": EmailTemplateLoader._escape_html(timestamp),
            "message_html": EmailTemplateLoader._format_message_html(message_text),
            "guestbook_url": guestbook_url,  # URL should not be escaped
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

    @staticmethod
    def render_guestbook_autoreply_html(
        name: str, sender_email: str, message_text: str, timestamp: str, guestbook_url: str
    ) -> str:
        """Render guestbook autoreply HTML email template."""
        template = EmailTemplateLoader._load_template("guestbook_autoreply.html")
        display_name = EmailTemplateLoader._display_name(name)
        name_display = EmailTemplateLoader._name_display(name, sender_email)
        context = {
            "display_name": EmailTemplateLoader._escape_html(display_name),
            "name_display": EmailTemplateLoader._escape_html(name_display),
            "sender_email": EmailTemplateLoader._escape_html(sender_email),
            "message_html": EmailTemplateLoader._format_message_html(message_text),
            "timestamp": EmailTemplateLoader._escape_html(timestamp),
            "guestbook_url": guestbook_url,  # URL should not be escaped
        }
        return EmailTemplateLoader._render_template(template, context)

    @staticmethod
    def render_guestbook_autoreply_text(
        name: str, sender_email: str, message_text: str, timestamp: str, guestbook_url: str
    ) -> str:
        """Render guestbook autoreply text email template."""
        template = EmailTemplateLoader._load_template("guestbook_autoreply.txt")
        context = {
            "display_name": EmailTemplateLoader._display_name(name),
            "name_display": EmailTemplateLoader._name_display(name, sender_email),
            "sender_email": sender_email,
            "message_text": message_text,
            "timestamp": timestamp,
            "guestbook_url": guestbook_url,
        }
        return EmailTemplateLoader._render_template(template, context)

    @staticmethod
    def render_guestbook_reply_notification_html(
        original_name: str, reply_name: str, reply_message: str,
        original_message: str, timestamp: str, guestbook_url: str
    ) -> str:
        """Render guestbook reply notification HTML email template."""
        template = EmailTemplateLoader._load_template("guestbook_reply_notification.html")
        context = {
            "original_name": EmailTemplateLoader._escape_html(EmailTemplateLoader._display_name(original_name)),
            "reply_name": EmailTemplateLoader._escape_html(reply_name),
            "reply_message_html": EmailTemplateLoader._format_message_html(reply_message),
            "original_message_html": EmailTemplateLoader._format_message_html(original_message),
            "timestamp": EmailTemplateLoader._escape_html(timestamp),
            "guestbook_url": guestbook_url,  # URL should not be escaped
        }
        return EmailTemplateLoader._render_template(template, context)

    @staticmethod
    def render_guestbook_reply_notification_text(
        original_name: str, reply_name: str, reply_message: str,
        original_message: str, timestamp: str, guestbook_url: str
    ) -> str:
        """Render guestbook reply notification text email template."""
        template = EmailTemplateLoader._load_template("guestbook_reply_notification.txt")
        context = {
            "original_name": EmailTemplateLoader._display_name(original_name),
            "reply_name": reply_name,
            "reply_message_text": reply_message,
            "original_message_text": original_message,
            "timestamp": timestamp,
            "guestbook_url": guestbook_url,
        }
        return EmailTemplateLoader._render_template(template, context)
