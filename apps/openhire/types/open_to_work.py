from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any


@dataclass(frozen=True)
class PortfolioHighlight:
    title: str
    description: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class OpenToWorkModel:
    """Typed model for open-to-work information."""
    status: str
    availability: str
    type: str
    remote: bool
    relocation: bool
    preferred_roles: list[str] = field(default_factory=list)
    skills_highlight: list[str] = field(default_factory=list)
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

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
