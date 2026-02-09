"""
Open to Work Data - Information about availability for work opportunities
"""
from __future__ import annotations

from dataclasses import dataclass, field, asdict


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


class OpenToWorkData:
    """
    Data structure for open to work information.
    Contains details about availability, preferences, and requirements.
    """

    _model = OpenToWorkModel(
        status="Actively Looking",
        availability="Immediately",
        type="Full-time, Part-time, Contract",
        remote=True,
        relocation=True,
        preferred_roles=[
            "Machine Learning Engineer",
            "AI Engineer",
            "Python Developer",
            "Django Developer",
            "Data Analyst",
        ],
        skills_highlight=[
            "Python",
            "Django",
            "Machine Learning",
            "TensorFlow",
            "PyTorch",
            "REST APIs",
            "PostgreSQL",
            "Docker",
            "Git"
        ],
        experience_level="Mid-Level (2-4 years)",
        salary_expectation="Competitive",
        notice_period="Immediately",
        work_authorization="Indonesian Citizen",
        languages=[
            "Indonesia (Native)",
            "English (Professional)",
            "Arabic (Limited)"
        ],
        preferred_locations=[
            "Jakarta, Indonesia",
            "Greater Yogyakarta, Indonesia",
            "Surakarta, Central Java, Indonesia",
            "Boyolali, Central Java, Indonesia"
        ],
        location_types=[
            "On-site",
            "Hybrid",
            "Remote"
        ],
        remote_locations=[
            "Indonesia",
            "United Arab Emirates",
            "Brunei",
            "Singapore",
            "Malaysia"
        ],
        portfolio_highlights=[
            PortfolioHighlight(
                title="AI-Powered Web Applications",
                description="Built and deployed multiple ML-powered web apps using Django and TensorFlow"
            ),
            PortfolioHighlight(
                title="Mentorship Experience",
                description="Mentored 50+ developers at coding camps and guided 100+ interns"
            ),
            PortfolioHighlight(
                title="Open Source Contributions",
                description="Active contributor to Python and AI communities with 45+ projects"
            )
        ],
        contact_preference="LinkedIn, Email",
        interview_availability="Flexible with timezone adjustments",
        additional_notes="Passionate about building intelligent web applications and scalable AI solutions using Python. Actively seeking opportunities to grow in machine learning, deep learning, and modern web frameworks."
    )

    @classmethod
    def get_open_to_work_data(cls) -> dict:
        """Get open to work data as a plain dict."""
        return asdict(cls._model)
