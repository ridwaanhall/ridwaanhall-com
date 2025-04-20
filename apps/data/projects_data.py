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
    }
    
    projects = [
        {
            "id": 1,
            "title": "Mobile Legends Username Checker",
            "headline": "Easily find usernames in MLBB using Python magic and API.",
            "description": [
                "This Python project is designed to fetch usernames for Mobile Legends players.",
                "Using API, we take user ID and zone ID as inputs to retrieve the player's username.",
                "It's lightweight, straightforward, and a life-saver for MLBB gamers."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/mlbb_username_checker.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Quick Lookups",
                    "description": "Fetch usernames in seconds by providing user ID and zone ID."
                },
                {
                    "title": "Powered by Python",
                    "description": "Uses Python for speed and reliability."
                },
                {
                    "title": "API-Driven",
                    "description": "Leverages API for accurate data."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
            ],
            "updated_at": datetime.strptime("2023-03-30T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 2,
            "title": "TikTok User Data Extractor",
            "headline": "Get all the juicy details from TikTok profiles with Python and BeautifulSoup.",
            "description": [
                "A Python project to scrape TikTok user data straight from profile pages.",
                "Using BeautifulSoup, it pulls details like username, bio, followers, following, and total likes from the HTML structure.",
                "Saves time and effort while diving into TikTok data. Perfect for automation enthusiasts!"
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/tiktok_data_extractor.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "All-in-One Scraper",
                    "description": "Extracts username, bio, followers, following, and likes in one go."
                },
                {
                    "title": "Powered by BeautifulSoup",
                    "description": "Uses BeautifulSoup to parse TikTok's profile HTML with finesse."
                },
                {
                    "title": "Data Collector's Dream",
                    "description": "Great for research, insights, or simply satisfying your curiosity."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["BeautifulSoup"],
            ],
            "updated_at": datetime.strptime("2023-04-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 3,
            "title": "Frontend - API | Quran Website",
            "headline": "Explore the Quran like never before—modern tools meet divine wisdom.",
            "description": [
                "A sleek Flask-powered website that connects users to Quran chapters, verses, and translations.",
                "Designed with AdminLTE, it combines style and functionality for an unforgettable browsing experience.",
                "Data sourced from quranenc.com and quran.api-docs.io ensures credibility and depth."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/quran_website_frontend_api.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Smart APIs",
                    "description": "Comprehensive endpoints for chapters, Juz info, verses, and translations."
                },
                {
                    "title": "Script Variety",
                    "description": "Access Quran verses in Uthmani, Uthmani Simple, Imlaei, and Imlaei Simple scripts."
                },
                {
                    "title": "Translation Filters",
                    "description": "Pinpoint the exact translation by chapter, Surah, Aya, or key."
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
            "title": "BMKG Weather & Quake Info Hub",
            "headline": "Stay ahead with weather and earthquake updates, powered by Flask and AdminLTE.",
            "description": [
                "Built with Flask as the backend and AdminLTE for styling, this project delivers real-time earthquake and weather forecasts.",
                "The data is sourced directly from BMKG, making it reliable and accurate for daily insights.",
                "Whether it's tracking weather in Yogyakarta or checking recent quake activity, this tool’s got your back."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/bmkg_weather_quake_hub.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Real-Time Forecasts",
                    "description": "Get weather updates for the next 3 days, including wind speed, direction, and more."
                },
                {
                    "title": "Earthquake Alerts",
                    "description": "Keep tabs on the latest quakes straight from BMKG's database."
                },
                {
                    "title": "Built for Local Insights",
                    "description": "Focuses on Indonesia-specific data for accurate, relevant updates."
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
            "title": "BMKG Weather Pro | Real-Time Forecasts",
            "headline": "Your go-to tool for Indonesia’s weather updates, powered by Flask and BMKG data.",
            "description": [
                "This Flask-based project fetches detailed weather forecasts straight from BMKG's database.",
                "You can filter by region, parameter, and time range to get the data you need.",
                "From Aceh to Papua, the project covers all of Indonesia with reliable weather insights."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/bmkg_weather_forecast_api.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Wide Coverage",
                    "description": "Supports weather data retrieval for all Indonesian provinces."
                },
                {
                    "title": "Custom Filters",
                    "description": "Combine area_id, parameter_id, and time range for tailored results."
                },
                {
                    "title": "Efficient Data Handling",
                    "description": "Uses Flask framework for quick and easy routing."
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
            "title": "MLBB Game Stats & Info API",
            "headline": "Track MLBB player data, stats, and winrates—powered by Flask and custom integrations.",
            "description": [
                "This Flask-based API lets you fetch Mobile Legends Bang Bang data like usernames, MPL stats, winrate calculations, and more.",
                "It sources data from mainlagiaja.com, id-mpl.com, takapadia.com, and additional features built by me.",
                "Perfect for developers or gamers who want quick access to MLBB game stats without hassle."
            ],
            "demo_url": "https://mlbb-api.ridwaanhall.repl.co",
            "image_url": f"{settings.BASE_URL}/static/img/project/mlbb_game_stats_api.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Username Checker",
                    "description": "Fetch player usernames easily using the mainlagiaja.com API."
                },
                {
                    "title": "MPL Data Integration",
                    "description": "Provides stats and details directly from id-mpl.com."
                },
                {
                    "title": "Winrate Calculator",
                    "description": "Accurate winrate calculation sourced from takapadia.com."
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
            "title": "Instagram Media Downloader API",
            "headline": "Snag profile pics, stories, and posts in HD—built with Flask and save-free.com.",
            "description": [
                "This Flask-powered API lets users download Instagram profile pictures in HD, stories, and post media like images and videos.",
                "Using save-free.com as the media source, the API ensures reliable data fetching.",
                "Perfect for simplifying media downloads while keeping it fast and hassle-free."
            ],
            "demo_url": "https://instagram-api-v1.ridwaanhall.repl.co/",
            "image_url": f"{settings.BASE_URL}/static/img/project/instagram_media_downloader.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "HD Profile Pictures",
                    "description": "Grab high-quality profile pics with ease."
                },
                {
                    "title": "Story Saver",
                    "description": "Download Instagram stories effortlessly."
                },
                {
                    "title": "Post Media Downloader",
                    "description": "Fetch images and videos from posts in a snap."
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
            "title": "BMKG Quake Tracker API (Unofficial)",
            "headline": "Stay updated on earthquakes, tsunamis, and seismic news with real-time data via Flask.",
            "description": [
                "A Flask-based API delivering earthquake data in multiple formats like XML, JSON, and GeoJSON.",
                "Includes insights on earthquakes above 5 magnitude, latest quakes, tsunami updates, real-time alerts, and seismic news.",
                "Perfect for researchers, developers, or anyone wanting reliable quake info."
            ],
            "demo_url": "https://earthquake-bmkg-api.ridwaanhall.repl.co",
            "image_url": f"{settings.BASE_URL}/static/img/project/bmkg_quake_tracker_api.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Multi-Format Data",
                    "description": "Fetch earthquake info in XML, JSON, or GeoJSON formats."
                },
                {
                    "title": "Real-Time Alerts",
                    "description": "Get the latest updates on tsunamis and seismic activity."
                },
                {
                    "title": "Data-Rich API",
                    "description": "Provides quake magnitude, location, PGA Max, MMI, and more."
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
            "title": "College Insights API (Unofficial PDDIKTI)",
            "headline": "Explore student, lecturer, and program data with ease—built on Flask.",
            "description": [
                "This Flask-powered API provides detailed data for Indonesian colleges, students, lecturers, study programs, and more.",
                "You can fetch specific student info like names and ID numbers, lecturer profiles, and program details seamlessly.",
                "Perfect for researchers or developers needing quick access to higher education data."
            ],
            "github_url": "https://replit.com/@ridwaanhall/college-data",
            "image_url": f"{settings.BASE_URL}/static/img/project/college_insights_api.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Student Data",
                    "description": "Fetch student names, IDs, and other details."
                },
                {
                    "title": "Lecturer Profiles",
                    "description": "Access lecturer names, ID numbers, and more."
                },
                {
                    "title": "Program Info",
                    "description": "Retrieve study program details and college data."
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
            "title": "ChatBot Gateway for Telegram & WhatsApp",
            "headline": "Seamlessly connect OpenAI-powered bots to Telegram and WhatsApp using Flask.",
            "description": [
                "Built with Flask as the backend, this project serves as a gateway for POST and GET requests to manage messages from Telegram and WhatsApp.",
                "It integrates OpenAI's capabilities, making it simple to handle user interactions via messaging apps.",
                "Perfect for automating conversations or building smart chat solutions."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/chatbot_gateway.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Flask-Driven Backend",
                    "description": "Handles message routing for seamless bot communication."
                },
                {
                    "title": "Multi-Platform Support",
                    "description": "Compatible with both Telegram and WhatsApp."
                },
                {
                    "title": "OpenAI Integration",
                    "description": "Leverages AI-powered responses for smarter conversations."
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
            "title": "Tsunami & Earthquake Insights",
            "headline": "Track tsunami warnings and earthquake data across Indonesia with real-time updates.",
            "description": [
                "This Flask-based frontend provides comprehensive earthquake and tsunami data sourced from BMKG.",
                "With visualizations powered by Chart.js and interactive maps using Leaflet, OpenStreetMap, and Google Maps, it's a powerful tool for monitoring seismic activity.",
                "The responsive design, backed by Bootstrap and enhanced with OverlayScrollbars, ensures a smooth user experience."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/inatews_dashboard.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Real-Time Earthquake Data",
                    "description": "Access historical and live earthquake information straight from BMKG."
                },
                {
                    "title": "Tsunami Warnings",
                    "description": "Get real-time updates on potential tsunami threats in Indonesia."
                },
                {
                    "title": "Advanced Visualizations",
                    "description": "Includes interactive maps, shakemaps, and charts for better data insights."
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
            "title": "College Data Hub | Search & Stats",
            "headline": "Navigate Indonesian college data with ease, backed by Flask.",
            "description": [
                "This Flask-powered website provides a comprehensive view of college data, from student and lecturer details to study programs and institutions.",
                "The platform includes a dashboard for statistics, a search feature, and detailed pages for students, lecturers, colleges, and study programs.",
                "Designed to make data exploration simple, efficient, and accessible for users."
            ],
            "demo_url": "https://replit.com/@ridwaanhall/web-college",
            "image_url": f"{settings.BASE_URL}/static/img/project/college_data_hub.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Interactive Dashboard",
                    "description": "Visualize college stats including total students, lecturers, and study programs."
                },
                {
                    "title": "Advanced Search",
                    "description": "Quickly find information on students, lecturers, colleges, and programs."
                },
                {
                    "title": "Detailed Views",
                    "description": "Dive deep into specific data for students, lecturers, colleges, and provinces."
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
            "title": "Student Search Bot for Telegram",
            "headline": "Easily find student details via Telegram chat, powered by Flask.",
            "description": [
                "This Python-based Telegram bot uses Flask to connect via webhook and handle messages seamlessly.",
                "Just send your name, student number, or a combination, and the bot will list matching names. Tap on a name to see detailed student info.",
                "Details include name, student ID, college, study programs, and more—making it effortless to retrieve student information."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/student_search_bot_telegram.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Smart Search",
                    "description": "Quickly find student info by name, ID, or a combo of both."
                },
                {
                    "title": "Detailed Profiles",
                    "description": "View student name, ID, college, and study programs at a glance."
                },
                {
                    "title": "Powered by Flask",
                    "description": "Leverages Flask and Telegram webhook for smooth performance."
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
            "title": "OpenAI API | Dynamic Conversational System",
            "headline": "Dive into the art of AI conversations with GPT-3.5 Turbo and Flask.",
            "description": [
                "This project focuses on using the OpenAI API to build conversational systems powered by GPT-3.5 Turbo.",
                "With Flask as the backend, HTTP requests were crafted to enable seamless interactions between users and the AI assistant.",
                "The project demonstrates the practical application of state-of-the-art natural language processing models, showcasing their ability to comprehend and respond accurately."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/openai_api_dynamic_conversational_system.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "AI-Driven Conversations",
                    "description": "Integrates GPT-3.5 Turbo for engaging and intelligent user interactions."
                },
                {
                    "title": "Flask Gateway",
                    "description": "Facilitates smooth communication via HTTP POST and GET requests."
                },
                {
                    "title": "Cutting-Edge NLP",
                    "description": "Harnesses the power of OpenAI for advanced natural language processing."
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
            "title": "Planetary API | Explore the Universe",
            "headline": "Unlock celestial data with Flask and SQLAlchemy—your gateway to the solar system.",
            "description": [
                "The Planetary API is a RESTful service designed to provide data about planets in our solar system.",
                "Retrieve detailed information such as names, types, home stars, masses, radii, and distances from Earth.",
                "Includes user authentication and secure routes, with built-in CRUD functionality for managing planetary data.",
                "Integrates JWT for secure access and Flask-Mail for email notifications, ensuring a seamless user experience."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/planetary_api_explore_universe.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Comprehensive Planetary Data",
                    "description": "Access detailed information about planets, their types, and distances."
                },
                {
                    "title": "Secure Access",
                    "description": "Features user registration, authentication, and password recovery powered by JWT."
                },
                {
                    "title": "Built for Developers",
                    "description": "Supports CRUD operations while maintaining data integrity."
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
            "title": "Number Recognition App | Neural Networks in Action",
            "headline": "Real-time number recognition with a GUI powered by MLP and Python.",
            "description": [
                "This GUI-based app uses a Multi-Layer Perceptron (MLP) to recognize hand-drawn numbers from 0 to 9.",
                "Users can input seven adjustable features through sliders, enabling real-time predictions from the trained neural network.",
                "The app provides additional insights into training progress, including epoch count and error statistics, making it a practical and interactive tool for understanding pattern recognition."
            ],
            "github_url": "https://github.com/ridwaanhall/Training-Neural-Networks-in-Python",
            "image_url": f"{settings.BASE_URL}/static/img/project/neural_number_recognition.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Interactive Sliders",
                    "description": "Adjust features to see real-time number predictions."
                },
                {
                    "title": "MLP-Powered Insights",
                    "description": "Leverages neural networks for precise number recognition."
                },
                {
                    "title": "Training Visualization",
                    "description": "Displays epoch count and error progression for learning clarity."
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
            "title": "OpenAI Function Calling | Power Up Your API Skills",
            "headline": "Leverage GPT-3.5 Turbo for dynamic tasks using Python and Flask.",
            "description": [
                "This project showcases how to interact with the OpenAI API by sending structured POST requests using Python's requests library.",
                "Features include specific functions like 'locationQuery' to fetch weather data and 'authorQuery' for author information retrieval.",
                "Demonstrates expertise in integrating OpenAI's NLP capabilities for versatile, text-based tasks."
            ],
            "demo_url": "https://your-openai-function-calling-url.com",
            "image_url": f"{settings.BASE_URL}/static/img/project/openai_function_calling.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Function-Specific APIs",
                    "description": "Built-in functions for querying location-based data or author info."
                },
                {
                    "title": "Effortless Integration",
                    "description": "Uses Python's requests library to seamlessly interact with OpenAI."
                },
                {
                    "title": "Dynamic Text Processing",
                    "description": "Leverages GPT-3.5 Turbo for intelligent and accurate responses."
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
            "title": "RESTful Drink Service API",
            "headline": "A Django-powered API for managing your drink database effortlessly.",
            "description": [
                "Built using Django and Django REST Framework, this API is designed for managing a database of drinks with ease.",
                "Supports full CRUD operations: add new drinks, update details, retrieve specific drink info, or delete drinks.",
                "Perfect for developers looking to integrate drink-related data management into their applications while following RESTful design principles."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/restful_drink_service.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "CRUD Functionality",
                    "description": "Easily create, read, update, and delete drink objects."
                },
                {
                    "title": "Django REST Framework",
                    "description": "Utilizes DRF for robust, scalable API development."
                },
                {
                    "title": "API Best Practices",
                    "description": "Designed following RESTful principles for clean and efficient endpoints."
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
            "title": "CRM System | Simple User Management",
            "headline": "Streamline user data management effortlessly with Django-based CRUD functionality.",
            "description": [
                "This project is a Django-powered web application designed to simplify user data management for organizations.",
                "Features include user registration, login, and full CRUD operations for efficient data control.",
                "Ideal for HR, customer support, or any organization needing a straightforward user management solution."
            ],
            "github_url": "https://github.com/ridwaanhall/CRUD-mastery-with-Django",
            "image_url": f"{settings.BASE_URL}/static/img/project/crm_simple_user_management.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Full CRUD Operations",
                    "description": "Create, read, update, and delete records seamlessly."
                },
                {
                    "title": "User Registration & Login",
                    "description": "Allows secure access and account management."
                },
                {
                    "title": "Streamlined Dashboard",
                    "description": "Provides intuitive tools for quick access and sorting."
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
            "title": "PDDIKTI API | Comprehensive College Data",
            "headline": "Effortlessly access student, lecturer, and college data with this Django-powered API.",
            "description": [
                "This Django REST Framework-based API is designed to provide information about students, lecturers, colleges, and study programs.",
                "It supports reliable data retrieval and is ideal for developers integrating higher education data into their applications.",
                "Built to ensure efficiency and simplicity in accessing academic information for various use cases."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/pddikti_api_django.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Academic Data Access",
                    "description": "Retrieve information on students, lecturers, colleges, and study programs."
                },
                {
                    "title": "Django REST Framework",
                    "description": "Leverages DRF for robust API development and scalability."
                },
                {
                    "title": "Reliable Routing",
                    "description": "Includes well-structured endpoints for seamless data integration."
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
            "title": "Time Series Forecasting | Predicting Electricity Demand",
            "headline": "Harness the power of RNNs for accurate time series forecasting.",
            "description": [
                "This project implements Recurrent Neural Networks (RNNs), including LSTM and GRU, for time series forecasting to predict electricity demand.",
                "The model is trained on historical electricity demand data, alongside meteorological and calendar-related features.",
                "Designed to capture temporal dependencies, the project showcases the potential of RNNs for practical applications in energy management."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/time_series_forecasting_rnn.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Powerful RNN Models",
                    "description": "Utilizes LSTM and GRU to model temporal dependencies effectively."
                },
                {
                    "title": "Comprehensive Dataset",
                    "description": "Includes historical electricity demand, weather data, and calendar features."
                },
                {
                    "title": "Real-World Insights",
                    "description": "Enables accurate predictions for practical energy forecasting applications."
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
            "title": "Emotion Recognition with CNNs | TIMM Models & Augmentation",
            "headline": "Classify emotions with cutting-edge CNNs, advanced augmentation techniques, and pretrained TIMM models.",
            "description": [
                "This project employs Convolutional Neural Networks (CNNs) with pretrained models from the TIMM library to classify emotions.",
                "Data augmentation techniques like random resizing, flipping, color jittering, CutMix, and MixUp are implemented to improve model generalization.",
                "The dataset is strategically split into training and validation sets to optimize the model's performance."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/emotion_recognition_timm_cnn.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Pretrained TIMM Models",
                    "description": "Utilizes high-performance TIMM models for reliable emotion recognition."
                },
                {
                    "title": "Advanced Augmentation",
                    "description": "Integrates techniques like CutMix and MixUp for enhanced data variability."
                },
                {
                    "title": "Optimized Training Process",
                    "description": "Includes training and validation splits to achieve higher accuracy and generalization."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["pytorch"],
                tech_stack["cnn"],
                tech_stack["timm"],
            ],
            "updated_at": datetime.strptime("2024-01-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 23,
            "title": "PEMILU 2024 Data APIs",
            "headline": "Dynamic APIs for real-time 2024 Indonesia Election data, built with Django REST Framework.",
            "description": [
                "Yo, this is your go-to API collection for diving into Indonesia’s 2024 Election data. It’s packed with endpoints that serve up everything from candidate names to voting stats, all in real time.",
                "Built with Django REST Framework, these APIs are rock-solid and easy to use. They pull data from reliable database endpoints, handling errors like a pro so you don’t have to sweat it.",
                "Whether you’re building an election tracker or crunching numbers for analysis, these APIs give you the flexibility to grab data at any level of detail. Perfect for devs who want to create dope electoral apps!"
            ],
            "github_url": "https://github.com/ridwaanhall/realcount-pemilu-2024",
            "image_url": f"{settings.BASE_URL}/static/img/project/pemilu_2024_api.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Flexible Endpoints",
                    "description": "Grab candidate names, dispute stats, regions, or voting details with ease."
                },
                {
                    "title": "Error-Proof",
                    "description": "Built-in error handling keeps your app running smoothly."
                },
                {
                    "title": "Granular Data",
                    "description": "Access election info at any level of detail for killer insights."
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
            "title": "PEMILU 2024 Vote Tracker",
            "headline": "Slick website for real-time 2024 Indonesia Presidential Election vote data, powered by Django and Bootstrap.",
            "description": [
                "Check out this dope web app for the 2024 Indonesia Presidential and Vice-Presidential Election! It’s got a clean, user-friendly vibe that lets you dive into vote data across regions—national, provincial, district, sub-district, village, and even polling stations (TPS).",
                "Built with Django and Django REST Framework for a solid backend, and styled with Bootstrap for that smooth, responsive look. It also packs legit evidence data to keep everything transparent and trustworthy.",
                "Perfect for anyone wanting to track election results or build something cool with real-time vote info. No fluff, just straight-up useful!"
            ],
            "github_url": "https://github.com/ridwaanhall/realcount-pemilu-2024",
            "image_url": f"{settings.BASE_URL}/static/img/project/pemilu_2024_website.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Region-Based Data",
                    "description": "Explore vote results from national down to polling station levels."
                },
                {
                    "title": "Trusted Info",
                    "description": "Includes verified evidence data for max authenticity."
                },
                {
                    "title": "Responsive Design",
                    "description": "Looks fire on any device, thanks to Bootstrap."
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
            "title": "Digit Recognition for Election Vote Recap | HOG + SVM Magic",
            "headline": "Boost accuracy in handwritten digit recognition with advanced feature extraction and machine learning.",
            "description": [
                "This project tackles data input errors in vote recapitulation for the 2024 Indonesian Presidential Election, leveraging cutting-edge pattern recognition techniques.",
                "Using Histogram of Oriented Gradients (HOG) for feature extraction and K-Nearest Neighbors (KNN) as well as Support Vector Machine (SVM) algorithms for classification, the system achieved exceptional accuracy levels.",
                "Experimental results confirmed that the combination of HOG with SVM provided the best performance, surpassing 97% accuracy across various dataset splits."
            ],
            "github_url": "https://github.com/ridwaanhall/handwritten-digit-recognition-of-the-2024-indonesian-presidential-election-recap",
            "image_url": f"{settings.BASE_URL}/static/img/project/default_project_image.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Feature Extraction with HOG",
                    "description": "Detect edges and gradient directions for enhanced digit recognition."
                },
                {
                    "title": "High Performance Algorithms",
                    "description": "Leverages KNN and SVM, achieving accuracy beyond 97%."
                },
                {
                    "title": "Experimental Insights",
                    "description": "Compares techniques with and without feature extraction to highlight performance gains."
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
            "title": "Khodam Checker | What's Your Color, Boss?",
            "headline": "Discover your Khodam online with this Django-powered website.",
            "description": [
                "This online platform allows users to check their Khodam color quickly and effortlessly.",
                "Built with Django, the website is accessible to the public for three months starting from June 25, 2024.",
                "Designed for a smooth and fun user experience, making mystical exploration modern and interactive."
            ],
            "github_url": "https://github.com/ridwaanhall/website-cek-khodam",
            "image_url": f"{settings.BASE_URL}/static/img/project/default_project_image.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Quick Khodam Check",
                    "description": "Effortlessly explore your Khodam online."
                },
                {
                    "title": "Public Accessibility",
                    "description": "Available to everyone during its active period."
                },
                {
                    "title": "Django-Powered",
                    "description": "Ensures a robust backend for smooth operations."
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
            "title": "Zeronine App | Handwritten Recognition",
            "headline": "From zero to hero—handwritten recognition for Arabic and English digits and characters.",
            "description": [
                "The Zeronine App is a journey from data gathering to creating a simple yet impactful website for handwritten recognition.",
                "Showcases the ability to classify Arabic digits, Arabic characters, English digits, and English characters through advanced image processing.",
                "Built with a focus on Convolutional Neural Networks (CNNs) to deliver accurate and efficient recognition results."
            ],
            "github_url": "https://github.com/ridwaanhall/zeronine",
            "image_url": f"{settings.BASE_URL}/static/img/project/zeronine_handwritten_recognition.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Multi-Language Classification",
                    "description": "Supports recognition of both Arabic and English digits and characters."
                },
                {
                    "title": "CNN-Powered Models",
                    "description": "Leverages Convolutional Neural Networks for precise handwriting recognition."
                },
                {
                    "title": "Comprehensive Workflow",
                    "description": "Covers data gathering, model training, and website deployment seamlessly."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["cnn"],
            ],
            "updated_at": datetime.strptime("2024-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 28,
            "title": "Follow Dragon | SpaceX Clone App",
            "headline": "Track SpaceX Dragon missions in real-time with Django-powered APIs.",
            "description": [
                "This Django project is designed to interact with external APIs, providing real-time SpaceX Dragon data and rendering it in sleek HTML templates.",
                "The core functionality lies in the `dragon_public` view, which fetches JSON data using custom headers and renders responsive templates.",
                "Includes additional views for route redirection and dynamic data rendering, ensuring seamless interaction for users."
            ],
            "demo_url": "https://follow-dragon.ridwaanhall.com/",
            "github_url": "https://github.com/ridwaanhall/follow-dragon-spacex",
            "image_url": f"{settings.BASE_URL}/static/img/project/follow_dragon_spacex.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "API Integration",
                    "description": "Fetch JSON data using custom headers for real-time mission tracking."
                },
                {
                    "title": "HTML Template Rendering",
                    "description": "Provides responsive designs for dynamic data visualization."
                },
                {
                    "title": "Django-Powered Flexibility",
                    "description": "Ensures robust performance and easy scalability with Django framework."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
            ],
            "updated_at": datetime.strptime("2024-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 29,
            "title": "MLBB Mabar VIP/VVIP Manager",
            "headline": "Streamline gaming sessions, skin requests, and hero selections for VIP players with Django.",
            "description": [
                "This Django-powered system simplifies the management of gaming sessions (Mabar), skin requests, hero preferences, and user feedback for Mobile Legends: Bang Bang.",
                "Tracks session status, supports both regular and VIP users, and ensures smooth communication with donors through a well-structured interface.",
                "Designed to enhance user experience, this system organizes requests efficiently and improves the overall gameplay collaboration process."
            ],
            "github_url": "https://github.com/ridwaanhall/management-mabar-VIP-MLBB",
            "image_url": f"{settings.BASE_URL}/static/img/project/mlbb_mabar_vip_manager.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Mabar Session Management",
                    "description": "Tracks gaming sessions with donor and user information, ensuring seamless coordination."
                },
                {
                    "title": "Bonus Skin Delivery",
                    "description": "Handles skin requests with automated delivery status tracking."
                },
                {
                    "title": "Hero Request System",
                    "description": "Lets users submit hero preferences, including lane and meta details."
                },
                {
                    "title": "Comment Album Tracking",
                    "description": "Manages and logs donor comments for streamlined feedback resolution."
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
            "title": "Ant Colony Optimization | Indonesia Real Map",
            "headline": "Optimize routes and visualize algorithm progress with ACO on Indonesia's map.",
            "description": [
                "This project implements the Ant Colony Optimization (ACO) algorithm on a real map of Indonesia.",
                "Features include configurable parameters for optimization, visualization tools to track algorithm progress, and hyperparameter tuning for enhanced performance.",
                "Designed to provide practical insights and improve efficiency in solving pathfinding and optimization problems."
            ],
            "github_url": "https://github.com/ridwaanhall/aco-algorithm",
            "image_url": f"{settings.BASE_URL}/static/img/project/default_project_image.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Real Map Implementation",
                    "description": "Leverages ACO to optimize routes using Indonesia's geographical data."
                },
                {
                    "title": "Progress Visualization",
                    "description": "Offers visual insights into the algorithm’s optimization process."
                },
                {
                    "title": "Hyperparameter Optimization",
                    "description": "Fine-tunes algorithm parameters to achieve superior results."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["aco"],
            ],
            "updated_at": datetime.strptime("2024-12-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
        },
        {
            "id": 31,
            "title": "NGL Link Spam",
            "headline": "Python script to message NGL without logging in.",
            "description": [
                "A Python tool to send custom or random messages to NGL, no login needed.",
                "It shows off web requests and API tricks, automating what’s usually manual.",
                "Built-in rate limits keep it chill to avoid spamming issues."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/ngl_link_spamming.webp",
            "github_url": "https://github.com/ridwaanhall/ngl-link-spamming",
            "is_featured": False,
            "features": [
                {
                    "title": "Custom Messages",
                    "description": "Send your own texts with ease.",
                },
                {
                    "title": "Random Texts",
                    "description": "Auto-generate messages for fun.",
                },
                {
                    "title": "No Login",
                    "description": "Straight to messaging, no hassle."
                }
            ],
            "tech_stack": [
                tech_stack["python"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 32,
            "title": "ridwaanhall.pythonanywhere.com",
            "headline": "Portfolio site with Vuexy HTML and Django, flexing GitHub stats.",
            "description": [
                "Another portfolio site, this time with Vuexy HTML and Django, packed with sections and a GitHub-powered stats dashboard.",
                "It’s got a polished look and smart backend to manage content easily, with secure admin access.",
                "The dashboard pulls yearly GitHub data to show off my coding hustle."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/ridwaanhall_pythonanywhere_com.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Loaded Pages",
                    "description": "Tons of sections like About, Projects, and more.",
                },
                {
                    "title": "Clean UI",
                    "description": "Vuexy HTML for a pro-level design.",
                },
                {
                    "title": "GitHub Stats",
                    "description": "Yearly coding insights via API.",
                },
                {
                    "title": "Mobile-Friendly",
                    "description": "Works great on any device."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["github_api"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 33,
            "title": "Gold Price & Music Recommender",
            "headline": "ML-powered gold price predictor and music suggestion system.",
            "description": [
                "This project uses machine learning to predict gold prices and recommend music tracks based on your vibe.",
                "For gold, I crunched historical data and economic trends to forecast prices with solid accuracy, testing multiple models to find the best fit.",
                "The music recommender analyzes your listening habits and song features to suggest tracks and artists you’ll love, mixing in some fresh finds."
            ],
            "github_url": "https://github.com/ridwaanhall/applied-machine-learning",
            "image_url": f"{settings.BASE_URL}/static/img/project/gold_price_prediction_and_music_recommendation_system.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Gold Forecasts",
                    "description": "Predicts prices to guide investment moves.",
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
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 34,
            "title": "Tokopedia Sentiment Analysis",
            "headline": "ML pipeline to analyze Tokopedia app reviews.",
            "description": [
                "A full pipeline for scraping and analyzing Tokopedia app reviews from Google Play, using ML to gauge sentiment.",
                "It digs into what users love or hate, helping devs prioritize fixes and features.",
                "Handles tricky Indonesian text—slang and all—with multiple models compared to find the best performer."
            ],
            "github_url": "https://github.com/ridwaanhall/Dicoding-Machine-Learning-Intermediate/tree/main/01_project",
            "image_url": f"{settings.BASE_URL}/static/img/project/sentiment_analysis_tokopedia_app.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Review Scraper",
                    "description": "Pulls fresh Play Store feedback.",
                },
                {
                    "title": "Text Cleanup",
                    "description": "Preps messy text for analysis.",
                },
                {
                    "title": "Feature Extraction",
                    "description": "Uses TF-IDF and Word2Vec for insights.",
                },
                {
                    "title": "Model Testing",
                    "description": "Pits ML models to find the champ.",
                },
                {
                    "title": "Sentiment Scores",
                    "description": "Predicts review vibes accurately."
                }
            ],
            "tech_stack": [
                tech_stack["python"],
                tech_stack["machine_learning"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 35,
            "title": "ridwaanhall.me",
            "headline": "Next.js portfolio rocking Once UI with top-notch performance.",
            "description": [
                "A Next.js portfolio using Once UI, built for speed, SEO, and global reach.",
                "It’s optimized to the max with Server Components, lazy images, and code splitting, scoring perfect on Lighthouse.",
                "Supports multiple languages, custom animations, and stays snappy no matter the device."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/ridwaanhall_me.webp",
            "github_url": "https://github.com/ridwaanhall/ridwaanhall.me",
            "is_featured": False,
            "features": [
                {
                    "title": "Once UI",
                    "description": "Full design system for sleek components.",
                },
                {
                    "title": "SEO Boost",
                    "description": "Auto-generated meta for search visibility.",
                },
                {
                    "title": "Responsive Layout",
                    "description": "Flawless on any screen size.",
                },
                {
                    "title": "Customizable",
                    "description": "Tweak everything with data attributes.",
                },
                {
                    "title": "Multilingual",
                    "description": "Supports global audiences with next-intl."
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
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 36,
            "title": "Neon AI",
            "headline": "AI chatbot built with Next.js and Once UI.",
            "description": [
                "Neon AI is a smart chatbot running on Next.js and Once UI, with smooth routing and unified APIs.",
                "It delivers instant responses with a conversational flow that feels natural, thanks to streaming tech.",
                "Keeps chats coherent with context tracking and pulls data to present answers in cool, visual ways."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/neon_ai.webp", 
            "github_url": "https://github.com/ridwaanhall/neon-ai",
            "demo_url": "https://ridwaanhall-ai.vercel.app",
            "is_featured": False,
            "features": [
                {
                    "title": "Smart Routing",
                    "description": "Next.js App Router for fast navigation.",
                },
                {
                    "title": "AI Power",
                    "description": "Unified API for text and tool calls.",
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
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 37,
            "title": "Instagram Analytics",
            "headline": "Python tool to break down Instagram follower data.",
            "description": [
                "A Python script to analyze Instagram followers and following, spotting mutuals, non-followers, and more.",
                "It helps influencers and managers find engagement gaps and networking wins by mapping relationships.",
                "Outputs detailed stats and lists for outreach or deeper dives, all from JSON data."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/instagram_following_followers.webp",
            "github_url": "https://github.com/ridwaanhall/instagram-following-followers",
            "demo_url": "https://instagram-following-followers.vercel.app",
            "is_featured": False,
            "features": [
                {
                    "title": "Follower Breakdown",
                    "description": "Lists mutuals and one-sided followers.",
                },
                {
                    "title": "Following Insights",
                    "description": "Tracks who you follow without reciprocation.",
                },
                {
                    "title": "JSON Support",
                    "description": "Handles Instagram data smoothly."
                }
            ],
            "tech_stack": [
                tech_stack["bulma"],
                tech_stack["django"],
                tech_stack["whitenoise"]
            ],
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 38,
            "title": "Lumina",
            "headline": "Auto-attendance tool for forgetful students.",
            "description": [
                "Lumina generates encrypted attendance codes fast, saving students from missing roll call.",
                "Built for schools, it fits various course setups with secure, valid codes.",
                "The interface is dead simple, perfect for those last-minute panics."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/lumina.webp",
            "github_url": "https://github.com/ridwaanhall/Lumina",
            "demo_url": "https://lupa-presensi.vercel.app",
            "is_featured": False,
            "features": [
                {
                    "title": "Code Generator",
                    "description": "Spits out secure codes instantly.",
                },
                {
                    "title": "Easy UI",
                    "description": "No fuss, even under pressure.",
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
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 39,
            "title": "OpenShop RESTful API",
            "headline": "RESTful API for managing products with Django REST Framework.",
            "description": [
                "A slick RESTful API to handle product data like a pro, built with Django REST Framework.",
                "Supports creating, reading, updating, deleting, and searching products with full CRUD and HATEOAS vibes.",
                "Includes soft delete, data validation, and proper status codes for a smooth experience."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/openshop_restful_api.webp",
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
            "title": "Bike Sharing Dashboard",
            "headline": "Interactive dashboard linking weather and bike rentals.",
            "description": [
                "A dashboard digging into how weather impacts bike rentals, showing trends by season, day, and conditions.",
                "It uses data analysis to help bike companies tweak fleet plans and pricing based on forecasts.",
                "Users can filter by temp, humidity, or time to spot patterns, with ML models predicting future demand."
            ],
            "demo_url": "https://ridwaanhall-bike-sharing-analytics.streamlit.app/",
            "github_url": "https://github.com/ridwaanhall/dicoding-bike-sharing-analysis",
            "image_url": f"{settings.BASE_URL}/static/img/project/bike_sharing_analysis_dashboard.webp",
            "is_featured": True,
            "features": [
                {
                    "title": "Season Trends",
                    "description": "Shows peak biking seasons.",
                },
                {
                    "title": "Weather Impact",
                    "description": "Links conditions to rental spikes.",
                },
                {
                    "title": "Day Breakdown",
                    "description": "Compares weekdays vs. weekends.",
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
            "updated_at": datetime.strptime("2025-04-17T17:49:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 41,
            "title": "Mobile Legends API & Site",
            "headline": "REST API and website for Mobile Legends game data.",
            "description": [
                "A REST API and website for Mobile Legends fans, serving up hero stats, rankings, and game insights.",
                "The API delivers clean endpoints for heroes, skills, and meta trends, perfect for devs building game tools. Docs are easy to navigate.",
                "The site breaks down complex data for casual players, with tips on hero matchups, builds, and counters based on the latest meta."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/mobile_legends_bang_bang_api_and_website.webp",
            "demo_url": "https://api-mobilelegends.vercel.app/",
            "github_url": "https://github.com/ridwaanhall/api-mobilelegends",
            "is_featured": True,
            "features": [
                {
                    "title": "Game API",
                    "description": "GET endpoints for hero stats and rankings.",
                },
                {
                    "title": "Dev Docs",
                    "description": "Next.js-powered guide for easy API use.",
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
            "updated_at": datetime.strptime("2025-04-20T14:24:22+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 42,
            "title": "PDDikti API",
            "headline": "API for Indonesia’s higher education data from PDDikti.",
            "description": [
                "An API to pull fresh data from PDDikti, Indonesia’s higher ed database, covering unis, programs, and more.",
                "It’s built for researchers and devs, with clear endpoints to grab structured info like accreditation stats.",
                "Caching and optimizations keep it fast even with heavy traffic, and the docs make it a breeze to use."
            ],
            "image_url": f"{settings.BASE_URL}/static/img/project/api_pddikti_kemendiksaintek.webp",
            "demo_url": "https://pddikti-docs.vercel.app/",
            "github_url": "https://github.com/ridwaanhall/api-pddikti",
            "is_featured": False,
            "features": [
                {
                    "title": "Edu Data",
                    "description": "Easy access to uni and program info.",
                },
                {
                    "title": "Dev-Friendly",
                    "description": "Simple setup for coders.",
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
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 43,
            "title": "belimadu.com",
            "headline": "E-commerce site for honey goodies, built with Django and Bootstrap on Vercel.",
            "description": [
                "Belimadu.com is an e-commerce hub for honey products, crafted with Django and Bootstrap, hosted on Vercel. It’s got a product catalog, health tips, WhatsApp ordering, and monthly deals.",
                "It’s a one-stop shop for honey lovers, blending useful articles with a smooth shopping flow. SEO tweaks help it pop up on Google searches.",
                "Customers can hit up WhatsApp for quick orders, and monthly promos keep things fresh with special offers."
            ],
            "demo_url": "https://belimadu.com",
            "image_url": f"{settings.BASE_URL}/static/img/project/belimadu_com.webp",
            "is_featured": True,
            "features": [
                {
                    "title": "Honey Catalog",
                    "description": "Lists products with crisp images and details.",
                },
                {
                    "title": "WhatsApp Orders",
                    "description": "Chat directly to place orders fast.",
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
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
        {
            "id": 44,
            "title": "ridwaanhall.com",
            "headline": "My personal portfolio site, powered by Django and TailwindCSS, running serverless on Vercel.",
            "description": [
                "This is my digital home base, built with Django and TailwindCSS, hosted serverless on Vercel. It’s got everything—about me, projects, blog, education, experience, and a slick dashboard.",
                "I mixed Django’s backend muscle with Tailwind’s clean styling to create a fast, modern site. Vercel’s serverless setup keeps it low-maintenance and snappy.",
                "The dashboard pulls live GitHub and WakaTime data to show my coding stats in real time. Plus, it’s fully responsive, looking sharp on phones, tablets, or desktops."
            ],
            "github_url": "https://github.com/ridwaanhall/ridwaanhall_com",
            "demo_url": f"{settings.BASE_URL}",
            "image_url": f"{settings.BASE_URL}/static/img/project/ridwaanhall_com.webp",
            "is_featured": True,
            "features": [
                {
                    "title": "Serverless Vibes",
                    "description": "Hosted on Vercel for max uptime and easy scaling.",
                },
                {
                    "title": "Live Dashboard",
                    "description": "Shows my GitHub and WakaTime stats in real time.",
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
            "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
        },
    ]