from django.utils import timezone
from django.conf import settings

class AboutData:
    @staticmethod
    def is_working_hours():
        now = timezone.localtime()
        
        is_weekday = now.weekday() < 5
        is_work_hour = 9 <= now.hour < 15

        return is_weekday and is_work_hour

    @classmethod
    def get_about_data(cls):
        return [
            {
                "name": "Ridwan Halim",
                "first_name": "Ridwan",
                "last_name": "Halim",
                "username": "ridwaanhall",
                "image_url": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
                "personal_website": "https://ridwaanhall.com",
                "cv": "https://bit.ly/cv-ridwaanhall",
                "role": "Machine Learning Mentor",
                "is_active": cls.is_working_hours(),
                # "is_active": False,
                "short_description": "Coding by day, memorizing Quran by heart—who else but me?",
                "short_bio": "A passionate machine learning engineer and web development with a focus on practical applications of AI.",
                "short_cta": "Let's whip up something epic that'll leave everyone stunned!",
                "long_description": "I’m a machine learning engineer and web developer, building AI apps and slick websites that solve real problems. I’ve memorized nearly 30 Juz of the Quran, which has wired me for grit, focus, and discipline. I’ve mentored 50+ coders at DBS Foundation’s Coding Camp and guided 100+ interns at GAOTek Inc. I’ve shipped 30+ projects using TensorFlow, PyTorch, and more. I’m all in on using AI to tackle big challenges fast, growing Copilot ID, and dropping value in open-source communities.",
                "stories": [
                    "Hi, I’m ridwaanhall—coding by day, memorizing Quran by heart—who else but me? Based in the buzzing heart of Central Java, Indonesia, I’m the founder of Copilot ID, building AI apps and slick websites with Django, Flask, and Next.js that solve real problems.",
                    "On a personal note, I’ve memorized nearly 30 Juz of the Quran. It’s not just about verses—it’s wired me for grit, focus, and discipline, the same energy I pour into every line of code and mentoring session.",
                    "I’ve had some dope gigs. I mentored 50+ coders at DBS Foundation’s Coding Camp, leveling up their Python and people skills. At GAOTek Inc., I guided 100+ interns to crush it. Oh, and I’ve shipped 30+ projects—AI models, web apps, you name it—using TensorFlow, PyTorch, and more.",
                    "My roots? I studied at Pondok Pesantren Islam Al Mukmin, soaking up Islamic wisdom, then snagged a Bachelor’s in Intelligent Systems (AI) from University of Technology Yogyakarta, geeking out on Machine Learning breakthroughs.",
                    "What’s next? I’m all in on using AI to tackle big challenges fast, growing Copilot ID, and dropping value in open-source communities. Plus, I’m playing the long game with investments to fuel innovation that lasts.",
                    "Got a wild idea or just wanna vibe on tech? Hit me up—let’s build something epic together! 🚀"
                ],
                "location": {
                    "regency": "Boyolali",
                    "province": "Central Java",
                    "prov": "Central Java",
                    "country": "Indonesia",
                    "flag": "🇮🇩",
                    "map_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d472166.72680191!2d110.27628355896701!3d-7.3869701170751005!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a73e2eb7ff211%3A0x3027a76e352bc80!2sBoyolali%20Regency%2C%20Central%20Java!5e1!3m2!1sen!2sid!4v1744531766838!5m2!1sen!2sid"
                },
                "social_media": {
                    "github": "https://gh.ridwaanhall.com",
                    "linkedin": "https://li.ridwaanhall.com",
                    "follow_linkedin": "https://linkedin.com/comm/mynetwork/discovery-see-all?usecase=PEOPLE_FOLLOWS&followMember=ridwaanhall",
                    "x": "https://x.com/ridwaanhall",
                    "instagram": "https://ig.ridwaanhall.com",
                    "medium": "https://medium.com/@ridwaanhall",
                    "email": "hi@ridwaanhall.com"
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
                    # "Flask"
                ],
            }
        ]
