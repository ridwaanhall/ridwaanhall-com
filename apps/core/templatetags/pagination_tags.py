"""Pagination link helpers."""

from urllib.parse import urlencode

from django import template

register = template.Library()


@register.simple_tag(takes_context=True)
def page_url(context, page, search_query=""):
    """Build a pagination href, omitting ``page=1``.

    ``/projects/`` and ``/projects/?page=1`` serve identical content, so linking
    to the second creates a duplicate URL for crawlers to find. Google reported
    both ``/projects/?page=1`` and ``/blog/?page=1`` under "Duplicate, Google
    chose different canonical" for exactly this reason -- it found the query
    form, then had to decide it was really the bare one.

    Page 2 and beyond keep their parameter and self-canonicalise, which is what
    Google asks for on paginated series.
    """
    request = context["request"]

    params = {}
    if search_query:
        params["q"] = search_query
    try:
        number = int(page)
    except (TypeError, ValueError):
        number = 1
    if number > 1:
        params["page"] = number

    query = urlencode(params)
    return f"{request.path}?{query}" if query else request.path
