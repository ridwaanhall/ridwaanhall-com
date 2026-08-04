"""
Guestbook template tags for rendering chat messages.
"""

from django import template
from django.template.defaultfilters import linebreaksbr
from django.utils.html import escape, format_html

register = template.Library()


@register.filter
def linkify_message(message):
    """
    Render a chat message as safe HTML.

    Usage:
    {{ message.message|linkify_message }}

    If the message starts with "https://", it's rendered as a clickable link;
    otherwise it's escaped and newlines are converted to <br> tags.
    """
    if not message:
        return ""

    stripped = message.strip()
    if stripped.lower().startswith("https://"):
        return format_html(
            '<a href="{0}" target="_blank" rel="noopener noreferrer nofollow" '
            'class="underline break-all hover:text-indigo-300">{0}</a>',
            stripped,
        )

    return linebreaksbr(escape(message))
