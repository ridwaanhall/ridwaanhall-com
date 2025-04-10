class ExperiencesData:
    '''
    employment type:
    - Full-time (Pekerjaan penuh waktu)
    - Part-time (Pekerjaan paruh waktu)
    - Self-employed (Pekerjaan mandiri)
    - Freelance (Pekerjaan lepas)
    - Contract (Pekerjaan berdasarkan kontrak)
    - Internship (Magang)
    - Apprenticeship (Pelatihan kerja atau magang kejuruan)
    - Seasonal (Pekerjaan musiman)
    
    location type:
    - On-site: Bekerja langsung di lokasi fisik (contoh: kantor).
    - Hybrid: Kombinasi antara bekerja dari lokasi fisik dan jarak jauh.
    - Remote: Sepenuhnya bekerja jarak jauh (contoh: dari rumah).
    '''
    
    employment_types = {
        "ft": "Full-time",
        "pt": "Part-time",
        "se": "Self-employed",
        "fr": "Freelance",
        "co": "Contract",
        "in": "Internship",
        "ap": "Apprenticeship",
        "sn": "Seasonal"
    }
    
    location_types = {
        "on": "On-site",
        "hy": "Hybrid",
        "rm": "Remote"
    }
    
    experiences = [
        {
            "id": 13,
            "title": "Machine Learning Mentor",
            "company": "Coding Camp powered by DBS Foundation",
            "logo": "https://ridwaanhall.me/static/img/logo/coding_camp_dbs_foundation.webp",
            "website": "https://www.dbs.com/spark/index/id_id/site/codingcamp/index.html",
            "period": "Feb 2025 - Present",
            "employment_type": employment_types["pt"],
            "location_type": location_types["rm"],
            "location": "Bandung, Indonesia",
            "is_current": True,
            "responsibilities": [
                "Mentoring a cohort of 25 students (Feb-Jul 2025) through weekly sessions, aiming for a minimum 88% graduation rate.",
                "Allocating 7+ hours per week, leading 1-hour weekly consultations, monitoring progress, and facilitating team-building activities.",
                "Supporting 50-75 students with 2-hour weekly technical and soft skills instruction across merged groups.",
                "Participating in 1.5-hour monthly program meetings and mentor development sessions."
            ]
        },
        {
            "id": 12,
            "title": "Machine Learning Ops Cohort",
            "company": "Coding Camp powered by DBS Foundation",
            "logo": "https://ridwaanhall.me/static/img/logo/coding_camp_dbs_foundation.webp",
            "website": "https://www.dbs.com/spark/index/id_id/site/codingcamp/index.html",
            "period": "Feb 2025 - Present",
            "employment_type": employment_types["ap"],
            "location_type": location_types["rm"],
            "location": "Bandung, Indonesia",
            "period": "Dec 2024 - Jan 2025",
            "is_current": False,
            "responsibilities": [
                "Learned principles of ML Ops for reliable and scalable machine learning systems.",
                "Gained insights into managing ML systems in production environments."
            ]
        },
        {
            "id": 11,
            "title": "Machine Learning Expert Cohort",
            "company": "Coding Camp powered by DBS Foundation",
            "logo": "https://ridwaanhall.me/static/img/logo/coding_camp_dbs_foundation.webp",
            "website": "https://www.dbs.com/spark/index/id_id/site/codingcamp/index.html",
            "period": "Feb 2025 - Present",
            "employment_type": employment_types["ap"],
            "location_type": location_types["rm"],
            "location": "Bandung, Indonesia",
            "period": "Oct 2024 - Dec 2024",
            "is_current": False,
            "responsibilities": [
                "Designed machine learning systems as part of structured projects.",
                "Developed predictive analytics models using algorithms like k-Nearest Neighbor, Random Forest, and AdaBoost.",
                "Built sentiment analysis models with Deep Learning and Support Vector Machine techniques.",
                "Applied computer vision techniques for image recognition and object detection.",
                "Created recommendation systems using Content-based and Collaborative Filtering approaches."
            ]
        },
        {
            "id": 10,
            "title": "Machine Learning Intermediate Cohort",
            "company": "Coding Camp powered by DBS Foundation",
            "logo": "https://ridwaanhall.me/static/img/logo/coding_camp_dbs_foundation.webp",
            "website": "https://www.dbs.com/spark/index/id_id/site/codingcamp/index.html",
            "period": "Feb 2025 - Present",
            "employment_type": employment_types["ap"],
            "location_type": location_types["rm"],
            "location": "Bandung, Indonesia",
            "period": "Jul 2024 - Sep 2024",
            "is_current": False,
            "responsibilities": [
                "Built advanced neural network models using TensorFlow and Keras.",
                "Implemented NLP projects for text classification and sentiment analysis.",
                "Developed deep learning models for time series analysis and image classification.",
                "Explored recommendation systems and reinforcement learning algorithms.",
                "Mastered generative AI concepts and model deployment strategies."
            ]
        },
        {
            "id": 9,
            "title": "Machine Learning Beginner Cohort",
            "company": "Coding Camp powered by DBS Foundation",
            "logo": "https://ridwaanhall.me/static/img/logo/coding_camp_dbs_foundation.webp",
            "website": "https://www.dbs.com/spark/index/id_id/site/codingcamp/index.html",
            "period": "Feb 2025 - Present",
            "employment_type": employment_types["ap"],
            "location_type": location_types["rm"],
            "location": "Bandung, Indonesia",
            "period": "Jan 2024 - Jun 2024",
            "is_current": False,
            "responsibilities": [
                "Learned foundational data visualization techniques using Google Sheets.",
                "Mastered Python basics and object-oriented programming principles.",
                "Studied supervised and unsupervised machine learning algorithms."
            ]
        },
        {
            "id": 8,
            "title": "Founder",
            "company": "Copilot ID",
            "logo": "https://ridwaanhall.me/static/img/logo/copilot_id.webp",
            "website": "https://github.com/copilot-id",
            "period": "Feb 2025 - Present",
            "employment_type": employment_types["ft"],
            "location_type": location_types["hy"],
            "location": "Yogyakarta, Indonesia",
            "period": "Jan 2023 - Present",
            "is_current": True,
            "responsibilities": [
                "Specialized in AI technologies and software frameworks such as Django, TensorFlow, PyTorch, and more."
            ]
        },
        {
            "id": 7,
            "title": "Chief Secretary",
            "company": "IKA-PPIM 2021",
            "logo": "https://ridwaanhall.me/static/img/logo/ikappim_21.webp",
            "website": "https://www.instagram.com/ikappim_21/",
            "period": "Sep 2021 - Present",
            "employment_type": employment_types["pt"],
            "location_type": location_types["rm"],
            "location": "Surakarta, Indonesia",
            "period": "Sep 2021 - Present",
            "is_current": True,
            "responsibilities": [
                "Managed alumni data for over 200 individuals with filtering and graphical analysis.",
                "Prepared organizational documents and meeting summaries.",
                "Created user-friendly design interfaces for alumni management."
            ]
        },
        {
            "id": 6,
            "title": "Assistant Squad Leader of Web Developer Intern",
            "company": "GAOTek Inc.",
            "logo": "https://ridwaanhall.me/static/img/logo/gaotek_inc.webp",
            "website": "https://gaotek.com",
            "period": "Feb 2025 - Present",
            "employment_type": employment_types["in"],
            "location_type": location_types["rm"],
            "location": "New York, USA",
            "period": "Apr 2024 - May 2024",
            "is_current": False,
            "responsibilities": [
                "Guided over 100 interns and ensured timely progress tracking.",
                "Facilitated daily meetings and communication among teams.",
                "Assisted interns with technical and project challenges."
            ]
        },
        {
            "id": 5,
            "title": "Main Team of Web Developer Intern",
            "company": "GAOTek Inc.",
            "logo": "https://ridwaanhall.me/static/img/logo/gaotek_inc.webp",
            "website": "https://gaotek.com",
            "period": "Feb 2025 - Present",
            "employment_type": employment_types["in"],
            "location_type": location_types["rm"],
            "location": "New York, USA",
            "period": "Apr 2024 - May 2024",
            "is_current": False,
            "responsibilities": [
                "Collaborating with the team in weekly meetings to discuss project strategies and updates.",
                "Enhancing skills in Google Search Console, Google Analytics, and Google Tag Manager by completing 3 tasks.",
                "Making reports every Monday to Friday (EST time) for a full 1 month."
            ]
        },
        {
            "id": 4,
            "title": "Web Developer Intern",
            "company": "GAOTek Inc.",
            "logo": "https://ridwaanhall.me/static/img/logo/gaotek_inc.webp",
            "website": "https://gaotek.com",
            "period": "Feb 2025 - Present",
            "employment_type": employment_types["in"],
            "location_type": location_types["rm"],
            "location": "New York, USA",
            "period": "Feb 2024 - Mar 2024",
            "is_current": False,
            "responsibilities": [
                "Actively contribute in team meetings every Monday to Friday at 11.30 PM EST to troubleshoot and update.",
                "Working with WooCommerce on WordPress; adding 30+ products, creating 1 contact form page, 30+ single product pages, and more.",
                "Actively completing 7+ tasks and assignments with faster than other interns in 2 months.",
                "Making reports every Monday to Friday (EST time) for a full 2 months."
            ]
        },
        {
            "id": 3,
            "title": "Machine Learning Intern",
            "company": "YoungDev",
            "logo": "https://ridwaanhall.me/static/img/logo/youngdev.webp",
            "website": "https://youngdevinterns.net",
            "period": "Feb 2025 - Present",
            "employment_type": employment_types["in"],
            "location_type": location_types["rm"],
            "location": "Islamabad, Pakistan",
            "period": "Apr 2024 - May 2024",
            "is_current": False,
            "responsibilities": [
                "Developed predictive models using Python and Scikit-Learn.",
                "Created classification and regression models with high precision and accuracy."
            ]
        },
        {
            "id": 2,
            "title": "Machine Learning Intern",
            "company": "iNeuron.ai",
            "logo": "https://ridwaanhall.me/static/img/logo/ineuron.webp",
            "website": "https://ineuron.ai",
            "period": "Feb 2025 - Present",
            "employment_type": employment_types["in"],
            "location_type": location_types["rm"],
            "location": "Karnataka, India",
            "period": "Jan 2024 - Jan 2024",
            "is_current": False,
            "responsibilities": [
                "Focused on a project related to phishing domain detection.",
                "Applied machine learning principles to enhance cybersecurity solutions."
            ]
        },
        {
            "id": 1,
            "title": "Deputy of Da'wah",
            "company": "Imaarotu Syu'unith Tholabah",
            "logo": "https://ridwaanhall.me/static/img/logo/ist.webp",
            "website": "https://istngruki.org",
            "period": "Feb 2025 - Present",
            "employment_type": employment_types["ft"],
            "location_type": location_types["on"],
            "location": "Surakarta, Indonesia",
            "period": "Sep 2019 - Sep 2020",
            "is_current": False,
            "responsibilities": [
                "Organized 50 Islamic boarding school students for teaching in nearby villages.",
                "Collaborated with other sections to create competitions for over 500 students.",
                "Enhanced the disciplinary environment within the boarding school."
            ]
        }
    ]
