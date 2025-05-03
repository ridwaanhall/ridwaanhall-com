from django.conf import settings

class CertificationsData:
    certifications = [
        {
            "id": 4,
            "title": "Crafting Slick REST APIs with Django",
            "credential_url": "https://www.linkedin.com/learning/certificates/75dfc2562365bbe8c92e2d79c8c8b2ddd5313f935086a44ca98c31d2ce5ef43a",
            "issued": "Dec 2024",
            "institution": "LinkedIn Learning",
            "website": "https://www.linkedin.com/learning",
            "logo": f"{settings.BASE_URL}/static/img/logo/linkedin.webp",
            "is_featured": False,
            "achievements": [
                "Built REST APIs with Django REST Framework like a pro, following best practices",
                "Nailed serializers, filtering, pagination, and router setups",
                "Deployed secure APIs with full authentication and authorization"
            ]
        },
        {
            "id": 3,
            "title": "Applied Machine Learning",
            "credential_url": "https://www.dicoding.com/certificates/NVP74VLKRPR0",
            "issued": "Dec 2024",
            "institution": "Dicoding Indonesia",
            "website": "https://www.dicoding.com",
            "logo": f"{settings.BASE_URL}/static/img/logo/dicoding.webp",
            "is_featured": False,
            "achievements": [
                "Designed ML systems using k-NN and Random Forest algorithms",
                "Created sentiment analysis models with Deep Learning and SVM",
                "Built recommendation systems with content-based and collaborative filtering"
            ]
        },
        {
            "id": 2,
            "title": "Learning Data Analysis with Python",
            "credential_url": "https://www.dicoding.com/certificates/98XW5Q2O0PM3",
            "issued": "Nov 2024",
            "institution": "Dicoding Indonesia",
            "website": "https://www.dicoding.com",
            "logo": f"{settings.BASE_URL}/static/img/logo/dicoding.webp",
            "is_featured": False,
            "achievements": [
                "Get the basics of data analysis and how it works",
                "Rock data wrangling and dive into exploratory data analysis (EDA)",
                "Nail data viz tricks to show off insights like a pro",
                "Build dope interactive dashboards with Streamlit"
            ]
        },
        {
            "id": 1,
            "title": "Building a Dope Portfolio with Django",
            "credential_url": "https://www.linkedin.com/learning/certificates/f8a7650056c8c53c7cd79e25aa0f2fe70a23b1fcf6ce9c9b5e5fb8f928b3c9cb",
            "issued": "Oct 2023",
            "institution": "LinkedIn Learning",
            "website": "https://www.linkedin.com",
            "logo": f"{settings.BASE_URL}/static/img/logo/linkedin.webp",
            "is_featured": False,
            "achievements": [
                "Got the hang of Django for web development from scratch",
                "Built a personal portfolio site that pops",
                "Set up a database and designed a clean layout",
                "Tweaked URL paths for smooth navigation",
                "Hooked up the Django project to Postgres like a boss"
            ]
        }
    ]