from __future__ import annotations

from dataclasses import dataclass, field

from apps.core.types.mixins import DictConvertible


@dataclass(frozen=True)
class PortfolioHighlight(DictConvertible):
    title: str
    description: str


@dataclass(frozen=True)
class OpenToWorkModel(DictConvertible):
    """Typed model for open-to-work information."""
    status: str
    availability: str
    remote: bool
    relocation: bool
    type: list[str] = field(default_factory=list)
    preferred_roles: list[str] = field(default_factory=list)
    skills_highlight: list[str] = field(default_factory=list)
    show_all_tools_skills: bool = False
    experience_level: str = ""
    salary_expectation: str = ""
    notice_period: str = ""
    work_authorization: str = ""
    languages: list[str] = field(default_factory=list)
    preferred_locations: list[str] = field(default_factory=list)
    location_types: list[str] = field(default_factory=list)
    remote_locations: list[str] = field(default_factory=list)
    portfolio_highlights: list[PortfolioHighlight] = field(default_factory=list)
    contact_preference: str = ""
    interview_availability: str = ""
    additional_notes: str = ""
