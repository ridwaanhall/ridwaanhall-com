from __future__ import annotations

from dataclasses import asdict
from datetime import datetime
from zoneinfo import ZoneInfo

from django.conf import settings

from .types import (
    CV, PersonalInfo, Bio, AboutLocation, SocialMedia, DonateLink, AboutDataModel,
)


class AboutData:
    @staticmethod
    def is_working_hours() -> bool:
        jakarta_tz = ZoneInfo("Asia/Jakarta")
        now = datetime.now(jakarta_tz)
        is_weekday = now.weekday() < 5
        is_work_hour = 15 <= now.hour < 20
        return is_weekday and is_work_hour

    @classmethod
    def get_about_data(cls) -> dict:
        """Build the canonical AboutDataModel instance and return it as a plain dict."""
        instance = AboutDataModel(
            personal=PersonalInfo(
                name="Ridwan Halim",
                first_name="Ridwan",
                last_name="Halim",
                username="ridwaanhall",
                aka="roneha",
                image_url=settings.AUTHOR_IMG,
                personal_website="https://ridwaanhall.com",
                cv=CV(
                    main="https://drive.google.com/file/d/17FaTvAPK273fzXa9ez36X1vDCuQRLM-1/view",
                    latest="https://drive.google.com/file/d/1Sv2VQ95fDn-0a_8lOZxBuFAZ--gJrw7u5EQ-_SLUfpo/view",
                    copy="https://docs.google.com/document/d/1Sv2VQ95fDn-0a_8lOZxBuFAZ--gJrw7u5EQ-_SLUfpo/copy",
                ),
                role="Python Developer",
                is_active=cls.is_working_hours(),
                is_open_to_work=False,
                is_hiring=False,
            ),
            bio=Bio(
                short_description="a quiet space where machine learning, open-source, and reflections converge.",
                short_bio="I explore through code, share with empathy, and reflect on every challenge. My work weaves machine learning, web creation, and open source. I thrive on collaborating with teams to develop AI and web solutions that blend function with clarity.",
                short_cta="Stay a while and see what lives beyond the code.",
                long_description="I’m a machine learning engineer and web developer, building AI apps and slick websites that solve real problems. I’ve memorized nearly 30 Juz of the Quran, which has wired me for grit, focus, and discipline. I’ve mentored 50+ coders at DBS Foundation’s Coding Camp and guided 100+ interns at GAOTek Inc. I’ve shipped 45+ projects using TensorFlow, PyTorch, and more. I’m all in on using AI to tackle big challenges fast, growing RoneAI, and dropping value in open-source communities.",
            ),
            stories=[
                "I am Ridwan, known as ridwaanhall or roneha. A Python developer with hands-on experience in machine learning and web development based in Yogyakarta, Indonesia. I lead RoneAI, my creative hub for building intelligent systems and web applications with Django, Flask, and ML tools with PyTorch and TensorFlow.",
                "During my internship at Ruang Media Solusi, I developed a reporting website similar to lapor.go.id using Django, integrated 5+ API endpoints from a Laravel backend, and styled the frontend with Vuexy. I successfully completed 3 core modules (report submission, admin dashboard, user tracking) and improved API integration performance by ~20%.",
                "In my professional experience, I’ve mentored over 50 aspiring developers through DBS Foundation’s Coding Camp, helping them grow in Machine Learning with Python and soft skills. At GAOTek Inc., I supported more than 100 interns as they took their first steps into the tech world. So far, I’ve completed over 40 projects, ranging from AI models to full-stack web apps.",
                "My academic journey began at Al Mukmin Islamic Boarding School, where I focused on Islamic studies. Later, I earned a bachelor’s degree in informatics with a concentration in Intelligent Systems (AI) from the University of Technology Yogyakarta, graduating with a GPA of 3.58.",
                "Outside of tech, I’ve been on a spiritual journey that shaped how I think and work. I’ve memorized nearly 30 Juz of the Quran, a path that taught me discipline, clarity, and resilience. These qualities naturally influence how I approach coding and mentorship.",
                "I stay sharply focused on both AI web advancements and Indonesia’s financial market—especially IHSG—to stay ahead in tech, achieve financial freedom as soon as possible, and enjoy the fruits of my work in retirement.",
                "Looking forward, my vision is to elevate RoneAI, contribute meaningfully to open-source communities, and harness AI to address impactful challenges with precision and integrity. I am committed to fostering innovation that drives sustainable progress.",
                "If you have a visionary idea or wish to explore the possibilities of technology, I’d be delighted to connect and create something transformative together.🚀"
            ],
            location=AboutLocation(
                regency="Yogyakarta City",
                residency="Yogyakarta",
                province="Special Region of Yogyakarta",
                prov="Yogyakarta",
                country="Indonesia",
                flag="🇮🇩",
            ),
            social_media=SocialMedia(
                email="hi@ridwaanhall.com",
                github="https://gh.ridwaanhall.com",
                linkedin="https://li.ridwaanhall.com",
                follow_linkedin="https://linkedin.com/comm/mynetwork/discovery-see-all?usecase=PEOPLE_FOLLOWS&followMember=ridwaanhall",
                instagram="https://ig.ridwaanhall.com",
                medium="https://medium.com/@ridwaanhall",
                x="https://x.com/ridwaanhall",
                website="https://rone.dev",
            ),
            donate=[
                DonateLink(platform="GitHub Sponsors", url="https://github.com/sponsors/ridwaanhall"),
                DonateLink(platform="Sociabuzz", url="https://sociabuzz.com/ridwaanhall/support"),
                DonateLink(platform="Buy Me a Coffee", url="https://www.buymeacoffee.com/ridwaanhall"),
                DonateLink(platform="Saweria", url="https://saweria.co/ridwaanhall"),
            ],
            skills=[
                "Python",
                "Django",
                "TensorFlow",
                "PyTorch",
                "Flask"
            ],
        )
        return asdict(instance)
