"""
Open to Work Data - Information about availability for work opportunities
"""
from __future__ import annotations

from dataclasses import asdict

from apps.about.data.skills_data import SkillsData
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
        used_tools_skills = {
            "Languages": [
                SkillsData.tech_stack["python"],
                SkillsData.tech_stack["php"],
                SkillsData.tech_stack["javascript"],
                SkillsData.tech_stack["typescript"],
            ],
            "Backend Frameworks": [
                SkillsData.tech_stack["django"],
                SkillsData.tech_stack["flask"],
                SkillsData.tech_stack["laravel"],
                SkillsData.tech_stack["nodejs"],
                SkillsData.tech_stack["fastapi"],
            ],
            "Data Apps": [
                SkillsData.tech_stack["streamlit"],
            ],
            "Frontend Frameworks": [
                SkillsData.tech_stack["react"],
                SkillsData.tech_stack["nextjs"],
                SkillsData.tech_stack["mdx"],
            ],
            "Styling & UI": [
                SkillsData.tech_stack["html5"],
                SkillsData.tech_stack["css3"],
                SkillsData.tech_stack["css"],
                SkillsData.tech_stack["scss"],
                SkillsData.tech_stack["bootstrap"],
                SkillsData.tech_stack["tailwindcss"],
                SkillsData.tech_stack["bulma"],
                SkillsData.tech_stack["materialui"],
                SkillsData.tech_stack["radix_ui"],
                SkillsData.tech_stack["shadcn_ui"],
                SkillsData.tech_stack["once_ui"],
                SkillsData.tech_stack["vuexy"],
                SkillsData.tech_stack["adminlte"],
            ],
            "CMS & E-commerce": [
                SkillsData.tech_stack["wordpress"],
                SkillsData.tech_stack["woocommerce"],
            ],
            "Data Visualization": [
                SkillsData.tech_stack["chartjs"],
                SkillsData.tech_stack["datatables"],
                SkillsData.tech_stack["leaflet"],
            ],
            "Utilities & Auth": [
                SkillsData.tech_stack["allauth"],
                SkillsData.tech_stack["flask_mail"],
                SkillsData.tech_stack["whitenoise"],
                SkillsData.tech_stack["jwt"],
            ],
            "Automation & Scraping": [
                SkillsData.tech_stack["n8n"],
                SkillsData.tech_stack["selenium"],
                SkillsData.tech_stack["beautifulsoup"],
                SkillsData.tech_stack["sheets"],
            ],
            "ML Frameworks": [
                SkillsData.tech_stack["tensorflow"],
                SkillsData.tech_stack["pytorch"],
                SkillsData.tech_stack["keras"],
                SkillsData.tech_stack["scikitlearn"],
                SkillsData.tech_stack["opencv"],
                SkillsData.tech_stack["timm"],
            ],
            "ML Algorithms": [
                SkillsData.tech_stack["cnn"],
                SkillsData.tech_stack["rnn"],
                SkillsData.tech_stack["lstm"],
                SkillsData.tech_stack["gru"],
                SkillsData.tech_stack["knn"],
                SkillsData.tech_stack["svm"],
                SkillsData.tech_stack["hog"],
                SkillsData.tech_stack["aco"],
                SkillsData.tech_stack["machine_learning"],
                SkillsData.tech_stack["neural_networks"],
                SkillsData.tech_stack["music_recommendation"],
            ],
            "LLMs & AI Services": [
                SkillsData.tech_stack["chatgpt"],
                SkillsData.tech_stack["gemini"],
            ],
            "Data Science": [
                SkillsData.tech_stack["jupyter"],
                SkillsData.tech_stack["anaconda"],
                SkillsData.tech_stack["pandas"],
                SkillsData.tech_stack["numpy"],
                SkillsData.tech_stack["matplotlib"],
                SkillsData.tech_stack["plotly"],
                SkillsData.tech_stack["seaborn"],
            ],
            "Databases & ORM": [
                SkillsData.tech_stack["mysql"],
                SkillsData.tech_stack["sqlite"],
                SkillsData.tech_stack["mongodb"],
                SkillsData.tech_stack["postgresql"],
                SkillsData.tech_stack["redis"],
                SkillsData.tech_stack["sqlalchemy"],
            ],
            "APIs & Services": [
                SkillsData.tech_stack["django_rest_framework"],
                SkillsData.tech_stack["postman"],
                SkillsData.tech_stack["graphql"],
                SkillsData.tech_stack["rest_api"],
                SkillsData.tech_stack["github_api"],
                SkillsData.tech_stack["openai_api"],
                SkillsData.tech_stack["wakatime_api"],
                SkillsData.tech_stack["google_maps"],
                SkillsData.tech_stack["openstreetmap"],
                SkillsData.tech_stack["telegram"],
            ],
            "Cloud & DevOps": [
                SkillsData.tech_stack["docker"],
                SkillsData.tech_stack["cloudflare"],
                SkillsData.tech_stack["boto3"],
            ],
            "Package Management": [
                SkillsData.tech_stack["pypi"],
            ],
            "PaaS": [
                SkillsData.tech_stack["vercel"],
                SkillsData.tech_stack["netlify"],
                SkillsData.tech_stack["cloudflare_pages"],
            ],
            "Serverless": [
                SkillsData.tech_stack["cloudflare_workers"],
            ],
            "Web Server": [
                SkillsData.tech_stack["nginx"],
            ],
            "Testing": [
                SkillsData.tech_stack["pytest"],
            ],
            "Version Control": [
                SkillsData.tech_stack["git"],
                SkillsData.tech_stack["github"],
            ],
            "Editor & IDE": [
                SkillsData.tech_stack["vscode"],
                SkillsData.tech_stack["jetbrains"],
                SkillsData.tech_stack["replit"],
            ],
            "Design": [
                SkillsData.tech_stack["figma"],
                SkillsData.tech_stack["canva"],
            ],
            "Desktop": [
                SkillsData.tech_stack["gui_framework"],
            ],
        },
    )

    @classmethod
    def get_open_to_work_data(cls) -> dict:
        """Get open to work data as a plain dict."""
        return asdict(cls._model)
