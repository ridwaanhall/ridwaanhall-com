from django.utils import timezone

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
                "username": "ridwaanhall",
                "image_url": "https://ridwaanhall.com/static/img/ridwaanhall.webp",
                "personal_website": "https://ridwaanhall.vercel.app",
                "cv": "https://bit.ly/cv-ridwaanhall",
                "role": "Machine Learning Mentor",
                "is_active": cls.is_working_hours(),
                # "is_active": False,
                "short_bio": "A passionate machine learning engineer and web development with a focus on practical applications of AI.",
                "short_description": "Fueled by Python, coding the future of AI and web tech. Let's make magic happen!",
                "stories": [
                    "Hi, I'm ridwaanhall—a Python Developer, Machine Learning Mentor, and Founder of Copilot ID based in the vibrant city of Central Java, Indonesia. I'm passionate about building AI-powered solutions and crafting awesome web applications.",
                    "On a personal note, I've memorized nearly 30 Juz of the Quran, an achievement that taught me the values of discipline, dedication, and focus—qualities I bring to every aspect of my professional life.",
                    "Professionally, I've had the chance to take on some exciting roles. As a Machine Learning mentor at Coding Camp powered by DBS Foundation, I've guided over 50 students to master both technical and soft skills. I've also completed more than 30 Python projects using technologies like Django, Flask, TensorFlow, PyTorch, and Next.js.",
                    "Additionally, I supported over 100 interns during my time at GAOTek Inc., providing technical guidance and helping them thrive in their roles.",
                    "My educational journey includes earning a bachelor's degree in Intelligent Systems (AI) from the University of Technology Yogyakarta, where I focused on advancing Machine Learning technologies. Before that, I studied at Pondok Pesantren Islam Al Mukmin, where I built a strong foundation in Islamic studies while attending Islamic Boarding School of Al Mukmin.",
                    "Looking ahead, my vision is to leverage AI to solve real-world problems quickly and efficiently. I'm also passionate about building my personal brand, contributing to open-source projects, and focusing on both short and long-term investments to support sustainable growth and innovation.",
                    "If you're into brainstorming ideas, collaborating on exciting projects, or just sharing insights about technology, feel free to reach out. Let's create something amazing together! 🚀"
                ],
                "location": {
                    "regency": "Boyolali",
                    "province": "Central Java",
                    "prov": "Central Java",
                    "country": "Indonesia",
                    "map_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d472166.72680191!2d110.27628355896701!3d-7.3869701170751005!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a73e2eb7ff211%3A0x3027a76e352bc80!2sBoyolali%20Regency%2C%20Central%20Java!5e1!3m2!1sen!2sid!4v1744531766838!5m2!1sen!2sid"
                },
                "social_media": {
                    "github": "https://github.com/ridwaanhall",
                    "linkedin": "https://linkedin.com/in/ridwaanhall",
                    "follow_linkedin": "https://linkedin.com/comm/mynetwork/discovery-see-all?usecase=PEOPLE_FOLLOWS&followMember=ridwaanhall",
                    "x": "https://x.com/ridwaanhall",
                    "instagram": "https://instagram.com/ridwaanhall",
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
