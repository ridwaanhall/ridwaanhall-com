from django.utils import timezone
import datetime

class AboutData:
    @staticmethod
    def is_working_hours():
        # Get current time in the timezone configured in Django settings
        now = timezone.localtime()
        
        # Define working hours (9 AM to 5 PM, Monday to Friday)
        is_weekday = now.weekday() < 5  # 0-4 are Monday to Friday
        is_work_hour = 9 <= now.hour < 17

        return is_weekday and is_work_hour

    @classmethod
    def get_about_data(cls):
        return [
            {
                "name": "Ridwan Halim",
                "username": "ridwaanhall",
                "image_url": "https://api.slingacademy.com/public/sample-photos/9.jpeg",
                "cv": "https://bit.ly/cv-ridwaanhall",
                "role": "Machine Learning Mentor",
                "location": "Yogyakarta, Indonesia",
                "is_active": cls.is_working_hours(),
                "social_media": {
                    "github": "https://github.com/ridwaanhall",
                    "linkedin": "https://linkedin.com/in/ridwaanhall",
                    "x": "https://x.com/ridwaanhall",
                    "instagram": "https://instagram.com/ridwaanhall",
                    "medium": "https://medium.com/@ridwaanhall",
                    "email": "ridwaanhall.dev@gmail.com"
                }
            }
        ]
