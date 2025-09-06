"""
Open to Work Data - Information about availability for work opportunities
"""

class OpenToWorkData:
    """
    Data structure for open to work information.
    Contains details about availability, preferences, and requirements.
    """
    
    @classmethod
    def get_open_to_work_data(cls):
        """Get open to work data."""
        return {
            "status": "Actively Looking",
            "availability": "Immediately Available",
            "type": "Full-time, Part-time, Contract, Freelance",
            "remote": True,
            "relocation": False,
            "preferred_roles": [
                "Python Developer",
                "Machine Learning Engineer", 
                "Full Stack Developer",
                "Backend Developer",
                "AI Engineer",
                "Django Developer"
            ],
            "skills_highlight": [
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
            "experience_level": "Mid-Level (2-4 years)",
            "salary_expectation": "Competitive",
            "notice_period": "Immediately",
            "work_authorization": "Indonesian Citizen",
            "languages": ["Indonesian (Native)", "English (Professional)"],
            "preferred_locations": [
                "Remote",
                "Jakarta, Indonesia",
                "Yogyakarta, Indonesia",
                "Surakarta, Indonesia"
            ],
            "portfolio_highlights": [
                {
                    "title": "AI-Powered Web Applications",
                    "description": "Built and deployed multiple ML-powered web apps using Django and TensorFlow"
                },
                {
                    "title": "Mentorship Experience", 
                    "description": "Mentored 50+ developers at coding camps and guided 100+ interns"
                },
                {
                    "title": "Open Source Contributions",
                    "description": "Active contributor to Python and AI communities with 30+ projects"
                }
            ],
            "contact_preference": "Email",
            "interview_availability": "Flexible with timezone adjustments",
            "additional_notes": "Passionate about building impactful AI solutions and mentoring upcoming developers. Looking for opportunities that allow growth in machine learning and leadership roles."
        }
