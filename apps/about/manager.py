"""
About Manager - Central controller for about-related data.
ORM-backed (previously read from apps/about/data/*.py IFS files) -- builds
the same plain dict/list shapes the old dataclass-based data files produced,
so templates, apps/seo/schema.py, and apps/openhire/views.py need no changes.
"""

from datetime import UTC, datetime
from zoneinfo import ZoneInfo

from apps.core import cache as content_cache

# Category display order for consistent rendering (moved from the old
# apps/about/data/skills_data.py::SkillsData.CATEGORY_ORDER).
SKILL_CATEGORY_ORDER = [
    "Languages", "Backend Frameworks", "Frontend Frameworks", "Styling & UI",
    "CMS & E-commerce", "Data Visualization", "Utilities & Auth", "Data Apps",
    "Automation & Scraping", "ML Frameworks", "ML Algorithms", "LLMs & AI Services",
    "Data Science", "Databases & ORM", "APIs & Services", "Cloud & DevOps",
    "Package Management", "PaaS", "Serverless", "Web Server", "Testing",
    "Version Control", "Editor & IDE", "Design", "Desktop",
]


def _image_url(field) -> str:
    return field.url if field else ""


MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _month_year(value) -> dict | None:
    """A stored date as the {"month": "Jan", "year": 2024} pair templates expect.

    The columns are real dates now, but the rendered output is unchanged: the
    templates and the about dict have always spoken in month/year, and only the
    storage was wrong. Keeping the shape here is what let this change stay
    inside the model and manager layers.
    """
    if value is None:
        return None
    return {"month": MONTHS[value.month - 1], "year": value.year}


def _iso_month(value) -> str:
    """ISO 8601 year-month, for schema.org date properties."""
    return value.strftime("%Y-%m") if value else ""


def _skill_dict(s) -> dict:
    return {"name": s.name, "description": s.description, "icon_svg": s.icon_svg, "category": s.category}


class AboutManager:
    """Central about data manager, backed by the ORM."""

    @staticmethod
    def is_working_hours() -> bool:
        jakarta_tz = ZoneInfo("Asia/Jakarta")
        now = datetime.now(jakarta_tz)
        return now.weekday() < 5 and 15 <= now.hour < 20

    @classmethod
    def get_about_data(cls):
        """Get about data with flattened structure for backward compatibility.

        ``is_active`` is deliberately recomputed on every read rather than
        served from the cache -- it is derived from the current Jakarta time,
        so a cached copy would freeze the working-hours indicator.
        """
        data = content_cache.get_or_build("about_data", cls._build_about_data)
        if data is None:
            return None
        return {**data, "is_active": cls.is_working_hours()}

    @classmethod
    def _build_about_data(cls):
        from apps.about.models import Profile

        profile = Profile.objects.prefetch_related(
            "donate_links", "skill_highlights__skill"
        ).first()
        if not profile:
            return None

        return {
            # Personal fields (flattened to root level, as the old manager did)
            "name": profile.name, "first_name": profile.first_name, "last_name": profile.last_name,
            "username": profile.username, "aka": profile.aka,
            "image_url": _image_url(profile.image), "personal_website": profile.personal_website,
            "cv": {"main": profile.cv_main, "latest": profile.cv_latest, "copy": profile.cv_copy},
            "role": profile.role, "is_active": cls.is_working_hours(),
            "is_open_to_work": profile.is_open_to_work, "is_hiring": profile.is_hiring,
            "is_sick": profile.is_sick,
            # Bio fields (flattened to root level)
            "short_description": profile.short_description, "short_bio": profile.short_bio,
            "short_cta": profile.short_cta, "long_description": profile.long_description,
            # Kept as nested structures
            "stories": profile.stories,
            "location": {
                "regency": profile.location_regency, "residency": profile.location_residency,
                "province": profile.location_province, "prov": profile.location_prov,
                "country": profile.location_country, "flag": profile.location_flag,
            },
            "social_media": {
                "email": profile.social_email, "github": profile.social_github,
                "linkedin": profile.social_linkedin, "follow_linkedin": profile.social_follow_linkedin,
                "instagram": profile.social_instagram, "medium": profile.social_medium,
                "x": profile.social_x, "website": profile.social_website,
            },
            "donate": [{"platform": d.platform, "url": d.url} for d in profile.donate_links.all()],
            # Read through the ordered join rows, not the bare M2M, so the
            # editorial order is preserved. Kept as a plain list[str] so
            # apps/seo/schema.py's `knowsAbout` is unchanged in shape.
            # Iterating .all() reuses the prefetch above; values_list()
            # here would issue a second query.
            "skills": [link.skill.name for link in profile.skill_highlights.all()],
        }

    @classmethod
    def get_experiences(cls, current_only=False):
        """Get experience data with optional filtering for current positions."""
        return content_cache.get_or_build(
            "experiences",
            lambda: cls._build_experiences(current_only),
            params=f"current_only={current_only}",
        )

    @classmethod
    def _build_experiences(cls, current_only=False):
        from apps.about.models import Experience

        qs = Experience.objects.all()
        if current_only:
            qs = qs.filter(is_current=True)

        result = []
        for e in qs:
            # A role with no end date is one you are still in.
            end = _month_year(e.period_end) or "Present"
            result.append({
                "id": e.id, "title": e.title, "company": e.company, "logo": _image_url(e.logo),
                "period": {
                    "start": _month_year(e.period_start), "end": end,
                    # ISO forms for JSON-LD, which needs 8601 rather than "Jan 2024".
                    "start_iso": _iso_month(e.period_start), "end_iso": _iso_month(e.period_end),
                },
                "employment_type": e.employment_type, "location_type": e.location_type,
                "location": e.location, "is_current": e.is_current,
                "responsibilities": e.responsibilities, "website": e.website,
            })
        return result

    @classmethod
    def get_education(cls, last_only=False):
        """Get education data with optional filtering for most recent."""
        return content_cache.get_or_build(
            "education",
            lambda: cls._build_education(last_only),
            params=f"last_only={last_only}",
        )

    @classmethod
    def _build_education(cls, last_only=False):
        from apps.about.models import Education

        qs = Education.objects.all()
        if last_only:
            qs = qs.filter(is_last=True)

        result = []
        for edu in qs:
            date = None
            if edu.date_start:
                date = {
                    "start": _month_year(edu.date_start),
                    "end": _month_year(edu.date_end),
                }
            result.append({
                "degree": edu.degree, "institution": edu.institution, "logo": _image_url(edu.logo),
                "is_last": edu.is_last,
                "location": {
                    "regency": edu.location_regency, "province": edu.location_province,
                    "prov": edu.location_prov, "country": edu.location_country,
                    "flag": edu.location_flag, "map_url": edu.location_map_url,
                },
                "achievements": edu.achievements, "alias": edu.alias, "date": date,
                "years": edu.years, "website": edu.website,
            })
        return result

    @classmethod
    def get_certifications(cls):
        """Get certification data."""
        return content_cache.get_or_build("certifications", cls._build_certifications)

    @classmethod
    def _build_certifications(cls):
        from apps.about.models import Certification

        return [
            {
                "id": c.id, "title": c.title, "credential_url": c.credential_url,
                "issued": _month_year(c.issued), "issued_iso": _iso_month(c.issued),
                "institution": c.institution, "website": c.website, "logo": _image_url(c.logo),
                "is_featured": c.is_featured, "achievements": c.achievements,
            }
            for c in Certification.objects.all()
        ]

    @classmethod
    def get_skills(cls):
        """Get skills data - only returns skills with a valid icon_svg."""
        return content_cache.get_or_build("skills", cls._build_skills)

    @classmethod
    def _build_skills(cls):
        from apps.about.models import Skill

        return [_skill_dict(s) for s in Skill.objects.exclude(icon_svg="").order_by("id")]

    @classmethod
    def get_skills_by_category(cls) -> dict[str, list[dict]]:
        """Group all skills by category, ordered by SKILL_CATEGORY_ORDER."""
        return content_cache.get_or_build("skills_by_category", cls._build_skills_by_category)

    @classmethod
    def _build_skills_by_category(cls) -> dict[str, list[dict]]:
        from apps.about.models import Skill

        grouped: dict[str, list[dict]] = {}
        for s in Skill.objects.order_by("id"):
            if s.category:
                grouped.setdefault(s.category, []).append(_skill_dict(s))

        ordered: dict[str, list[dict]] = {}
        for cat in SKILL_CATEGORY_ORDER:
            if cat in grouped:
                ordered[cat] = grouped.pop(cat)
        for cat, skills in grouped.items():
            ordered[cat] = skills
        return ordered

    @classmethod
    def get_awards(cls, sort_by_id=True):
        """Get awards data with optional sorting."""
        return content_cache.get_or_build(
            "awards",
            lambda: cls._build_awards(sort_by_id),
            params=f"sort_by_id={sort_by_id}",
        )

    @classmethod
    def _build_awards(cls, sort_by_id=True):
        from apps.about.models import Award

        qs = Award.objects.order_by("-id" if sort_by_id else "id")
        return [
            {
                "id": a.id, "title": a.title, "credential_url": a.credential_url,
                "description": a.description, "issued": _month_year(a.issued), "issued_iso": _iso_month(a.issued),
                "institution": a.institution, "website": a.website, "logo": _image_url(a.logo),
            }
            for a in qs
        ]

    @classmethod
    def get_applications(cls):
        """Get applications data sorted by latest journey timestamp (descending) and journey dates (ascending)."""
        return content_cache.get_or_build("applications", cls._build_applications)

    @classmethod
    def _build_applications(cls):
        from apps.about.models import Application

        applications = []
        for app in Application.objects.prefetch_related("journey_steps").order_by("-id"):
            # Steps without timestamps are placed at the end. datetime.min (naive)
            # is only ever compared against other None-timestamp placeholders --
            # the tuple's first element short-circuits before reaching a real
            # (timezone-aware) timestamp, so this never raises naive/aware TypeError.
            journey = sorted(
                app.journey_steps.all(),
                key=lambda s: (s.timestamp is None, s.timestamp or datetime.min),
            )
            applications.append({
                "id": app.id, "status": app.status, "company_name": app.company_name,
                "position": app.position, "employment_type": app.employment_type,
                "location_type": app.location_type, "location": app.location,
                "applied_via": app.applied_via, "salary_range": app.salary_range,
                "journey": [
                    {"timestamp": s.timestamp, "title": s.title, "details": s.details, "notes": s.notes}
                    for s in journey
                ],
                "lessons_learned": app.lessons_learned,
            })

        def get_latest_timestamp(app):
            timestamps = [step["timestamp"] for step in app["journey"] if step["timestamp"]]
            if timestamps:
                return max(timestamps)
            return datetime.fromtimestamp(app["id"], tz=UTC)

        applications.sort(key=get_latest_timestamp, reverse=True)
        return applications
