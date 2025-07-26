from django.conf import settings

class EducationData:
    education = [
        {
            "degree": "Informatics in Intelligence Systems (S.Kom.)",
            "alias": "Bachelor of Computer Science",
            "date": {
                "start": {
                    "year": 2021,
                    "month": "Sep"
                },
                "end": {
                    "year": 2025,
                    "month": "Aug"
                }
            },
            "institution": "Universitas Teknologi Yogyakarta",
            "website": "https://uty.ac.id/",
            "logo": f"{settings.BASE_URL}/static/img/logo/uty.webp",
            "is_last": True,
            "location": {
                "regency": "Sleman",
                "province": "Special Region of Yogyakarta",
                "prov": "Yogyakarta",
                "country": "Indonesia",
                "flag": "🇮🇩",
                "map_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.1386717050764!2d110.35389748855174!3d-7.747286929566545!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a58f2d747cc8d%3A0xba7c703a016a750e!2sUniversity%20of%20Technology%20Yogyakarta!5e1!3m2!1sen!2sid!4v1746378720413!5m2!1sen!2sid"
            },
            "achievements": [
                "Established foundational proficiency in algorithms and object-oriented programming.",
                "Developed interactive web applications through hands-on coursework and practical implementation.",
                "Analyzed large datasets and applied data analytics techniques to derive actionable insights.",
                "Enhanced understanding of Machine Learning concepts and gained exposure to Augmented Reality technologies.",
                "Mastered core concepts of data structures, algorithms, and neural networks through applied projects."
            ]
        },
        {
            "degree": "Senior High School (Natural Science)",
            "years": "2018 - 2021",
            "institution": "MAS Al Mukmin Ngruki",
            "website": "https://almukminngruki.or.id/",
            "logo": f"{settings.BASE_URL}/static/img/logo/al_mukmin_ngruki.webp",
            "is_last": False,
            "location": {
                "regency": "Surakarta",
                "province": "Central Java",
                "prov": "Central Java",
                "country": "Indonesia",
                "flag": "🇮🇩",
                "map_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d839.8902086006083!2d110.81010211911801!3d-7.583671478356138!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a161053e2e49b%3A0xa3c304c347094dd4!2sPondok%20Pesantren%20Al%20Mukmin!5e1!3m2!1sen!2sid!4v1746378601521!5m2!1sen!2sid"
            },
            "achievements": [
                "Demonstrated strong discipline and commitment by memorizing the Qur’an and consistently engaging in daily recitation.",
                "Actively participated in outdoor and community-based activities, fostering teamwork and resilience.",
                "Achieved near-completion of full Qur’an memorization, reflecting dedication and spiritual focus.",
                "Joined Santri Pecinta Alam (SAPALA KAMUFISA), contributing to nature-based programs and environmental engagement."
            ]
        },
        {
            "degree": "Junior High School",
            "years": "2015 - 2018",
            "institution": "MTsS Islam Ngruki",
            "website": "https://almukminngruki.or.id/",
            "logo": f"{settings.BASE_URL}/static/img/logo/al_mukmin_ngruki.webp",
            "is_last": False,
            "location": {
                "regency": "Surakarta",
                "province": "Central Java",
                "prov": "Central Java",
                "country": "Indonesia",
                "flag": "🇮🇩",
                "map_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d839.8902086006083!2d110.81010211911801!3d-7.583671478356138!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a161053e2e49b%3A0xa3c304c347094dd4!2sPondok%20Pesantren%20Al%20Mukmin!5e1!3m2!1sen!2sid!4v1746378601521!5m2!1sen!2sid"
            },
              "achievements": [
                "Maintained consistent Qur’an recitation during designated prayer times, demonstrating spiritual discipline and dedication.",
                "Practiced archery and actively contributed to peer learning through sharing Islamic knowledge.",
                "Initiated web development journey by building foundational projects using HTML, CSS, and PHP."
            ]
        },
        {
            "degree": "Elementary School",
            "years": "2009 - 2015",
            "institution": "SD IT Al Mannan",
            "logo": f"{settings.BASE_URL}/static/img/logo/sdit_al_mannan.webp",
            "is_last": False,
            "location": {
                "regency": "Boyolali",
                "province": "Central Java",
                "prov": "Central Java",
                "country": "Indonesia",
                "flag": "🇮🇩",
                "map_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d839.8741719724507!2d110.63054034044244!3d-7.540896804194124!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a6bf96222c533%3A0x1eac3559e081d4e2!2sSDIT%20Al%20Mannan%20Mojosongo!5e1!3m2!1sen!2sid!4v1746378437547!5m2!1sen!2sid"
            },
              "achievements": [
                "Established a consistent routine of performing daily prayers and post-salah supplications, demonstrating spiritual discipline from an early stage.",
                "Successfully memorized Juz 30 and significant portions of Juz 29, reflecting dedication and commitment to Qur’anic studies.",
                "Engaged deeply with Islamic history and prophetic narratives, enriching religious understanding and cultural awareness."
            ]
        },
        {
            "degree": "Kindergarten",
            "years": "2007 - 2009",
            "institution": "TK IT Al Mannan",
            "logo": f"{settings.BASE_URL}/static/img/logo/tkit_al_mannan_ori.webp",
            "is_last": False,
            "location": {
                "regency": "Boyolali",
                "province": "Central Java",
                "prov": "Central Java",
                "country": "Indonesia",
                "flag": "🇮🇩",
                "map_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1009.2575066395403!2d110.63296114927637!3d-7.544367428472007!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a6b777ddce74d%3A0x5963db2cb6db1f07!2sTKIT%20AL-MANNAN!5e1!3m2!1sen!2sid!4v1746378514204!5m2!1sen!2sid"
            },
              "achievements": [
                "Established the habit of performing daily prayers, demonstrating spiritual growth and discipline.",
                "Successfully memorized several short Qur’anic surahs during early education, reflecting commitment to religious learning.",
                "Improved vocabulary in Arabic and English through consistent practice and immersive learning experiences."
            ]
        }
    ]
