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
                "short_bio": "A passionate machine learning engineer and web development with a focus on practical applications of AI.",
                "short_description": "Fueled by Python, coding the future of AI and web tech. Let's make magic happen!",
                "stories": [
                    "Hi, I'm Ridwan Halim—a Python Developer, Machine Learning Mentor, and Founder of Copilot ID based in the vibrant city of Special Region of Yogyakarta, Indonesia. I'm passionate about building AI-powered solutions and crafting awesome web applications.",
                    "On a personal note, I've memorized nearly 30 Juz of the Quran, an achievement that taught me the values of discipline, dedication, and focus—qualities I bring to every aspect of my professional life.",
                    "Professionally, I've had the chance to take on some exciting roles. As a Machine Learning mentor at Coding Camp powered by DBS Foundation, I've guided over 50 students to master both technical and soft skills. I've also completed more than 30 Python projects using technologies like Django, Flask, TensorFlow, PyTorch, and Next.js.",
                    "Additionally, I supported over 100 interns during my time at GAOTek Inc., providing technical guidance and helping them thrive in their roles.",
                    "My educational journey includes earning a bachelor's degree in Intelligent Systems (AI) from the University of Technology Yogyakarta, where I focused on advancing Machine Learning technologies. Before that, I studied at Pondok Pesantren Islam Al Mukmin, where I built a strong foundation in Islamic studies while attending Islamic Boarding School of Al Mukmin.",
                    "Looking ahead, my vision is to leverage AI to solve real-world problems quickly and efficiently. I'm also passionate about building my personal brand, contributing to open-source projects, and focusing on both short and long-term investments to support sustainable growth and innovation.",
                    "If you're into brainstorming ideas, collaborating on exciting projects, or just sharing insights about technology, feel free to reach out. Let's create something amazing together! 🚀"
                ],
                "image_url": "https://ridwaanhall.me/static/img/ridwaanhall.webp",
                "cv": "https://bit.ly/cv-ridwaanhall",
                "role": "Machine Learning Mentor",
                "location": {
                    "regency": "Sleman",
                    "province": "Special Region of Yogyakarta",
                    "prov": "Yogyakarta",
                    "country": "Indonesia",
                    "map_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126585.91904713991!2d110.29942949999999!3d-7.732935699999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a59bd800eed9d%3A0x8da2a5bd43977a33!2sSleman%20Regency%2C%20Special%20Region%20of%20Yogyakarta!5e0!3m2!1sen!2sid!4v1693559291713!5m2!1sen!2sid"
                },
                "is_active": cls.is_working_hours(),
                # "is_active": False,
                "social_media": {
                    "github": "https://github.com/ridwaanhall",
                    "linkedin": "https://linkedin.com/in/ridwaanhall",
                    "x": "https://x.com/ridwaanhall",
                    "instagram": "https://instagram.com/ridwaanhall",
                    "medium": "https://medium.com/@ridwaanhall",
                    "email": "ridwaanhall.dev@gmail.com"
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
