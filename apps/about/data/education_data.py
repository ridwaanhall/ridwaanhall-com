from __future__ import annotations

from dataclasses import asdict

from django.conf import settings

from apps.about.types import Education, EducationDate, EducationLocation, PeriodDate


class EducationData:
    education = [
        asdict(Education(
            degree="Informatics in Intelligence Systems (S.Kom.)",
            alias="Bachelor of Computer Science",
            date=EducationDate(
                start=PeriodDate(year=2021, month="Sep"),
                end=PeriodDate(year=2025, month="Aug"),
            ),
            institution="Universitas Teknologi Yogyakarta",
            website="https://uty.ac.id/",
            logo=f"{settings.BASE_URL}/static/img/logo/uty.webp",
            is_last=True,
            location=EducationLocation(
                regency="Sleman",
                province="Special Region of Yogyakarta",
                prov="Yogyakarta",
                country="Indonesia",
                flag="🇮🇩",
            ),
            achievements=[
                "Established foundational proficiency in algorithms and object-oriented programming.",
                "Developed interactive web applications through hands-on coursework and practical implementation.",
                "Analyzed large datasets and applied data analytics techniques to derive actionable insights.",
                "Enhanced understanding of Machine Learning concepts and gained exposure to Augmented Reality technologies.",
                "Mastered core concepts of data structures, algorithms, and neural networks through applied projects."
            ],
        )),
        asdict(Education(
            degree="Senior High School (Natural Science)",
            years="2018 - 2021",
            institution="MAS Al Mukmin Ngruki",
            website="https://almukminngruki.or.id/",
            logo=f"{settings.BASE_URL}/static/img/logo/al_mukmin_ngruki.webp",
            is_last=False,
            location=EducationLocation(
                regency="Surakarta",
                province="Central Java",
                prov="Central Java",
                country="Indonesia",
                flag="🇮🇩",
            ),
            achievements=[
                "Demonstrated strong discipline and commitment by memorizing the Qur’an and consistently engaging in daily recitation.",
                "Actively participated in outdoor and community-based activities, fostering teamwork and resilience.",
                "Achieved near-completion of full Qur’an memorization, reflecting dedication and spiritual focus.",
                "Joined Santri Pecinta Alam (SAPALA KAMUFISA), contributing to nature-based programs and environmental engagement."
            ],
        )),
        asdict(Education(
            degree="Junior High School",
            years="2015 - 2018",
            institution="MTsS Islam Ngruki",
            website="https://almukminngruki.or.id/",
            logo=f"{settings.BASE_URL}/static/img/logo/al_mukmin_ngruki.webp",
            is_last=False,
            location=EducationLocation(
                regency="Surakarta",
                province="Central Java",
                prov="Central Java",
                country="Indonesia",
                flag="🇮🇩",
            ),
            achievements=[
                "Maintained consistent Qur’an recitation during designated prayer times, demonstrating spiritual discipline and dedication.",
                "Practiced archery and actively contributed to peer learning through sharing Islamic knowledge.",
                "Initiated web development journey by building foundational projects using HTML, CSS, and PHP."
            ],
        )),
        asdict(Education(
            degree="Elementary School",
            years="2009 - 2015",
            institution="SD IT Al Mannan",
            logo=f"{settings.BASE_URL}/static/img/logo/sdit_al_mannan.webp",
            is_last=False,
            location=EducationLocation(
                regency="Boyolali",
                province="Central Java",
                prov="Central Java",
                country="Indonesia",
                flag="🇮🇩",
            ),
            achievements=[
                "Established a consistent routine of performing daily prayers and post-salah supplications, demonstrating spiritual discipline from an early stage.",
                "Successfully memorized Juz 30 and significant portions of Juz 29, reflecting dedication and commitment to Qur’anic studies.",
                "Engaged deeply with Islamic history and prophetic narratives, enriching religious understanding and cultural awareness."
            ],
        )),
        asdict(Education(
            degree="Kindergarten",
            years="2007 - 2009",
            institution="TK IT Al Mannan",
            logo=f"{settings.BASE_URL}/static/img/logo/tkit_al_mannan_ori.webp",
            is_last=False,
            location=EducationLocation(
                regency="Boyolali",
                province="Central Java",
                prov="Central Java",
                country="Indonesia",
                flag="🇮🇩",
            ),
            achievements=[
                "Established the habit of performing daily prayers, demonstrating spiritual growth and discipline.",
                "Successfully memorized several short Qur’anic surahs during early education, reflecting commitment to religious learning.",
                "Improved vocabulary in Arabic and English through consistent practice and immersive learning experiences."
            ],
        )),
    ]
