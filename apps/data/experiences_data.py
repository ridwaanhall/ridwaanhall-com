from django.conf import settings

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
            "logo": f"{settings.BASE_URL}/static/img/logo/coding_camp_dbs_foundation.webp",
            "website": "https://www.dbs.com/spark/index/id_id/site/codingcamp/index.html",
            "period": "Feb 2025 - Present",
            "employment_type": employment_types["pt"],
            "location_type": location_types["rm"],
            "location": "Bandung, Indonesia",
            "is_current": True,
            "responsibilities": [
                "Guiding 25 students (Feb-Jul 2025) with weekly sessions to hit an 88% grad rate—let’s get ‘em there!",
                "Dropping 7+ hours a week on 1-hour consults, tracking progress, and hyping up team vibes.",
                "Coaching 50-75 students with 2-hour weekly tech and soft skills classes across groups.",
                "Jumping into 1.5-hour monthly meetings and mentor glow-up sessions."
            ]
        },
        {
            "id": 12,
            "title": "Machine Learning Ops Cohort",
            "company": "Coding Camp powered by DBS Foundation",
            "logo": f"{settings.BASE_URL}/static/img/logo/coding_camp_dbs_foundation.webp",
            "website": "https://www.dbs.com/spark/index/id_id/site/codingcamp/index.html",
            "period": "Dec 2024 - Jan 2025",
            "employment_type": employment_types["ap"],
            "location_type": location_types["rm"],
            "location": "Bandung, Indonesia",
            "is_current": False,
            "responsibilities": [
                "Got the lowdown on ML Ops to build slick, scalable ML systems.",
                "Learned the ropes of running ML in real-world production—game-changer!"
            ]
        },
        {
            "id": 11,
            "title": "Machine Learning Expert Cohort",
            "company": "Coding Camp powered by DBS Foundation",
            "logo": f"{settings.BASE_URL}/static/img/logo/coding_camp_dbs_foundation.webp",
            "website": "https://www.dbs.com/spark/index/id_id/site/codingcamp/index.html",
            "period": "Oct 2024 - Dec 2024",
            "employment_type": employment_types["ap"],
            "location_type": location_types["rm"],
            "location": "Bandung, Indonesia",
            "is_current": False,
            "responsibilities": [
                "Cooked up ML systems for dope projects—full-on problem-solving mode.",
                "Built predictive models with k-Nearest Neighbor, Random Forest, and AdaBoost—nailed it.",
                "Whipped up sentiment analysis using Deep Learning and SVM—pretty slick!",
                "Dabbled in computer vision for image recognition and object detection—mind blown.",
                "Crafted recommendation systems with Content-based and Collaborative Filtering—user vibes on point."
            ]
        },
        {
            "id": 10,
            "title": "Machine Learning Intermediate Cohort",
            "company": "Coding Camp powered by DBS Foundation",
            "logo": f"{settings.BASE_URL}/static/img/logo/coding_camp_dbs_foundation.webp",
            "website": "https://www.dbs.com/spark/index/id_id/site/codingcamp/index.html",
            "period": "Jul 2024 - Sep 2024",
            "employment_type": employment_types["ap"],
            "location_type": location_types["rm"],
            "location": "Bandung, Indonesia",
            "is_current": False,
            "responsibilities": [
                "Built beefy neural nets with TensorFlow and Keras—deep learning FTW!",
                "Tackled NLP for text classification and sentiment analysis—words got no secrets.",
                "Cranked out deep learning models for time series and image classification—smooth.",
                "Explored recommendation systems and reinforcement learning—next-level stuff.",
                "Got cozy with generative AI and model deployment—ready for the real world!"
            ]
        },
        {
            "id": 9,
            "title": "Machine Learning Beginner Cohort",
            "company": "Coding Camp powered by DBS Foundation",
            "logo": f"{settings.BASE_URL}/static/img/logo/coding_camp_dbs_foundation.webp",
            "website": "https://www.dbs.com/spark/index/id_id/site/codingcamp/index.html",
            "period": "Jan 2024 - Jun 2024",
            "employment_type": employment_types["ap"],
            "location_type": location_types["rm"],
            "location": "Bandung, Indonesia",
            "is_current": False,
            "responsibilities": [
                "Kicked off with data viz in Google Sheets—charts never looked so good.",
                "Mastered Python basics and OOP—coding’s my jam now!",
                "Dived into supervised and unsupervised ML algorithms—brain’s buzzing."
            ]
        },
        {
            "id": 8,
            "title": "Founder",
            "company": "Copilot ID",
            "logo": f"{settings.BASE_URL}/static/img/logo/copilot_id.webp",
            "website": "https://github.com/copilot-id",
            "period": "Jan 2023 - Present",
            "employment_type": employment_types["ft"],
            "location_type": location_types["hy"],
            "location": "Yogyakarta, Indonesia",
            "is_current": True,
            "responsibilities": [
                "Living that AI life, building with Django, TensorFlow, PyTorch, and more—full-stack geek mode!"
            ]
        },
        {
            "id": 7,
            "title": "Chief Secretary",
            "company": "IKA-PPIM 2021",
            "logo": f"{settings.BASE_URL}/static/img/logo/ikappim_21.webp",
            "website": "https://www.instagram.com/ikappim_21/",
            "period": "Sep 2021 - Present",
            "employment_type": employment_types["pt"],
            "location_type": location_types["rm"],
            "location": "Surakarta, Indonesia",
            "is_current": True,
            "responsibilities": [
                "Wrangled data for 200+ alumni with slick filtering and dope graphs.",
                "Whipped up org docs and meeting notes—keeping it tight.",
                "Designed clean, user-friendly interfaces for alumni management—UX vibes!"
            ]
        },
        {
            "id": 6,
            "title": "Assistant Squad Leader of Web Developer Intern",
            "company": "GAOTek Inc.",
            "logo": f"{settings.BASE_URL}/static/img/logo/gaotek_inc.webp",
            "website": "https://gaotek.com",
            "period": "Apr 2024 - May 2024",
            "employment_type": employment_types["in"],
            "location_type": location_types["rm"],
            "location": "New York, USA",
            "is_current": False,
            "responsibilities": [
                "Led 100+ interns, keeping everyone on track like a pro.",
                "Ran daily huddles and kept the team vibe strong.",
                "Helped interns crush tech and project hurdles—teamwork makes the dream work!"
            ]
        },
        {
            "id": 5,
            "title": "Main Team of Web Developer Intern",
            "company": "GAOTek Inc.",
            "logo": f"{settings.BASE_URL}/static/img/logo/gaotek_inc.webp",
            "website": "https://gaotek.com",
            "period": "Apr 2024 - May 2024",
            "employment_type": employment_types["in"],
            "location_type": location_types["rm"],
            "location": "New York, USA",
            "is_current": False,
            "responsibilities": [
                "Jammed with the crew weekly to plan projects and swap ideas.",
                "Leveled up on Google Search Console, Analytics, and Tag Manager with 3 solid tasks.",
                "Dropped reports every weekday for a month—kept it consistent!"
            ]
        },
        {
            "id": 4,
            "title": "Web Developer Intern",
            "company": "GAOTek Inc.",
            "logo": f"{settings.BASE_URL}/static/img/logo/gaotek_inc.webp",
            "website": "https://gaotek.com",
            "period": "Feb 2024 - Mar 2024",
            "employment_type": employment_types["in"],
            "location_type": location_types["rm"],
            "location": "New York, USA",
            "is_current": False,
            "responsibilities": [
                "Joined late-night team huddles (11:30 PM EST) to debug and plan—grind mode!",
                "Went ham on WooCommerce—added 30+ products, built a contact form, and 30+ product pages.",
                "Smashed 7+ tasks faster than most interns in just 2 months.",
                "Churned out daily reports for 2 months—never missed a beat!"
            ]
        },
        {
            "id": 3,
            "title": "Machine Learning Intern",
            "company": "YoungDev",
            "logo": f"{settings.BASE_URL}/static/img/logo/youngdev.webp",
            "website": "https://youngdevinterns.net",
            "period": "Apr 2024 - May 2024",
            "employment_type": employment_types["in"],
            "location_type": location_types["rm"],
            "location": "Islamabad, Pakistan",
            "is_current": False,
            "responsibilities": [
                "Built predictive models with Python and Scikit-Learn—data’s my playground.",
                "Cooked up classification and regression models that hit the mark!"
            ]
        },
        {
            "id": 2,
            "title": "Machine Learning Intern",
            "company": "iNeuron.ai",
            "logo": f"{settings.BASE_URL}/static/img/logo/ineuron.webp",
            "website": "https://ineuron.ai",
            "period": "Jan 2024 - Jan 2024",
            "employment_type": employment_types["in"],
            "location_type": location_types["rm"],
            "location": "Karnataka, India",
            "is_current": False,
            "responsibilities": [
                "Tackled a phishing domain detection project—cybersecurity meets ML!",
                "Used ML to beef up online defenses—pretty dope mission."
            ]
        },
        {
            "id": 1,
            "title": "Deputy of Da'wah",
            "company": "Imaarotu Syu'unith Tholabah",
            "logo": f"{settings.BASE_URL}/static/img/logo/ist.webp",
            "website": "https://istngruki.org",
            "period": "Sep 2019 - Sep 2020",
            "employment_type": employment_types["ft"],
            "location_type": location_types["on"],
            "location": "Surakarta, Indonesia",
            "is_current": False,
            "responsibilities": [
                "Rallied 50 boarding school students to teach in local villages—community vibes!",
                "Teamed up to run epic competitions for 500+ students—energy was unreal.",
                "Kept the boarding school’s discipline game tight and inspiring."
            ]
        }
    ]
