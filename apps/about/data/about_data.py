from __future__ import annotations

from dataclasses import asdict
from datetime import datetime
from zoneinfo import ZoneInfo

from django.conf import settings

from apps.about.types import (
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
                role="Full Stack Developer and AI/ML Engineer",
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
                "I am Ridwan, known online as ridwaanhall. I am a Full Stack Developer and AI/ML Engineer based in Boyolali, Indonesia. I specialize in building intelligent systems, scalable web applications, and robust data pipelines utilizing Python, Django, Flask, PyTorch, and TensorFlow.",
                "I lead RoneAI, my creative hub for technology solutions. Through this platform, I have executed full-cycle development for over 22 web projects and designed multiple end-to-end neural network systems, delivering scalable solutions that attract over 15,000 monthly unique visitors. Within this ecosystem, I also founded OpenMLBB, an API platform providing hero analytics and resources that currently serves a growing global community of developers.",
                "Currently, I bring my expertise to the global stage as a Full Stack Developer for Rawwy LLC in the United Arab Emirates. Working remotely with an international team, I integrate custom real-time gaming APIs into tournament platforms like fastur.gg and optimize platform security, rendering, and user workflows for thousands of active users across the Middle East and beyond.",
                "My technical journey is backed by intensive, hands-on development. As a Fullstack Developer Intern at Ruang Media Solusi, I built a comprehensive public reporting SaaS platform from the ground up (inspired by lapor.go.id). I managed everything from deploying secure Django backend services and integrating Laravel APIs to designing dynamic Vuexy admin dashboards with geospatial tracking.",
                "Beyond writing code, I am deeply committed to tech education and community growth. As a Machine Learning Mentor with DBS Foundation’s Coding Camp, I guided students through complex AI concepts and soft skills development, achieving a 75% graduation rate. Previously, I also supervised and supported over 100 international interns as they took their first steps into the tech world at GAOTek Inc.",
                "My academic and personal foundations heavily shape my work ethic. While earning my bachelor’s degree in Informatics with a concentration in Intelligent Systems (3.58 GPA) provided the technical theory, my early years at Al Mukmin Islamic Boarding School laid my moral groundwork.",
                "Memorizing nearly 30 Juz of the Quran has been a profound spiritual journey that instilled unparalleled discipline, resilience, and clarity in me. These qualities naturally drive my approach to clean code, architectural problem-solving, and how I interact with teams and mentees.",
                "I remain sharply focused on AI advancements and data analysis within the Indonesian financial market. By building robust algorithmic tools like my trading portfolio application, IHSG Pulse, I am actively working to stay ahead in tech, achieve financial freedom, and enjoy the fruits of my work in the future.",
                "My long-term vision is to elevate RoneAI, contribute meaningfully to the open-source ecosystem, and harness AI to address impactful challenges with precision and integrity.",
                "If you have a visionary idea or wish to explore the possibilities of technology, I’d be delighted to connect and create something transformative together.🚀",
            ],
            location=AboutLocation(
                regency="Boyolali",
                residency="Boyolali",
                province="Central Java",
                prov="Central Java",
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
