from django.utils import timezone
import datetime

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
                "image_url": "https://ridwaanhall.vercel.app/static/img/ridwaanhall.webp",
                "cv": "https://bit.ly/cv-ridwaanhall",
                "role": "Machine Learning Mentor",
                "location": {
                    "regency": "Sleman",
                    "province": "Special Region of Yogyakarta",
                    "prov": "Yogyakarta",
                    "country": "Indonesia",
                    "map_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126585.91904713991!2d110.29942949999999!3d-7.732935699999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a59bd800eed9d%3A0x8da2a5bd43977a33!2sSleman%20Regency%2C%20Special%20Region%20of%20Yogyakarta!5e0!3m2!1sen!2sid!4v1693559291713!5m2!1sen!2sid"
                },
                # "is_active": cls.is_working_hours(),
                "social_media": {
                    "github": "https://github.com/ridwaanhall",
                    "linkedin": "https://linkedin.com/in/ridwaanhall",
                    "x": "https://x.com/ridwaanhall",
                    "instagram": "https://instagram.com/ridwaanhall",
                    "medium": "https://medium.com/@ridwaanhall",
                    "email": "ridwaanhall.dev@gmail.com"
                },
                "skills": [
                    "Python",
                    "Django",
                    "TensorFlow",
                    "PyTorch",
                    "Flask"
                ],
            }
        ]
