from django.conf import settings

class CertificationsData:
    certifications = [
        {
            "id": 4,
            "title": "Crafting REST APIs with Django",
            "credential_url": "https://www.linkedin.com/learning/certificates/75dfc2562365bbe8c92e2d79c8c8b2ddd5313f935086a44ca98c31d2ce5ef43a",
            "issued": "Dec 2024",
            "institution": "LinkedIn Learning",
            "website": "https://www.linkedin.com/learning",
            "logo": f"{settings.BASE_URL}/static/img/logo/linkedin.webp",
            "is_featured": False,
            "achievements": [
                "Developed RESTful APIs using Django REST Framework following industry best practices",
                "Implemented serializers, filtering, pagination, and router configurations",
                "Deployed secure APIs with authentication and authorization mechanisms"
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
                "Designed machine learning systems utilizing k-NN and Random Forest algorithms",
                "Developed sentiment analysis models using Deep Learning and Support Vector Machines (SVM)",
                "Built recommendation systems with content-based and collaborative filtering techniques"
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
                "Acquired foundational knowledge of data analysis concepts and methodologies",
                "Performed data wrangling and exploratory data analysis (EDA)",
                "Created data visualizations to effectively communicate insights",
                "Developed interactive dashboards using Streamlit"
            ]
        },
        {
            "id": 1,
            "title": "Building a Portfolio with Django",
            "credential_url": "https://www.linkedin.com/learning/certificates/f8a7650056c8c53c7cd79e25aa0f2fe70a23b1fcf6ce9c9b5e5fb8f928b3c9cb",
            "issued": "Oct 2023",
            "institution": "LinkedIn Learning",
            "website": "https://www.linkedin.com",
            "logo": f"{settings.BASE_URL}/static/img/logo/linkedin.webp",
            "is_featured": False,
            "achievements": [
                "Gained proficiency in Django web development",
                "Developed a personal portfolio website",
                "Configured databases and designed user-friendly layouts",
                "Managed URL routing for seamless navigation",
                "Integrated Django projects with PostgreSQL"
            ]
        }
    ]