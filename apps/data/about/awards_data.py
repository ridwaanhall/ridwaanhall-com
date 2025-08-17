from django.conf import settings


class AwardsData:
    awards = [
        {
            "id": 1,
            "title": "Certificate of Appreciation for Efforts in Memorizing the Quran",
            "credential_url": "https://drive.google.com/file/d/1-XJlFZzkq00QM9n2m7lh4m641nlT8jod/view",
            "description": "Certificate of Appreciation for Efforts in Memorizing the Quran",
            "issued": {
                "month": "Feb",
                "year": 2020
            },
            "institution": "Islamic Boarding School of Al-Mukmin",
            "website": "https://almukminngruki.or.id/",
            "logo": f"{settings.BASE_URL}/static/img/logo/al_mukmin_ngruki.webp",
        },
        {
            "id": 2,
            "title": "Certificate of Scholarship for Memorizing 10 Juz of the Quran",
            "credential_url": "https://drive.google.com/file/d/1-L8O8h1ErOH2HqKFnMDDVazr-tEpJGEd/view",
            "description": "I was awarded the Tahfidz Scholarship Certificate for memorizing 10 Juz of the Quran after successfully passing the memorization test. This scholarship is a recognition of my dedication and effort in studying the Quran.",
            "issued": {
                "month": "Mar",
                "year": 2020
            },
            "institution": "Islamic Boarding School of Al-Mukmin",
            "website": "https://almukminngruki.or.id/",
            "logo": f"{settings.BASE_URL}/static/img/logo/al_mukmin_ngruki.webp",
        },
        {
            "id": 3,
            "title": "Certificate of Appreciation for Leadership in Imarotu Syu'unith Tholabah (IST)",
            "credential_url": "https://drive.google.com/file/d/1-4ciNM2bKyR9fDWoS8t7gU30vkrqvtVc/view",
            "description": "Awarded for leadership and organizational contributions in IST, a student council-like organization at Al-Mukmin Islamic Boarding School.",
            "issued": {
                "month": "Oct",
                "year": 2020
            },
            "institution": "Islamic Boarding School of Al-Mukmin",
            "website": "https://almukminngruki.or.id/",
            "logo": f"{settings.BASE_URL}/static/img/logo/al_mukmin_ngruki.webp",
        },
        {
            "id": 4,
            "title": "Community Top Voice in Programming",
            "credential_url": "https://www.linkedin.com/in/ridwaanhall/details/honors/",
            "description": "Recognized as a top 5% contributor in Programming on LinkedIn, showcasing expertise and insightful contributions in the field.",
            "issued": {
                "month": "Jul",
                "year": 2024
            },
            "institution": "LinkedIn",
            "website": "https://www.linkedin.com/",
            "logo": f"{settings.BASE_URL}/static/img/logo/linkedin.webp",
        },
        {
            "id": 5,
            "title": "Community Top Voice in Machine Learning",
            "credential_url": "https://www.linkedin.com/in/ridwaanhall/details/honors/",
            "description": "Recognized as a top 5% contributor in Machine Learning on LinkedIn, showcasing expertise and insightful contributions in the field.",
            "issued": {
                "month": "Aug",
                "year": 2024
            },
            "institution": "LinkedIn",
            "website": "https://www.linkedin.com/",
            "logo": f"{settings.BASE_URL}/static/img/logo/linkedin.webp",
        },
        {
            "id": 6,
            "title": "Community Top Voice in Informatics",
            "credential_url": "https://www.linkedin.com/in/ridwaanhall/details/honors/",
            "description": "Recognized as a top 5% contributor in Informatics on LinkedIn, showcasing expertise and insightful contributions in the field.",
            "issued": {
                "month": "Oct",
                "year": 2024
            },
            "institution": "LinkedIn",
            "website": "https://www.linkedin.com/",
            "logo": f"{settings.BASE_URL}/static/img/logo/linkedin.webp",
        },
    ]
