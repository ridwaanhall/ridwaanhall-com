"""Dump the Django manager output as JSON, for comparison against the Next.js
data layer.

Run from the repo root with the production database configured:

    DEBUG=False uv run python web/scripts/django_dump.py

It writes web/scripts/.django.json itself rather than printing, because the
content contains emoji and Windows' console codec (cp1252) cannot encode them.

Datetimes are normalised to UTC ISO-8601 with a trailing "Z" and milliseconds,
matching what `JSON.stringify` produces for a JS `Date`, so the two sides are
comparable without a second normalisation pass.
"""

import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "FlexForge.settings")

import django  # noqa: E402

django.setup()

from apps.about.manager import AboutManager  # noqa: E402
from apps.core.content_manager import ContentManager  # noqa: E402
from apps.legal.manager import LegalManager  # noqa: E402
from apps.openhire.manager import OpenHireManager  # noqa: E402


class Encoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime.datetime):
            if o.tzinfo is None:
                o = o.replace(tzinfo=datetime.UTC)
            o = o.astimezone(datetime.UTC)
            return o.strftime("%Y-%m-%dT%H:%M:%S.") + f"{o.microsecond // 1000:03d}Z"
        if isinstance(o, datetime.date):
            return o.isoformat()
        return super().default(o)


payload = {
    "about": AboutManager.get_about_data(),
    "experiences": AboutManager.get_experiences(),
    "experiences_current": AboutManager.get_experiences(current_only=True),
    "education": AboutManager.get_education(),
    "education_last": AboutManager.get_education(last_only=True),
    "certifications": AboutManager.get_certifications(),
    "skills": AboutManager.get_skills(),
    "skills_by_category": AboutManager.get_skills_by_category(),
    "awards": AboutManager.get_awards(),
    "applications": AboutManager.get_applications(),
    "blogs": ContentManager.get_blogs(),
    "projects": ContentManager.get_projects(),
    "hiring": OpenHireManager.get_hiring_data(),
    "open_to_work": OpenHireManager.get_open_to_work_data(),
    "legal_documents": LegalManager.get_documents(),
}

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".django.json")
with open(out, "w", encoding="utf-8", newline="\n") as fh:
    json.dump(payload, fh, cls=Encoder, ensure_ascii=False)

print(f"wrote {out}")
for key, value in payload.items():
    print(f"  {len(value) if isinstance(value, list) else ('object' if value else 'null'):>6}  {key}")
