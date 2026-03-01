"""
Open to Work Data - Information about availability for work opportunities
"""
from __future__ import annotations

from dataclasses import asdict

from apps.openhire.types import OpenToWorkModel, PortfolioHighlight


class OpenToWorkData:
    """
    Data structure for open to work information.
    Contains details about availability, preferences, and requirements.
    """

    _model = OpenToWorkModel(
        
        # status & availability
        status="Actively Looking",
        availability="Within 1 month",
        type=[
            "Full-time",
            "Contract",
            "Part-time",
        ],
        remote=True,
        relocation=True,
        
        # preferred roles
        preferred_roles=[
            "AI Engineer",
            "Machine Learning Engineer",
            "Python/Django/Full Stack Developer",
            "Data Analyst",
        ],
        
        # key skills
        skills_highlight=[
            "Python",
            "Django",
            "Machine Learning",
            "TensorFlow",
            "PyTorch",
            "REST APIs",
            "Git",
            "PostgreSQL",
            "Docker",
        ],
        
        # professional details
        experience_level="Mid-Level (2-4 years)",
        salary_expectation="Competitive / Negotiable",
        notice_period="1 month",
        work_authorization="Indonesian Citizen",
        
        # languages & preferences
        languages=[
            "Indonesian (Native)",
            "English (Professional)",
            "Arabic (Limited)"
        ],
        contact_preference="LinkedIn, Email",
        interview_availability="Flexible",
        
        # location preferences
        location_types=[
            "On-site",
            "Hybrid",
            "Remote"
        ],
        preferred_locations=[
            "Jakarta, Indonesia",
            "Greater Yogyakarta, Indonesia",
            "Surakarta, Central Java, Indonesia",
            "Boyolali, Central Java, Indonesia"
        ],
        remote_locations=[
            "Indonesia",
            "United Arab Emirates",
            "Brunei",
            "Singapore",
            "Malaysia"
        ],
        
        # portfolio highlights
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
        
        # additional notes
        additional_notes="Passionate about building intelligent web applications and scalable AI solutions using Python. Actively seeking opportunities to grow in machine learning, deep learning, and modern web frameworks.",

        # tools and skills
        show_all_tools_skills=True,
    )

    @classmethod
    def get_open_to_work_data(cls) -> dict:
        """Get open to work data as a plain dict."""
        return asdict(cls._model)
