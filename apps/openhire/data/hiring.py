"""
Hiring Data - Information about hiring opportunities and open positions
"""
from __future__ import annotations

from dataclasses import asdict

from apps.openhire.types import HiringModel, Position, Requirements, ContactInfo


class HiringData:
    """
    Data structure for hiring information.
    Contains details about open positions, requirements, and company info.
    """

    _model = HiringModel(
        company_name="RoneAI",
        company_description="A creative hub building intelligent systems and web applications",
        website="https://rone.dev",
        hiring_status="Currently Hiring",
        positions=[
            Position(
                title="Junior Python Developer",
                type="Full-time",
                location="Remote",
                salary_range="IDR 5-8 Million/month",
                experience_required="0-2 years",
                skills_required=[
                    "Python",
                    "Django or Flask",
                    "Basic understanding of web development",
                    "Git version control",
                    "Problem-solving skills"
                ],
                responsibilities=[
                    "Develop and maintain web applications using Python/Django",
                    "Collaborate with team members on various projects",
                    "Write clean, maintainable code",
                    "Participate in code reviews",
                    "Learn and implement new technologies"
                ],
                benefits=[
                    "Remote work flexibility",
                    "Mentorship and learning opportunities",
                    "Project-based bonuses",
                    "Skill development support",
                    "Flexible working hours"
                ]
            ),
            Position(
                title="Machine Learning Intern",
                type="Internship",
                location="Remote",
                salary_range="Stipend Available",
                experience_required="Students/Fresh Graduates",
                skills_required=[
                    "Python programming",
                    "Basic understanding of ML concepts",
                    "Familiarity with pandas, numpy",
                    "Eagerness to learn",
                    "Good communication skills"
                ],
                responsibilities=[
                    "Assist in ML model development",
                    "Data preprocessing and analysis",
                    "Research on ML techniques",
                    "Documentation of findings",
                    "Collaborate on AI projects"
                ],
                benefits=[
                    "Real-world ML experience",
                    "One-on-one mentorship",
                    "Certificate of completion",
                    "Potential for full-time offer",
                    "Flexible schedule for students"
                ]
            )
        ],
        application_process=[
            "Submit resume and portfolio via email",
            "Initial screening call (15-30 minutes)",
            "Technical assessment or coding challenge",
            "Final interview with team",
            "Reference check and offer"
        ],
        company_culture=[
            "Innovation-driven environment",
            "Continuous learning focus",
            "Open communication",
            "Work-life balance",
            "Remote-first approach"
        ],
        requirements=Requirements(
            general=[
                "Strong problem-solving skills",
                "Good communication in English/Indonesian",
                "Self-motivated and independent",
                "Team collaboration abilities",
                "Passion for technology"
            ],
            technical=[
                "Proficiency in Python",
                "Understanding of software development principles",
                "Experience with version control (Git)",
                "Basic understanding of databases",
                "Willingness to learn new technologies"
            ]
        ),
        contact_info=ContactInfo(
            email="hi@ridwaanhall.com",
            application_email="career@ridwaanhall.com",
            response_time="Within 3-5 business days",
            interview_process="2-3 weeks"
        ),
        additional_notes="We’re looking for passionate individuals who want to grow with us. No prior experience with all technologies required - we believe in learning together and supporting each other’s growth."
    )

    @classmethod
    def get_hiring_data(cls) -> dict:
        """Get hiring data as a plain dict."""
        return asdict(cls._model)
