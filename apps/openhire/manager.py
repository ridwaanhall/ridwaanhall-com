"""
OpenHire Manager - Central controller for hiring / open-to-work data.
ORM-backed (previously read from apps/openhire/data/*.py IFS files).
"""


class OpenHireManager:
    @classmethod
    def get_hiring_data(cls) -> dict | None:
        from apps.core import cache as content_cache

        return content_cache.get_or_build("hiring_data", cls._build_hiring_data)

    @classmethod
    def _build_hiring_data(cls) -> dict | None:
        from apps.openhire.models import HiringProfile

        hp = HiringProfile.objects.first()
        if not hp:
            return None
        return {
            "company_name": hp.company_name, "company_description": hp.company_description,
            "website": hp.website, "hiring_status": hp.hiring_status,
            "positions": [
                {
                    "title": p.title, "type": p.type, "location": p.location,
                    "salary_range": p.salary_range, "experience_required": p.experience_required,
                    "skills_required": p.skills_required, "responsibilities": p.responsibilities,
                    "benefits": p.benefits,
                }
                for p in hp.positions.all()
            ],
            "application_process": hp.application_process, "company_culture": hp.company_culture,
            "requirements": {"general": hp.requirements_general, "technical": hp.requirements_technical},
            "contact_info": {
                "email": hp.contact_email, "application_email": hp.contact_application_email,
                "response_time": hp.contact_response_time, "interview_process": hp.contact_interview_process,
            },
            "additional_notes": hp.additional_notes,
        }

    @classmethod
    def get_open_to_work_data(cls) -> dict | None:
        from apps.core import cache as content_cache

        return content_cache.get_or_build("open_to_work_data", cls._build_open_to_work_data)

    @classmethod
    def _build_open_to_work_data(cls) -> dict | None:
        from apps.openhire.models import OpenToWorkProfile

        op = OpenToWorkProfile.objects.first()
        if not op:
            return None
        return {
            "status": op.status, "availability": op.availability,
            "remote": op.remote, "relocation": op.relocation,
            "type": op.type, "preferred_roles": op.preferred_roles,
            "skills_highlight": op.skills_highlight, "show_all_tools_skills": op.show_all_tools_skills,
            "experience_level": op.experience_level, "salary_expectation": op.salary_expectation,
            "notice_period": op.notice_period, "work_authorization": op.work_authorization,
            "languages": op.languages, "preferred_locations": op.preferred_locations,
            "location_types": op.location_types, "remote_locations": op.remote_locations,
            "portfolio_highlights": [
                {"title": ph.title, "description": ph.description} for ph in op.portfolio_highlights.all()
            ],
            "contact_preference": op.contact_preference,
            "interview_availability": op.interview_availability,
            "additional_notes": op.additional_notes,
        }
