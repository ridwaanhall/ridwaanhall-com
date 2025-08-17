from django.conf import settings

class CertificationsData:
    certifications = [
        {
            "id": 7,
            "title": "Certificate of Appreciation for Machine Learning Mentoring",
            "credential_url": "https://drive.google.com/file/d/1aVSs3pzTtyWama-RojPnNDuAcEyDcq7M/view",
            "issued": {
                "month": "Jul",
                "year": 2025
            },
            "institution": "Coding Camp powered by DBS Foundation",
            "website": "https://go.dbs.com/dbsfcodingcamp",
            "logo": f"{settings.BASE_URL}/static/img/logo/coding_camp_dbs_foundation.webp",
            "is_featured": False,
            "achievements": [
                "Led weekly mentoring for 24 students, achieving a 75% graduation rate with consistent 84% attendance",
                "Designed and delivered alternating sessions on soft and technical skills (2 hours/week) for 50 participants",
                "Managed end-to-end facilitation, including content preparation, moderator coordination, and cohort engagement tracking"
            ]
        },
        {
            "id": 6,
            "title": "Crafting REST APIs with Django",
            "credential_url": "https://www.linkedin.com/learning/certificates/75dfc2562365bbe8c92e2d79c8c8b2ddd5313f935086a44ca98c31d2ce5ef43a",
            "issued": {
                "month": "Dec",
                "year": 2024
            },
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
            "id": 5,
            "title": "Applied Machine Learning",
            "credential_url": "https://www.dicoding.com/certificates/NVP74VLKRPR0",
            "issued": {
                "month": "Dec",
                "year": 2024
            },
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
            "id": 4,
            "title": "Learning Data Analysis with Python",
            "credential_url": "https://www.dicoding.com/certificates/98XW5Q2O0PM3",
            "issued": {
                "month": "Nov",
                "year": 2024
            },
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
            "id": 3,
            "title": "Building a Portfolio with Django",
            "credential_url": "https://www.linkedin.com/learning/certificates/f8a7650056c8c53c7cd79e25aa0f2fe70a23b1fcf6ce9c9b5e5fb8f928b3c9cb",
            "issued": {
                "month": "Oct",
                "year": 2023
            },
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
        },
        {
            "id": 2,
            "title": "Machine Learning Professional Certification",
            "credential_url": "https://drive.google.com/file/d/1him5Eiho1XrzehFnnto7jljCmHh28gXy/view?usp=drive_link",
            "issued": {
                "month": "Jun",
                "year": 2023
            },
            "institution": "Altair RapidMiner",
            "website": "https://academy.rapidminer.com",
            "logo": f"{settings.BASE_URL}/static/img/logo/rapidminer.webp",
            "is_featured": False,
            "achievements": [
                "Verified understanding of machine learning principles using RapidMiner",
                "Completed evaluative quiz covering model training, evaluation, and deployment workflows",
                "Aligned certification with complementary tracks like Machine Learning Master and Data Engineering"
            ]
        },
        {
            "id": 1,
            "title": "Data Engineering Professional Certification",
            "credential_url": "https://drive.google.com/file/d/19lJPN2KB8NCT6koQhIkL0vYu76_Lo2Vm/view?usp=drive_link",
            "issued": {
                "month": "Jan",
                "year": 2023
            },
            "institution": "Altair RapidMiner",
            "website": "https://academy.rapidminer.com",
            "logo": f"{settings.BASE_URL}/static/img/logo/rapidminer.webp",
            "is_featured": False,
            "achievements": [
                "Verified core competencies in data engineering using RapidMiner",
                "Completed evaluative quiz to demonstrate understanding of data workflows",
                "Aligned certification with related tracks such as Machine Learning and Applications & Use Cases"
            ]
        }
    ]