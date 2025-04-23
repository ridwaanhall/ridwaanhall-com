from django.conf import settings
from datetime import datetime

class ProjectsData:
    '''
    projects maximum is featured true is 3
    '''
    
    tech_stack = {
        "python": {
            "name": "Python",
            "description": "My go-to for building robust backends with clean code"
        },
        "django": {
            "name": "Django",
            "description": "The web framework I use to whip up solid backend apps fast"
        },
        "tailwindcss": {
            "name": "TailwindCSS",
            "description": "Sleek utility-first CSS to make frontends look sharp"
        },
        "vercel": {
            "name": "Vercel",
            "description": "My pick for seamless serverless hosting and deployments"
        },
        "github_api": {
            "name": "GitHub API",
            "description": "Grabs project stats and activity straight from my repos"
        },
        "wakatime_api": {
            "name": "WakaTime API",
            "description": "Tracks my coding hours and analytics like a pro"
        },
        "bootstrap": {
            "name": "Bootstrap",
            "description": "Handy CSS framework for quick, responsive designs"
        },
        "machine_learning": {
            "name": "Machine Learning",
            "description": "Crunching data with algorithms to predict and analyze stuff"
        },
        "music_recommendation": {
            "name": "Music Recommendation Algorithms",
            "description": "Suggests tunes based on what you vibe with"
        },
        "rest_api": {
            "name": "REST API",
            "description": "The blueprint for smooth, networked app communication"
        },
        "nextjs": {
            "name": "Next.js",
            "description": "React framework for fast, server-rendered web apps"
        },
        "shadcn_ui": {
            "name": "Shadcn UI",
            "description": "Modern UI components to craft clean, stylish interfaces"
        },
        "javascript": {
            "name": "JavaScript",
            "description": "Brings the web to life with interactive magic"
        },
        "css": {
            "name": "CSS",
            "description": "Styles web pages to look good and feel right"
        },
        "streamlit": {
            "name": "Streamlit",
            "description": "Turns Python into slick data dashboards and apps"
        },
        "tensorflow": {
            "name": "TensorFlow",
            "description": "My toolkit for diving deep into ML and neural networks"
        },
        "once_ui": {
            "name": "Once UI",
            "description": "Design system for building modern, polished web apps"
        },
        "typescript": {
            "name": "TypeScript",
            "description": "JavaScript with guardrails for cleaner, typed code"
        },
        "scss": {
            "name": "SCSS",
            "description": "Supercharged CSS with variables and nesting for style"
        },
        "mdx": {
            "name": "MDX",
            "description": "Mixes Markdown with JSX for dynamic docs"
        },
        "vercel_postgres": {
            "name": "Vercel Postgres",
            "description": "Managed Postgres database that’s easy to scale"
        },
        "radix_ui": {
            "name": "Radix UI",
            "description": "Low-level UI components for accessible, custom designs"
        },
        "bulma": {
            "name": "Bulma",
            "description": "Flexbox-based CSS for responsive, clean layouts"
        },
        "whitenoise": {
            "name": "Whitenoise",
            "description": "Serves Django static files like a charm"
        },
        "cloudflare": {
            "name": "Cloudflare",
            "description": "Speeds up sites and keeps them safe with CDN and security"
        },
        "django_rest_framework": {
            "name": "Django REST Framework",
            "description": "My toolkit for crafting powerful APIs in Django"
        },
        "BeautifulSoup": {
            "name": "BeautifulSoup",
            "description": "Web scraping made easy with Python"
        },
        "adminlte": {
            "name": "AdminLTE",
            "description": "Sleek admin dashboard template for web apps"
        },
        "flask": {
            "name": "Flask",
            "description": "Lightweight web framework for Python, perfect for APIs"
        },
        "openai_api": {
            "name": "OpenAI API",
            "description": "Integrate AI capabilities into your apps with ease"
        },
        "google_maps": {
            "name": "Google Maps",
            "description": "Brings maps and location data to your web apps"
        },
        "leaflet": {
            "name": "Leaflet",
            "description": "Interactive maps for web apps, easy to use and customize"
        },
        "chartjs": {
            "name": "Chart.js",
            "description": "Simple yet flexible JavaScript charts for data visualization"
        },
        "datatables": {
            "name": "DataTables",
            "description": "Enhances HTML tables with sorting, searching, and pagination"
        },
        "openstreetmap": {
            "name": "OpenStreetMap",
            "description": "Free, editable map of the world, perfect for web apps"
        },
        "telegram_api": {
            "name": "Telegram API",
            "description": "Connects your apps to Telegram for messaging and bots"
        },
        "whatsapp_api": {
            "name": "WhatsApp API",
            "description": "Integrate WhatsApp messaging into your applications"
        },
        "jwt": {
            "name": "JWT",
            "description": "Securely transmit information between parties as a JSON object"
        },
        "sqlalchemy": {
            "name": "SQLAlchemy",
            "description": "Python SQL toolkit and Object-Relational Mapping (ORM) system"
        },
        "flask_mail": {
            "name": "Flask-Mail",
            "description": "Email support for Flask applications"
        },
        "sqlite": {
            "name": "SQLite",
            "description": "Lightweight database for quick and easy data storage"
        },
        "neural_networks": {
            "name": "Neural Networks",
            "description": "AI models that mimic the human brain for complex tasks"
        },
        "gui_framework": {
            "name": "GUI Framework",
            "description": "Framework for building graphical user interfaces"
        },
        "pytorch": {
            "name": "PyTorch",
            "description": "Open-source machine learning library for Python, great for deep learning"
        },
        "rnn": {
            "name": "RNN",
            "description": "Recurrent Neural Networks for sequence prediction tasks"
        },
        "lstm": {
            "name": "LSTM",
            "description": "Long Short-Term Memory networks for time series and sequence data"
        },
        "cnn": {
            "name": "CNN",
            "description": "Convolutional Neural Networks for image processing and recognition"
        },
        "gru": {
            "name": "GRU",
            "description": "Gated Recurrent Units for efficient sequence modeling"
        },
        "timm": {
            "name": "timm",
            "description": "PyTorch image models library with pre-trained models"
        },
        "hog": {
            "name": "HOG",
            "description": "Histogram of Oriented Gradients for object detection"
        },
        "svm": {
            "name": "SVM",
            "description": "Support Vector Machines for classification and regression tasks"
        },
        "knn": {
            "name": "KNN",
            "description": "K-Nearest Neighbors for classification based on distance metrics"
        },
        "aco": {
            "name": "ACO",
            "description": "Ant Colony Optimization for solving computational problems"
        },
        "numpy": {
            "name": "NumPy",
            "description": "Fundamental package for scientific computing with Python"
        },
        "matplotlib": {
            "name": "Matplotlib",
            "description": "Plotting library for creating static, animated, and interactive visualizations"
        },
        "seaborn": {
            "name": "Seaborn",
            "description": "Statistical data visualization library based on Matplotlib"
        },
    }
    
    projects = [
        {
            "id": 1,
            "title": "MLBB Username Finder",
            "headline": "Snag Mobile Legends usernames in a snap with Python and API vibes.",
            "description": [
                "This Python project is your go-to for grabbing Mobile Legends usernames like a pro.",
                "Just pop in a user ID and zone ID, and boom—our API hooks you up with the player's username.",
                "Light, fast, and a total game-changer for MLBB fans."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_username_checker.webp",
            "img_name": "mlbb_username_checker.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Lightning-Fast Lookups",
                    "description": "Get usernames in a flash with just a user ID and zone ID."
                },
                {
                    "title": "Python-Powered Swagger",
                    "description": "Rocking Python for speed and smooth performance."
                },
                {
                    "title": "API Awesomeness",
                    "description": "Taps into APIs for spot-on, reliable data."
                }
            ],
            "tech_stack": [
                tech_stack["python"]
            ],
            "updated_at": datetime.strptime("2023-03-30T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 2,
            "title": "TikTok Profile Digger",
            "headline": "Scoop all the hot TikTok profile deets with Python and BeautifulSoup flair.",
            "description": [
                "This Python project dives deep into TikTok profiles, snagging all the good stuff.",
                "With BeautifulSoup, it pulls username, bio, followers, following, and likes straight from the page.",
                "Perfect for data nerds and TikTok stalkers—saves time and sparks curiosity!"
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/tiktok_data_extractor.webp",
            "img_name": "tiktok_data_extractor.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Ultimate Data Grab",
                    "description": "Snatches username, bio, followers, following, and likes in one swoop."
                },
                {
                    "title": "BeautifulSoup Magic",
                    "description": "Parses TikTok’s HTML like a boss with BeautifulSoup."
                },
                {
                    "title": "Curiosity Crusher",
                    "description": "Ideal for research, insights, or just feeding your TikTok obsession."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["BeautifulSoup"]
            ],
            "updated_at": datetime.strptime("2023-04-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 3,
            "title": "Quran Explorer Web",
            "headline": "Dive into the Quran with a sleek, modern twist—holy wisdom meets dope tech.",
            "description": [
                "This Flask-powered site lets you explore Quran chapters, verses, and translations with style.",
                "Rocking AdminLTE for a slick look and feel, it’s as functional as it is beautiful.",
                "Pulls legit data from quranenc.com and quran.api-docs.io for a deep, trustworthy experience."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/quran_website_frontend_api.webp",
            "img_name": "quran_website_frontend_api.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Killer APIs",
                    "description": "Drops endpoints for chapters, Juz, verses, and translations like a champ."
                },
                {
                    "title": "Script Swag",
                    "description": "Get verses in Uthmani, Uthmani Simple, Imlaei, or Imlaei Simple—your call."
                },
                {
                    "title": "Translation Hunt",
                    "description": "Zero in on translations by chapter, Surah, Aya, or keyword."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"],
                tech_stack["adminlte"]
            ],
            "updated_at": datetime.strptime("2023-07-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 4,
            "title": "BMKG Weather & Quake Tracker",
            "headline": "Stay woke with real-time weather and quake updates, served fresh by Flask.",
            "description": [
                "This Flask and AdminLTE combo dishes out live weather forecasts and earthquake alerts.",
                "Data comes straight from BMKG, so you know it’s legit and on point.",
                "From Yogyakarta’s skies to the latest tremors, this tool’s got you covered."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/bmkg_weather_quake_hub.webp",
            "img_name": "bmkg_weather_quake_hub.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Live Weather Vibes",
                    "description": "Check 3-day forecasts with wind speed, direction, and more."
                },
                {
                    "title": "Quake Watch",
                    "description": "Stay in the loop with the latest earthquake updates from BMKG."
                },
                {
                    "title": "Indonesia Focus",
                    "description": "Tailored for local data, keeping it real and relevant."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"],
                tech_stack["adminlte"]
            ],
            "updated_at": datetime.strptime("2023-07-30T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 5,
            "title": "BMKG Weather Pro",
            "headline": "Your VIP pass to Indonesia’s weather scene, powered by Flask and BMKG.",
            "description": [
                "This Flask project hooks you up with detailed weather forecasts from BMKG’s database.",
                "Filter by region, parameter, or time range to get exactly what you need.",
                "From Aceh to Papua, it’s your one-stop shop for reliable weather intel."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/bmkg_weather_forecast_api.webp",
            "img_name": "bmkg_weather_forecast_api.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Nationwide Reach",
                    "description": "Covers weather data for every corner of Indonesia."
                },
                {
                    "title": "Flexi-Filters",
                    "description": "Mix and match area, parameter, and time for custom results."
                },
                {
                    "title": "Flask Flow",
                    "description": "Smooth routing and fast data handling with Flask."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"]
            ],
            "updated_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 6,
            "title": "MLBB Stats & Winrate API",
            "headline": "Level up with MLBB player stats and winrates, served hot by Flask.",
            "description": [
                "This Flask API is your ticket to Mobile Legends data—usernames, MPL stats, winrates, and more.",
                "Pulls info from mainlagiaja.com, id-mpl.com, takapadia.com, plus some custom flair I cooked up.",
                "A must-have for devs and gamers who want MLBB stats without the grind."
            ],
            "demo_url": "https://mlbb-api.ridwaanhall.repl.co",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_game_stats_api.webp",
            "img_name": "mlbb_game_stats_api.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Username Grabber",
                    "description": "Scoop up player usernames fast via mainlagiaja.com’s API."
                },
                {
                    "title": "MPL Stats Connect",
                    "description": "Dives into id-mpl.com for juicy stats and insights."
                },
                {
                    "title": "Winrate Wizard",
                    "description": "Cranks out accurate winrates using takapadia.com data."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"]
            ],
            "updated_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 7,
            "title": "Insta Media Grabber API",
            "headline": "Yo, snatch Instagram pics, stories, and posts in HD with Flask and save-free.com.",
            "description": [
                "This Flask-powered API is your ticket to downloading Instagram profile pics, stories, and post media in crisp HD.",
                "Taps into save-free.com for legit, reliable media fetching without the fuss.",
                "Perfect for quick, no-sweat media downloads that keep things smooth."
            ],
            "demo_url": "https://instagram-api-v1.ridwaanhall.repl.co/",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/instagram_media_downloader.webp",
            "img_name": "instagram_media_downloader.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "HD Profile Pics",
                    "description": "Grab crystal-clear profile pictures in a snap."
                },
                {
                    "title": "Story Swiper",
                    "description": "Download Instagram stories like it’s nothing."
                },
                {
                    "title": "Post Media Magic",
                    "description": "Scoop up images and videos from posts in a heartbeat."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"]
            ],
            "updated_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 8,
            "title": "BMKG Quake Watcher API (Unofficial)",
            "headline": "Stay in the loop with real-time earthquake and tsunami updates via Flask.",
            "description": [
                "This Flask-based API dishes out earthquake data in XML, JSON, and GeoJSON formats, no cap.",
                "Covers quakes over 5 magnitude, recent tremors, tsunami alerts, and seismic news.",
                "A must-have for researchers, devs, or anyone vibing with quake info."
            ],
            "demo_url": "https://earthquake-bmkg-api.ridwaanhall.repl.co",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/bmkg_quake_tracker_api.webp",
            "img_name": "bmkg_quake_tracker_api.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Flexi-Format Data",
                    "description": "Grab quake info in XML, JSON, or GeoJSON—your pick."
                },
                {
                    "title": "Live Alerts",
                    "description": "Stay woke with real-time tsunami and seismic updates."
                },
                {
                    "title": "Data Deep Dive",
                    "description": "Get magnitude, location, PGA Max, MMI, and more."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"]
            ],
            "updated_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 9,
            "title": "College Data Scout API (Unofficial PDDIKTI)",
            "headline": "Dig into Indonesian college stats like a pro with this Flask-powered API.",
            "description": [
                "This Flask API is your go-to for snagging data on Indonesian colleges, students, lecturers, and programs.",
                "Easily pull student names, IDs, lecturer profiles, or program details in a snap.",
                "Perfect for researchers or devs who want quick, clean access to higher ed data."
            ],
            "github_url": "https://replit.com/@ridwaanhall/college-data",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/college_insights_api.webp",
            "img_name": "college_insights_api.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Student Scoop",
                    "description": "Fetch names, IDs, and more for students."
                },
                {
                    "title": "Lecturer Lowdown",
                    "description": "Grab lecturer names, IDs, and profiles."
                },
                {
                    "title": "Program Playbook",
                    "description": "Dive into study programs and college details."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"]
            ],
            "updated_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 10,
            "title": "ChatBot Bridge for Telegram & WhatsApp",
            "headline": "Link up OpenAI-powered bots to Telegram and WhatsApp with Flask swagger.",
            "description": [
                "This Flask project is your slick gateway for handling Telegram and WhatsApp messages with POST and GET requests.",
                "Taps into OpenAI for next-level, smart convo vibes.",
                "Perfect for automating chats or building brainy bot solutions."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/chatbot_gateway.webp",
            "img_name": "chatbot_gateway.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Flask Flow",
                    "description": "Routes messages like a boss for seamless bot chats."
                },
                {
                    "title": "App-Agnostic",
                    "description": "Works like a charm on Telegram and WhatsApp."
                },
                {
                    "title": "OpenAI Smarts",
                    "description": "Drops AI-powered replies for sharper convos."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"],
                tech_stack["openai_api"]
            ],
            "updated_at": datetime.strptime("2023-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 11,
            "title": "Tsunami & Quake Dashboard",
            "headline": "Track Indonesia’s quakes and tsunami alerts with real-time flair.",
            "description": [
                "This Flask frontend serves up earthquake and tsunami data straight from BMKG, no filter.",
                "With Chart.js visuals, Leaflet maps, OpenStreetMap, and Google Maps, it’s a seismic data party.",
                "Rocking Bootstrap and OverlayScrollbars for a clean, responsive vibe."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/inatews_dashboard.webp",
            "img_name": "inatews_dashboard.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Live Quake Data",
                    "description": "Get historical and real-time earthquake info from BMKG."
                },
                {
                    "title": "Tsunami Heads-Up",
                    "description": "Stay alert with live tsunami warnings across Indonesia."
                },
                {
                    "title": "Visual Feast",
                    "description": "Interactive maps, shakemaps, and charts for epic insights."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"],
                tech_stack["bootstrap"],
                tech_stack["leaflet"],
                tech_stack["chartjs"],
                tech_stack["datatables"],
                tech_stack["google_maps"],
                tech_stack["openstreetmap"]
            ],
            "updated_at": datetime.strptime("2023-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 12,
            "title": "College Data Playground",
            "headline": "Explore Indonesian college stats with a slick Flask-powered hub.",
            "description": [
                "This Flask site is your one-stop shop for college data—students, lecturers, programs, and more.",
                "Comes with a dope dashboard for stats, a search tool, and detailed pages for everything.",
                "Built to make digging through academic data fun, fast, and easy."
            ],
            "demo_url": "https://replit.com/@ridwaanhall/web-college",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/college_data_hub.webp",
            "img_name": "college_data_hub.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Stats Dashboard",
                    "description": "Visualize student, lecturer, and program counts like a pro."
                },
                {
                    "title": "Search Superstar",
                    "description": "Find students, lecturers, colleges, or programs in a flash."
                },
                {
                    "title": "Deep Dives",
                    "description": "Explore detailed data on students, lecturers, and more."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"],
                tech_stack["bootstrap"]
            ],
            "updated_at": datetime.strptime("2023-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 13,
            "title": "Telegram Student Finder Bot",
            "headline": "Hunt down student deets via Telegram with Flask-powered ease.",
            "description": [
                "This Python Telegram bot, hooked up with Flask and webhooks, makes finding student info a breeze.",
                "Drop a name or student ID, and it’ll list matches—tap one for full details like college and programs.",
                "Your go-to for quick, no-fuss student data lookups."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/student_search_bot_telegram.webp",
            "img_name": "student_search_bot_telegram.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Slick Search",
                    "description": "Find students by name, ID, or both in seconds."
                },
                {
                    "title": "Full Profiles",
                    "description": "Get name, ID, college, and program details instantly."
                },
                {
                    "title": "Flask Finesse",
                    "description": "Runs smooth with Flask and Telegram webhooks."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"],
                tech_stack["telegram_api"]
            ],
            "updated_at": datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 14,
            "title": "OpenAI Chat Master",
            "headline": "Get chatty with GPT-3.5 Turbo using Flask and Python swagger.",
            "description": [
                "This project taps OpenAI’s API to craft killer conversational systems with GPT-3.5 Turbo.",
                "Flask handles the backend, slinging HTTP requests for smooth AI-user vibes.",
                "Shows off next-level NLP skills for sharp, accurate responses."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/openai_api_dynamic_conversational_system.webp",
            "img_name": "openai_api_dynamic_conversational_system.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "AI Chat Vibes",
                    "description": "GPT-3.5 Turbo powers dope, engaging convos."
                },
                {
                    "title": "Flask Flex",
                    "description": "Handles POST and GET requests like a champ."
                },
                {
                    "title": "NLP Game Strong",
                    "description": "OpenAI’s tech delivers top-tier language processing."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"],
                tech_stack["openai_api"]
            ],
            "updated_at": datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 15,
            "title": "Planetary API | Cosmic Data Hub",
            "headline": "Explore the solar system with Flask and SQLAlchemy—space data, unlocked.",
            "description": [
                "This RESTful Planetary API dishes out juicy details on planets in our solar system.",
                "Get names, types, home stars, masses, radii, and Earth distances with ease.",
                "Rocking JWT for secure access, CRUD ops, and Flask-Mail for email notifications."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/planetary_api_explore_universe.webp",
            "img_name": "planetary_api_explore_universe.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Planet Data Galore",
                    "description": "Scoop up details on planets, types, and distances."
                },
                {
                    "title": "Locked & Loaded",
                    "description": "JWT secures user access, registration, and recovery."
                },
                {
                    "title": "Dev-Friendly",
                    "description": "CRUD ops keep data management clean and tight."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"],
                tech_stack["sqlalchemy"],
                tech_stack["jwt"],
                tech_stack["flask_mail"]
            ],
            "updated_at": datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 16,
            "title": "Number Spotter App | Neural Net Magic",
            "headline": "Catch hand-drawn numbers in real-time with MLP and a slick Python GUI.",
            "description": [
                "This GUI app uses a Multi-Layer Perceptron to spot numbers (0-9) drawn by you.",
                "Tweak seven sliders for live predictions from the neural network, no lag.",
                "Drops insights on training progress, like epochs and error stats, for a fun learning vibe."
            ],
            "github_url": "https://github.com/ridwaanhall/Training-Neural-Networks-in-Python",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/neural_number_recognition.webp",
            "img_name": "neural_number_recognition.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Slider Shenanigans",
                    "description": "Adjust features for instant number predictions."
                },
                {
                    "title": "MLP Muscle",
                    "description": "Neural nets nail number recognition with precision."
                },
                {
                    "title": "Training Peek",
                    "description": "See epoch counts and error trends for clarity."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["neural_networks"],
                tech_stack["gui_framework"]
            ],
            "updated_at": datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 17,
            "title": "OpenAI Function Flex",
            "headline": "Unleash GPT-3.5 Turbo for slick tasks with Python and Flask.",
            "description": [
                "This project shows off OpenAI API skills, firing structured POST requests with Python’s requests library.",
                "Comes with cool functions like ‘locationQuery’ for weather and ‘authorQuery’ for author info.",
                "A dope showcase of OpenAI’s NLP for versatile, text-based tasks."
            ],
            "demo_url": "https://your-openai-function-calling-url.com",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/openai_function_calling.webp",
            "img_name": "openai_function_calling.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Task-Targeted APIs",
                    "description": "Query weather or author data with built-in functions."
                },
                {
                    "title": "Smooth Connect",
                    "description": "Python’s requests library links up with OpenAI flawlessly."
                },
                {
                    "title": "Text Powerhouse",
                    "description": "GPT-3.5 Turbo delivers smart, spot-on responses."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["flask"],
                tech_stack["openai_api"]
            ],
            "updated_at": datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 18,
            "title": "Drink Database API",
            "headline": "Manage your drink data like a boss with this Django-powered API.",
            "description": [
                "This Django and DRF-built API makes handling a drink database a total breeze.",
                "Full CRUD vibes: add, update, fetch, or delete drinks with ease.",
                "Perfect for devs looking to plug drink data into their apps with RESTful swagger."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/restful_drink_service.webp",
            "img_name": "restful_drink_service.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "CRUD Crush",
                    "description": "Create, read, update, or delete drinks like a pro."
                },
                {
                    "title": "DRF Domination",
                    "description": "Django REST Framework brings scalable API heat."
                },
                {
                    "title": "RESTful Rules",
                    "description": "Clean, efficient endpoints built on REST principles."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["django_rest_framework"]
            ],
            "updated_at": datetime.strptime("2023-11-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 19,
            "title": "CRM Lite | User Management",
            "headline": "Keep user data in check with this slick Django-powered CRM.",
            "description": [
                "This Django web app makes managing user data a walk in the park for any org.",
                "Handles registration, login, and full CRUD ops for total control.",
                "Perfect for HR, support teams, or anyone needing a clean user management fix."
            ],
            "github_url": "https://github.com/ridwaanhall/CRUD-mastery-with-Django",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/crm_simple_user_management.webp",
            "img_name": "crm_simple_user_management.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "CRUD Mastery",
                    "description": "Add, view, edit, or delete records with ease."
                },
                {
                    "title": "Secure Access",
                    "description": "Rock-solid registration and login flows."
                },
                {
                    "title": "Slick Dashboard",
                    "description": "Intuitive tools for quick sorting and access."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"]
            ],
            "updated_at": datetime.strptime("2023-11-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 20,
            "title": "PDDIKTI Data API | College Insights",
            "headline": "Tap into Indonesian college data with this dope Django-powered API.",
            "description": [
                "This Django REST Framework API serves up student, lecturer, college, and program info with ease.",
                "Built for devs who need reliable, quick access to higher ed data for their apps.",
                "Keeps things simple and efficient for all your academic data needs."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/pddikti_api_django.webp",
            "img_name": "pddikti_api_django.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Academic Data Drop",
                    "description": "Grab student, lecturer, college, and program info."
                },
                {
                    "title": "DRF Power",
                    "description": "Django REST Framework fuels scalable API vibes."
                },
                {
                    "title": "Clean Endpoints",
                    "description": "Structured routes for smooth data integration."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["django_rest_framework"]
            ],
            "updated_at": datetime.strptime("2023-11-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 21,
            "title": "Electricity Demand Forecaster",
            "headline": "Tap into RNNs to nail super-accurate electricity demand predictions.",
            "description": [
                "This project rocks Recurrent Neural Networks (RNNs) like LSTM and GRU to forecast electricity demand with serious precision.",
                "Trained on historical demand data, mixed with weather and calendar features for max accuracy.",
                "Perfect for showcasing how RNNs can level up energy management with killer temporal insights."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/time_series_forecasting_rnn.webp",
            "img_name": "time_series_forecasting_rnn.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "RNN Powerhouse",
                    "description": "LSTM and GRU models crush it at capturing time-based patterns."
                },
                {
                    "title": "Loaded Dataset",
                    "description": "Blends historical demand, weather, and calendar data for sharp predictions."
                },
                {
                    "title": "Energy Game-Changer",
                    "description": "Delivers spot-on forecasts for real-world energy planning."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["pytorch"],
                tech_stack["rnn"],
                tech_stack["lstm"],
                tech_stack["gru"]
            ],
            "updated_at": datetime.strptime("2024-01-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 22,
            "title": "Emotion Detector CNN",
            "headline": "Spot emotions like a pro with next-level CNNs and TIMM model magic.",
            "description": [
                "This project uses Convolutional Neural Networks (CNNs) with pretrained TIMM models to classify emotions like a boss.",
                "Boosted by dope augmentation tricks like random resizing, flipping, color jitter, CutMix, and MixUp for top-tier generalization.",
                "Smart dataset splits for training and validation ensure the model’s performance is on point."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/emotion_recognition_timm_cnn.webp",
            "img_name": "emotion_recognition_timm_cnn.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "TIMM Model Swagger",
                    "description": "High-performance pretrained models for reliable emotion detection."
                },
                {
                    "title": "Augmentation All-Stars",
                    "description": "CutMix, MixUp, and more spice up data for better results."
                },
                {
                    "title": "Training Smarts",
                    "description": "Optimized splits for max accuracy and generalization."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["pytorch"],
                tech_stack["cnn"],
                tech_stack["timm"]
            ],
            "updated_at": datetime.strptime("2024-01-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 23,
            "title": "Pemilu 2024 Data Hub",
            "headline": "Live 2024 Indonesia Election data at your fingertips with Django REST APIs.",
            "description": [
                "This API collection is your VIP pass to Indonesia’s 2024 Election data—candidate names, voting stats, all in real-time glory.",
                "Powered by Django REST Framework, it’s built tough with clean endpoints and pro-level error handling.",
                "Perfect for devs cooking up election trackers or diving deep into vote analysis with flexible, detailed data."
            ],
            "github_url": "https://github.com/ridwaanhall/realcount-pemilu-2024",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/pemilu_2024_api.webp",
            "img_name": "pemilu_2024_api.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Versatile Endpoints",
                    "description": "Scoop up candidate names, dispute stats, or voting details effortlessly."
                },
                {
                    "title": "Bulletproof Handling",
                    "description": "Error-proof design keeps your app running like a dream."
                },
                {
                    "title": "Deep Data Dives",
                    "description": "Grab election insights at any level for epic analysis."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django_rest_framework"]
            ],
            "updated_at": datetime.strptime("2024-03-01T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 24,
            "title": "Pemilu 2024 Vote Dashboard",
            "headline": "Sleek web app for real-time 2024 Indonesia Election vote tracking with Django flair.",
            "description": [
                "This fire web app for the 2024 Indonesia Presidential Election lets you explore vote data across regions—from national to polling stations.",
                "Built with Django and Django REST Framework for a rock-solid backend, styled with Bootstrap for a clean, responsive look.",
                "Packed with verified evidence data, it’s perfect for tracking results or building dope election tools."
            ],
            "github_url": "https://github.com/ridwaanhall/realcount-pemilu-2024",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/pemilu_2024_website.webp",
            "img_name": "pemilu_2024_website.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Region-Specific Insights",
                    "description": "Dive into vote data from national to TPS levels."
                },
                {
                    "title": "Trusted Evidence",
                    "description": "Verified data ensures transparency and reliability."
                },
                {
                    "title": "Slick Responsive Design",
                    "description": "Bootstrap makes it look fire on any screen."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["django_rest_framework"],
                tech_stack["bootstrap"]
            ],
            "updated_at": datetime.strptime("2024-04-30T23:59:59+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 25,
            "title": "Election Digit Scanner",
            "headline": "Nail handwritten digit recognition for 2024 Indonesia vote recaps with HOG and SVM.",
            "description": [
                "This project kills data entry errors in the 2024 Indonesian Presidential Election vote recap with cutting-edge pattern recognition.",
                "Uses Histogram of Oriented Gradients (HOG) for feature extraction and K-Nearest Neighbors (KNN) plus Support Vector Machine (SVM) for classification, hitting over 97% accuracy.",
                "Experiments prove HOG + SVM is the champ, delivering top-tier performance across dataset splits."
            ],
            "github_url": "https://github.com/ridwaanhall/handwritten-digit-recognition-of-the-2024-indonesian-presidential-election-recap",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/default_project_image.webp",
            "img_name": "default_project_image.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "HOG Feature Magic",
                    "description": "Extracts edges and gradients for pinpoint digit recognition."
                },
                {
                    "title": "SVM & KNN Power",
                    "description": "Drops 97%+ accuracy with killer classification algorithms."
                },
                {
                    "title": "Performance Breakdown",
                    "description": "Compares extraction vs. no-extraction for clear wins."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["hog"],
                tech_stack["svm"],
                tech_stack["knn"]
            ],
            "updated_at": datetime.strptime("2024-06-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 26,
            "title": "Khodam Color Finder",
            "headline": "Unleash your inner Khodam vibe with this Django-powered online checker.",
            "description": [
                "This slick platform lets you discover your Khodam color in a snap, no hassle.",
                "Built with Django, it’s open to all for three months starting June 25, 2024.",
                "Brings a modern, fun twist to mystical exploration with a smooth user experience."
            ],
            "github_url": "https://github.com/ridwaanhall/website-cek-khodam",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/default_project_image.webp",
            "img_name": "default_project_image.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Instant Khodam Check",
                    "description": "Find your Khodam color with zero fuss."
                },
                {
                    "title": "Open to All",
                    "description": "Publicly accessible during its live run."
                },
                {
                    "title": "Django Swagger",
                    "description": "Rock-solid backend for seamless performance."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"]
            ],
            "updated_at": datetime.strptime("2024-06-25T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 27,
            "title": "Zeronine Handwriting Wizard",
            "headline": "Crush Arabic and English digit/character recognition with CNN-powered magic.",
            "description": [
                "The Zeronine App takes you from raw data to a slick website for handwritten recognition of Arabic and English digits and characters.",
                "Uses Convolutional Neural Networks (CNNs) to nail classification with high accuracy.",
                "A full journey from data collection to deployment, built for impact and efficiency."
            ],
            "github_url": "https://github.com/ridwaanhall/zeronine",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/zeronine_handwritten_recognition.webp",
            "img_name": "zeronine_handwritten_recognition.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Bilingual Recognition",
                    "description": "Handles Arabic and English digits and characters like a champ."
                },
                {
                    "title": "CNN Supercharge",
                    "description": "Convolutional Neural Networks deliver precise handwriting detection."
                },
                {
                    "title": "End-to-End Flow",
                    "description": "Covers data gathering, training, and website rollout."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["cnn"]
            ],
            "updated_at": datetime.strptime("2024-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 28,
            "title": "Follow Dragon SpaceX Tracker",
            "headline": "Chase SpaceX Dragon missions live with Django-powered API swagger.",
            "description": [
                "This Django project hooks into external APIs to serve real-time SpaceX Dragon data, rendered in slick HTML templates.",
                "The `dragon_public` view grabs JSON data with custom headers, delivering responsive, dynamic visuals.",
                "Extra views handle redirects and data rendering for a seamless user experience."
            ],
            "demo_url": "https://follow-dragon.ridwaanhall.com/",
            "github_url": "https://github.com/ridwaanhall/follow-dragon-spacex",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/follow_dragon_spacex.webp",
            "img_name": "follow_dragon_spacex.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Live API Connect",
                    "description": "Pulls JSON data with custom headers for real-time mission tracking."
                },
                {
                    "title": "Sleek Template Vibes",
                    "description": "Responsive designs make data pop dynamically."
                },
                {
                    "title": "Django Dynamism",
                    "description": "Robust and scalable thanks to Django’s framework."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"]
            ],
            "updated_at": datetime.strptime("2024-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 29,
            "title": "MLBB VIP Mabar Organizer",
            "headline": "Level up MLBB sessions with Django-powered VIP management for skins and heroes.",
            "description": [
                "This Django system makes managing Mobile Legends: Bang Bang sessions, skin requests, hero picks, and feedback a breeze.",
                "Tracks session status for regular and VIP users, keeping donor communication tight and organized.",
                "Built to boost gameplay collaboration and streamline the VIP experience."
            ],
            "github_url": "https://github.com/ridwaanhall/management-mabar-VIP-MLBB",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_mabar_vip_manager.webp",
            "img_name": "mlbb_mabar_vip_manager.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Session Coordinator",
                    "description": "Manages Mabar sessions with donor and user details."
                },
                {
                    "title": "Skin Request Flow",
                    "description": "Automates skin delivery status for VIPs."
                },
                {
                    "title": "Hero Pick System",
                    "description": "Handles hero preferences, lanes, and meta choices."
                },
                {
                    "title": "Feedback Tracker",
                    "description": "Logs donor comments for quick resolution."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"]
            ],
            "updated_at": datetime.strptime("2024-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 30,
            "title": "Indonesia Route Optimizer",
            "headline": "Find the best paths across Indonesia with ACO and slick visualizations.",
            "description": [
                "This project brings Ant Colony Optimization (ACO) to life on a real map of Indonesia for next-level route planning.",
                "Tweakable parameters and visualization tools let you track the algorithm’s progress in style.",
                "Built to deliver practical insights and boost efficiency for pathfinding challenges."
            ],
            "github_url": "https://github.com/ridwaanhall/aco-algorithm",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/default_project_image.webp",
            "img_name": "default_project_image.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Real-World Mapping",
                    "description": "Optimizes routes using Indonesia’s actual geography."
                },
                {
                    "title": "Visual Progress",
                    "description": "Watch the algorithm work with clear visualizations."
                },
                {
                    "title": "Tuning Mastery",
                    "description": "Fine-tune parameters for peak optimization results."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["aco"]
            ],
            "updated_at": datetime.strptime("2024-12-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 31,
            "title": "NGL Link Spam",
            "headline": "Python script to fire off NGL messages, no login required.",
            "description": [
                "This Python tool lets you send custom or random messages to NGL without needing an account.",
                "Flexes web requests and API skills, automating what’s usually a manual grind.",
                "Keeps it cool with built-in rate limits to dodge spamming headaches."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/ngl_link_spamming.webp",
            "img_name": "ngl_link_spamming.webp",
            "github_url": "https://github.com/ridwaanhall/ngl-link-spamming",
            "is_featured": False,
            "features": [
                {
                    "title": "Custom Messages",
                    "description": "Drop your own texts with zero hassle."
                },
                {
                    "title": "Random Texts",
                    "description": "Generate quirky messages for kicks."
                },
                {
                    "title": "No Login",
                    "description": "Jump straight to messaging, no sign-up needed."
                }
            ],
            "tech_stack": [
                tech_stack["python"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 32,
            "title": "ridwaanhall.pythonanywhere.com",
            "headline": "Slick portfolio site with Vuexy HTML and Django, showing off GitHub stats.",
            "description": [
                "This portfolio site, powered by Vuexy HTML and Django, is loaded with sections and a GitHub-driven stats dashboard.",
                "Rocking a sharp design and a smart backend for easy content updates, plus secure admin access.",
                "The dashboard pulls yearly GitHub data to flex my coding grind in style."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/ridwaanhall_pythonanywhere_com.webp",
            "img_name": "ridwaanhall_pythonanywhere_com.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Loaded Pages",
                    "description": "Packed with sections like About, Projects, and beyond."
                },
                {
                    "title": "Clean UI",
                    "description": "Vuexy HTML delivers a pro-grade look."
                },
                {
                    "title": "Git.callbacks",
                    "description": "Yearly coding insights pulled via API."
                },
                {
                    "title": "Mobile-Friendly",
                    "description": "Looks dope on any device."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["github_api"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 33,
            "title": "Gold Price & Music Recommender",
            "headline": "ML vibes forecasting gold prices and curating your next music banger.",
            "description": [
                "This project uses machine learning to predict gold prices and drop music recs that match your mood.",
                "For gold, it crunches historical data and economic trends, testing multiple models for tight accuracy.",
                "The music recommender scans your listening habits and song features to serve up tracks and artists you’ll vibe with."
            ],
            "github_url": "https://github.com/ridwaanhall/applied-machine-learning",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/gold_price_prediction_and_music_recommendation_system.webp",
            "img_name": "gold_price_prediction_and_music_recommendation_system.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Gold Forecasts",
                    "description": "Predicts prices to guide investment moves."
                },
                {
                    "title": "Music Picks",
                    "description": "Curates tracks based on your taste."
                }
            ],
            "tech_stack": [
                tech_stack["machine_learning"],
                tech_stack["music_recommendation"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 34,
            "title": "Tokopedia Review Scanner",
            "headline": "ML pipeline to decode Tokopedia app feedback like a pro.",
            "description": [
                "This pipeline scrapes and analyzes Tokopedia app reviews from Google Play, using ML to read the sentiment.",
                "It pinpoints what users love or hate, helping devs focus on fixes and features that matter.",
                "Tackles messy Indonesian text—slang included—comparing models to find the top performer."
            ],
            "github_url": "https://github.com/ridwaanhall/Dicoding-Machine-Learning-Intermediate/tree/main/01_project",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/sentiment_analysis_tokopedia_app.webp",
            "img_name": "sentiment_analysis_tokopedia_app.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Review Scraper",
                    "description": "Grabs fresh feedback from Play Store."
                },
                {
                    "title": "Text Cleanup",
                    "description": "Tames messy text for clean analysis."
                },
                {
                    "title": "Feature Extraction",
                    "description": "Uses TF-IDF and Word2Vec for deep insights."
                },
                {
                    "title": "Model Testing",
                    "description": "Battles ML models to crown the best."
                },
                {
                    "title": "Sentiment Scores",
                    "description": "Nails review vibes with precision."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["machine_learning"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 35,
            "title": "ridwaanhall.me",
            "headline": "Next.js portfolio with Once UI, built for speed and global vibes.",
            "description": [
                "This Next.js portfolio, rocking Once UI, is optimized for lightning speed, SEO, and worldwide access.",
                "Loaded with Server Components, lazy images, and code splitting, it scores 100 on Lighthouse.",
                "Supports multiple languages, custom animations, and stays buttery smooth on any device."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/ridwaanhall_me.webp",
            "img_name": "ridwaanhall_me.webp",
            "github_url": "https://github.com/ridwaanhall/ridwaanhall.me",
            "is_featured": False,
            "features": [
                {
                    "title": "Once UI",
                    "description": "Sleek design system for fire components."
                },
                {
                    "title": "SEO Boost",
                    "description": "Auto-generated meta for max search visibility."
                },
                {
                    "title": "Responsive Layout",
                    "description": "Flawless on any screen size."
                },
                {
                    "title": "Customizable",
                    "description": "Tweak everything with data attributes."
                },
                {
                    "title": "Multilingual",
                    "description": "Ready for global audiences with next-intl."
                }
            ],
            "tech_stack": [
                tech_stack["nextjs"],
                tech_stack["once_ui"],
                tech_stack["typescript"],
                tech_stack["scss"],
                tech_stack["mdx"],
                tech_stack["javascript"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 36,
            "title": "Neon AI",
            "headline": "Next.js-powered AI chatbot with Once UI and slick vibes.",
            "description": [
                "Neon AI is a next-level chatbot built on Next.js and Once UI, with seamless routing and unified APIs.",
                "Delivers instant, natural responses using streaming tech for a smooth conversational flow.",
                "Tracks context for coherent chats and presents data in visually dope formats."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/neon_ai.webp",
            "img_name": "neon_ai.webp",
            "github_url": "https://github.com/ridwaanhall/neon-ai",
            "demo_url": "https://chat.ridwaanhall.com",
            "is_featured": False,
            "features": [
                {
                    "title": "Smart Routing",
                    "description": "Next.js App Router for zippy navigation."
                },
                {
                    "title": "AI Power",
                    "description": "Unified API for text and tool calls."
                },
                {
                    "title": "Data Storage",
                    "description": "Vercel Postgres and Blob for efficiency."
                }
            ],
            "tech_stack": [
                tech_stack["nextjs"],
                tech_stack["tailwindcss"],
                tech_stack["typescript"],
                tech_stack["vercel_postgres"],
                tech_stack["radix_ui"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 37,
            "title": "Insta Follow Analyzer",
            "headline": "Python tool to dissect Instagram follower dynamics.",
            "description": [
                "This Python script breaks down Instagram followers and following, spotting mutuals, non-followers, and more.",
                "Perfect for influencers and managers to find engagement gaps or networking opportunities.",
                "Spits out detailed stats and lists from JSON data for outreach or deeper analysis."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/instagram_following_followers.webp",
            "img_name": "instagram_following_followers.webp",
            "github_url": "https://github.com/ridwaanhall/instagram-following-followers",
            "demo_url": "https://igstats.ridwaanhall.com",
            "is_featured": False,
            "features": [
                {
                    "title": "Follower Breakdown",
                    "description": "Lists mutuals and one-sided followers."
                },
                {
                    "title": "Following Insights",
                    "description": "Tracks who you follow without reciprocation."
                },
                {
                    "title": "JSON Support",
                    "description": "Handles Instagram data like a pro."
                }
            ],
            "tech_stack": [
                tech_stack["bulma"],
                tech_stack["django"],
                tech_stack["whitenoise"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 38,
            "title": "Lumina Attendance Saver",
            "headline": "Auto-attendance tool for students who forget the roll call.",
            "description": [
                "Lumina pumps out encrypted attendance codes in a flash, saving students from missing class check-ins.",
                "Built for schools, it adapts to different course setups with secure, valid codes.",
                "The interface is stupid simple, perfect for those last-second scrambles."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/lumina.webp",
            "img_name": "lumina.webp",
            "github_url": "https://github.com/ridwaanhall/Lumina",
            "demo_url": "https://lumina.ridwaanhall.com",
            "is_featured": False,
            "features": [
                {
                    "title": "Code Generator",
                    "description": "Spits out secure codes instantly."
                },
                {
                    "title": "Easy UI",
                    "description": "No fuss, even under pressure."
                },
                {
                    "title": "Safe Codes",
                    "description": "Encryption keeps things legit."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["bulma"],
                tech_stack["vercel"],
                tech_stack["cloudflare"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 39,
            "title": "OpenShop Product API",
            "headline": "Slick RESTful API for juggling product data with Django REST Framework.",
            "description": [
                "This RESTful API, built with Django REST Framework, handles product data like a champ.",
                "Supports full CRUD, product searches, and HATEOAS for smooth navigation.",
                "Comes with soft delete, data validation, and proper status codes for a polished experience."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/openshop_restful_api.webp",
            "img_name": "openshop_restful_api.webp",
            "github_url": "https://github.com/ridwaanhall/a743-backend-pemula-python/tree/submission",
            "is_featured": False,
            "features": [
                {
                    "title": "Full CRUD",
                    "description": "Create, read, update, and delete products with ease."
                },
                {
                    "title": "Search by Name",
                    "description": "Find products by name with a clean query."
                },
                {
                    "title": "HATEOAS Links",
                    "description": "Navigate resources with embedded API links."
                },
                {
                    "title": "Soft Delete",
                    "description": "Mark products as deleted without losing data."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["django_rest_framework"]
            ],
            "updated_at": datetime.strptime("2025-04-20T14:53:55+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 40,
            "title": "Bike Rental Insights Dashboard",
            "headline": "Interactive dashboard tying weather to bike rental trends.",
            "description": [
                "This dashboard dives into how weather drives bike rentals, breaking down trends by season, day, and conditions.",
                "It uses data analysis to help bike companies optimize fleets and pricing based on forecasts.",
                "Filter by temp, humidity, or time to uncover patterns, with ML models predicting future demand."
            ],
            "demo_url": "https://ridwaanhall-bike-sharing-analytics.streamlit.app/",
            "github_url": "https://github.com/ridwaanhall/dicoding-bike-sharing-analysis",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/bike_sharing_analysis_dashboard.webp",
            "img_name": "bike_sharing_analysis_dashboard.webp",
            "is_featured": True,
            "features": [
                {
                    "title": "Season Trends",
                    "description": "Shows peak biking seasons."
                },
                {
                    "title": "Weather Impact",
                    "description": "Links conditions to rental spikes."
                },
                {
                    "title": "Day Breakdown",
                    "description": "Compares weekdays vs. weekends."
                },
                {
                    "title": "Streamlit UI",
                    "description": "Interactive charts for easy insights."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["streamlit"],
                tech_stack["tensorflow"]
            ],
            "updated_at": datetime.strptime("2025-04-17T17:49:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 41,
            "title": "MLBB API Stats Hub",
            "headline": "REST API and website loaded with Mobile Legends game data.",
            "description": [
                "A must-have for Mobile Legends fans, this REST API and website dish out hero stats, rankings, and game insights.",
                "The API offers clean endpoints for heroes, skills, and meta trends, ideal for devs crafting game tools. Docs are super easy to follow.",
                "The site breaks down complex data for casual players, dropping tips on hero matchups, builds, and counters based on the latest meta."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/mobile_legends_bang_bang_api_and_website.webp",
            "img_name": "mobile_legends_bang_bang_api_and_website.webp",
            "demo_url": "https://mlbb-stats.ridwaanhall.com/",
            "github_url": "https://github.com/ridwaanhall/api-mobilelegends",
            "is_featured": True,
            "features": [
                {
                    "title": "Game API",
                    "description": "GET endpoints for hero stats and rankings."
                },
                {
                    "title": "Dev Docs",
                    "description": "Next.js-powered guide for easy API use."
                },
                {
                    "title": "Player Hub",
                    "description": "Simple site for browsing game insights."
                }
            ],
            "tech_stack": [
                tech_stack["django"],
                tech_stack["python"],
                tech_stack["rest_api"],
                tech_stack["nextjs"],
                tech_stack["shadcn_ui"],
                tech_stack["vercel"]
            ],
            "updated_at": datetime.strptime("2025-04-20T14:24:22+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 42,
            "title": "PDDikti Data Vault",
            "headline": "API unlocking Indonesia’s higher education data from PDDikti.",
            "description": [
                "This API pulls fresh, juicy data from PDDikti, Indonesia’s higher ed database, covering universities, programs, and more.",
                "Built for researchers and devs, it offers clear endpoints to snag structured info like accreditation stats.",
                "Caching and optimizations keep it blazing fast under heavy traffic, with docs that make integration a breeze."
            ],
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/api_pddikti_kemendiksaintek.webp",
            "img_name": "api_pddikti_kemendiksaintek.webp",
            "demo_url": "https://pddikti-docs.ridwaanhall.com/",
            "github_url": "https://github.com/ridwaanhall/api-pddikti",
            "is_featured": True,
            "features": [
                {
                    "title": "Edu Data",
                    "description": "Easy access to uni and program info."
                },
                {
                    "title": "Dev-Friendly",
                    "description": "Simple setup for coders."
                },
                {
                    "title": "Fresh Stats",
                    "description": "Always-updated PDDikti data."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["javascript"],
                tech_stack["css"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 43,
            "title": "BeliMadu.com",
            "headline": "E-commerce hotspot for honey treats, built with Django and Bootstrap on Vercel.",
            "description": [
                "Belimadu.com is your go-to e-commerce hub for honey products, crafted with Django and Bootstrap, hosted on Vercel. It’s loaded with a product catalog, health tips, WhatsApp ordering, and monthly deals.",
                "A sweet spot for honey fans, mixing helpful articles with a smooth shopping experience. SEO tweaks make it shine on Google.",
                "Customers can hit up WhatsApp for quick orders, and monthly promos keep the buzz alive with fresh offers."
            ],
            "demo_url": "https://belimadu.com",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/belimadu_com.webp",
            "img_name": "belimadu_com.webp",
            "is_featured": True,
            "features": [
                {
                    "title": "Honey Catalog",
                    "description": "Lists products with crisp images and details."
                },
                {
                    "title": "WhatsApp Orders",
                    "description": "Chat directly to place orders fast."
                },
                {
                    "title": "Hot Deals",
                    "description": "Monthly specials on seasonal honey picks."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["bootstrap"],
                tech_stack["vercel"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 44,
            "title": "ridwaanhall.com",
            "headline": "My personal portfolio site, powered by Django and TailwindCSS, running serverless on Vercel.",
            "description": [
                "This is my digital HQ, built with Django and TailwindCSS, hosted serverless on Vercel. It’s got it all—about me, projects, blog, education, experience, and a sleek dashboard.",
                "Blends Django’s backend power with Tailwind’s sharp styling for a fast, modern site. Vercel’s serverless setup keeps it low-maintenance and lightning-quick.",
                "The dashboard pulls live GitHub and WakaTime data to flex my coding stats in real time, looking fire on any device."
            ],
            "github_url": "https://github.com/ridwaanhall/ridwaanhall_com",
            "demo_url": "https://ridwaanhall.com",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/ridwaanhall_com.webp",
            "img_name": "ridwaanhall_com.webp",
            "is_featured": True,
            "features": [
                {
                    "title": "Serverless Vibes",
                    "description": "Hosted on Vercel for max uptime and easy scaling."
                },
                {
                    "title": "Live Dashboard",
                    "description": "Shows my GitHub and WakaTime stats in real time."
                },
                {
                    "title": "Smooth Design",
                    "description": "TailwindCSS makes it look good on any screen."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["tailwindcss"],
                tech_stack["vercel"],
                tech_stack["github_api"],
                tech_stack["wakatime_api"]
            ],
            "updated_at": datetime.strptime("2025-04-23T22:03:09+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 45,
            "title": "Indonesia’s Gold Trends by AI",
            "headline": "Transforming 10+ years of gold price data into precise forecasts using LSTM neural networks for Indonesia’s market trends.",
            "description": [
                "This project’s straight-up droppin’ LSTM neural nets to forecast Indonesian gold prices like a pro. It’s vibin’ off historical data to nail short-term predictions and keep it real for long-term outlooks.",
                "Runnin’ on 10+ years of gold price data, it’s spittin’ next-day price calls, short-term trends (1-6 months), and even long-term visions (up to 5 years). Plus, you get dope interactive plots and exportable data for that extra sauce.",
                "With next-level data crunchin’ and a souped-up LSTM setup, this tool’s got precision and adaptability on lock, makin’ it a total game-changer."
            ],
            "github_url": "https://github.com/ridwaanhall/indonesia-gold-price-prediction",
            "image_url": f"{settings.PROJECT_BASE_IMG_URL}/indonesia_gold_price_prediction.webp",
            "img_name": "indonesia_gold_price_prediction.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Deep Learning Drip",
                    "description": "LSTM neural nets bringin’ that A-game for predictions across all timeframes."
                },
                {
                    "title": "Visuals Poppin’",
                    "description": "Dynamic plots make price forecasts look clean and easy to roll with."
                },
                {
                    "title": "Full-Range Forecast",
                    "description": "From next-day vibes to 5-year plans, it’s got trends covered with style."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["pytorch"],
                tech_stack["numpy"],
                tech_stack["matplotlib"],
                tech_stack["seaborn"]
            ],
            "updated_at": datetime.strptime("2025-04-23T22:07:45+07:00", "%Y-%m-%dT%H:%M:%S%z")
        }
    ]