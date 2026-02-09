from __future__ import annotations

from dataclasses import dataclass, field


# ---------- open to work types ----------

@dataclass(frozen=True)
class PortfolioHighlight:
    title: str
    description: str


@dataclass(frozen=True)
class OpenToWorkModel:
    """Typed model for open-to-work information."""
    # Status
    status: str
    availability: str
    type: str
    remote: bool
    relocation: bool

    # Preferences
    preferred_roles: list[str] = field(default_factory=list)
    skills_highlight: list[str] = field(default_factory=list)
    experience_level: str = ""
    salary_expectation: str = ""
    notice_period: str = ""
    work_authorization: str = ""

    # Location & language
    languages: list[str] = field(default_factory=list)
    preferred_locations: list[str] = field(default_factory=list)
    location_types: list[str] = field(default_factory=list)
    remote_locations: list[str] = field(default_factory=list)

    # Portfolio
    portfolio_highlights: list[PortfolioHighlight] = field(default_factory=list)

    # Contact
    contact_preference: str = ""
    interview_availability: str = ""
    additional_notes: str = ""


# ---------- hiring types ----------

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


@dataclass(frozen=True)
class Requirements:
    general: list[str] = field(default_factory=list)
    technical: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class ContactInfo:
    email: str
    application_email: str
    response_time: str
    interview_process: str


@dataclass(frozen=True)
class HiringModel:
    """Typed model for hiring information."""
    # Company
    company_name: str
    company_description: str
    website: str
    hiring_status: str

    # Positions & process
    positions: list[Position] = field(default_factory=list)
    application_process: list[str] = field(default_factory=list)
    company_culture: list[str] = field(default_factory=list)

    # Requirements & contact
    requirements: Requirements = field(default_factory=lambda: Requirements())
    contact_info: ContactInfo = field(default_factory=lambda: ContactInfo(
        email="", application_email="", response_time="", interview_process=""
    ))

    additional_notes: str = ""
