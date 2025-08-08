from django.conf import settings
from datetime import datetime
import pytz

class AboutData:
    @staticmethod
    def is_working_hours():
        jakarta_tz = pytz.timezone("Asia/Jakarta")
        now = datetime.now(jakarta_tz)

        is_weekday = now.weekday() < 5
        is_work_hour = 15 <= now.hour < 20

        return is_weekday and is_work_hour

    @classmethod
    def get_about_data(cls):
        return {
            "name": "Ridwan Halim",
            "first_name": "Ridwan",
            "last_name": "Halim",
            "username": "ridwaanhall",
            "aka": "roneha",
            "image_url": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
            "personal_website": "https://ridwaanhall.com",
            "cv": "https://drive.google.com/file/d/17FaTvAPK273fzXa9ez36X1vDCuQRLM-1/view?usp=sharing",
            "cv_latest": "https://drive.google.com/file/d/1Sv2VQ95fDn-0a_8lOZxBuFAZ--gJrw7u5EQ-_SLUfpo/view?usp=sharing",
            "cv_copy": "https://docs.google.com/document/d/1Sv2VQ95fDn-0a_8lOZxBuFAZ--gJrw7u5EQ-_SLUfpo/copy",
            "role": "Machine Learning Mentor",
            "is_active": cls.is_working_hours(),
            "short_description": "a quiet space where machine learning, open-source, and reflections converge.",
            "short_bio_old": "I explore through code, share with empathy, and reflect on every challenge. My work weaves machine learning, web creation, and open-source. This site archives the curious, the technical, and the quietly thoughtful.",
            "short_bio": "I explore through code, share with empathy, and reflect on every challenge. My work weaves machine learning, web creation, and open source. I thrive on collaborating with teams to develop smart, user centered AI and web solutions that blend function with clarity.",
            "short_cta": "Stay a while and see what lives beyond the code.",
            "long_description": "I'm a machine learning engineer and web developer, building AI apps and slick websites that solve real problems. I've memorized nearly 30 Juz of the Quran, which has wired me for grit, focus, and discipline. I've mentored 50+ coders at DBS Foundation's Coding Camp and guided 100+ interns at GAOTek Inc. I've shipped 30+ projects using TensorFlow, PyTorch, and more. I'm all in on using AI to tackle big challenges fast, growing Copilot ID, and dropping value in open-source communities.",
            "stories": [
                "I am Ridwan, known as ridwaanhall or roneha. A Python developer and machine learning mentor from Central Java, Indonesia, I lead Copilot ID—my creative hub for building intelligent systems and web applications with Django, Flask, and AI tools, crafting each project with purpose.",
                "Beyond code, my spiritual journey has led me to memorize nearly 30 Juz of the Quran, a pursuit that has instilled in me discipline, clarity, and resilience—qualities that permeate my approach to coding and mentorship.",
                "Professionally, I have had the privilege of guiding over 50 aspiring coders at DBS Foundation’s Coding Camp, nurturing their growth in Python and essential soft skills. At GAOTek Inc., I mentored more than 100 interns, helping them navigate their early steps in the tech world. To date, I have delivered over 30 projects, spanning AI models to full-stack web applications, leveraging tools like TensorFlow, PyTorch, and beyond.",
                "My academic foundation was laid at Pondok Pesantren Islam Al Mukmin, where I immersed myself in Islamic studies, followed by a Bachelor’s degree in Intelligent Systems (AI) from the University of Technology Yogyakarta, where I delved into the frontiers of machine learning.",
                "Looking forward, my vision is to elevate Copilot ID, contribute meaningfully to open-source communities, and harness AI to address impactful challenges with precision and integrity. I am committed to fostering innovation that drives sustainable progress.",
                "If you have a visionary idea or wish to explore the possibilities of technology, I’d be delighted to connect and create something transformative together. Wassalamu'alaikum Warahmatullahi Wabarokatuh.🚀"
            ],
            "location": {
                "regency": "Boyolali",
                "residency": "Surakarta Residency",
                "province": "Central Java",
                "prov": "Central Java",
                "country": "Indonesia",
                "flag": "🇮🇩"
            },
            "social_media": {
                "email": "hi@ridwaanhall.com",
                "github": "https://gh.ridwaanhall.com",
                "linkedin": "https://li.ridwaanhall.com",
                "follow_linkedin": "https://linkedin.com/comm/mynetwork/discovery-see-all?usecase=PEOPLE_FOLLOWS&followMember=ridwaanhall",
                "instagram": "https://ig.ridwaanhall.com",
                "medium": "https://medium.com/@ridwaanhall",
                "x": "https://x.com/ridwaanhall",
                "website": "https://roneha.dev",
            },
            "donate": [
                {
                    "github_sponsor": "https://github.com/sponsors/ridwaanhall",
                    "donate_text": "Back me on GitHub Sponsors"
                },
                {
                    "sociabuzz": "https://sociabuzz.com/ridwaanhall/support",
                    "donate_text": "Become a patron through Sociabuzz"
                },
                {
                    "buy_me_a_coffee": "https://www.buymeacoffee.com/ridwaanhall",
                    "donate_text": "Support my work with a coffee"
                },
                {
                    "saweria": "https://saweria.co/ridwaanhall",
                    "donate_text": "Support my journey on Saweria"
                },
            ],
            "skills": [
                "Python",
                "Django",
                "TensorFlow",
                "PyTorch",
                "Flask"
            ],
        }
