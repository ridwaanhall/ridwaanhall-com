from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any


@dataclass(frozen=True)
class Position:
    title: str
    type: str
    location: str
    salary_range: str
    experience_required: str
    skills_required: list[str] = field(default_factory=list)
    responsibilities: list[str] = field(default_factory=list)
    benefits: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Requirements:
    general: list[str] = field(default_factory=list)
    technical: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class ContactInfo:
    email: str
    application_email: str
    response_time: str
    interview_process: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class HiringModel:
    """Typed model for hiring information."""
    company_name: str
    company_description: str
    website: str
    hiring_status: str
    positions: list[Position] = field(default_factory=list)
    application_process: list[str] = field(default_factory=list)
    company_culture: list[str] = field(default_factory=list)
    requirements: Requirements = field(default_factory=lambda: Requirements())
    contact_info: ContactInfo = field(default_factory=lambda: ContactInfo(
        email="", application_email="", response_time="", interview_process=""
    ))
    additional_notes: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
