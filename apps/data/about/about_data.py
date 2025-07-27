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
                "Hi, I'm Ridwan also known as ridwaanhall aka roneha —a Python programmer, machine learning mentor, and open-source contributor with a focus on ML and web development. Based in Central Java, Indonesia, I lead Copilot ID, where I build intelligent systems and modern web apps using Django, Flask, and cutting-edge AI tools to solve real-world problems with purpose.",
                "On a personal note, I've memorized nearly 30 Juz of the Quran. It's not just about verses—it's wired me for grit, focus, and discipline, the same energy I pour into every line of code and mentoring session.",
                "I've had some dope gigs. I mentored 50+ coders at DBS Foundation's Coding Camp, leveling up their Python and people skills. At GAOTek Inc., I guided 100+ interns to crush it. Oh, and I've shipped 30+ projects—AI models, web apps, you name it—using TensorFlow, PyTorch, and more.",
                "My roots? I studied at Pondok Pesantren Islam Al Mukmin, soaking up Islamic wisdom, then snagged a Bachelor's in Intelligent Systems (AI) from University of Technology Yogyakarta, geeking out on Machine Learning breakthroughs.",
                "What's next? I'm all in on using AI to tackle big challenges fast, growing Copilot ID, and dropping value in open-source communities. Plus, I'm playing the long game with investments to fuel innovation that lasts.",
                "Got a wild idea or just wanna vibe on tech? Hit me up—let's build something epic together! 🚀"
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
