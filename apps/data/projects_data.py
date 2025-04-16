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
    }
    
    projects = [
            {
                "id": 1,
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
            {
                "id": 2,
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
                "id": 3,
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
                "id": 4,
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
                "is_featured": False,
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
                "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            },
            {
                "id": 5,
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
                "id": 6,
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
                "is_featured": False,
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
                "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
            },
            {
                "id": 7,
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
                "id": 8,
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
                "id": 9,
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
                "id": 10,
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
                "id": 11,
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
                "id": 12,
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
                "id": 13,
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
            }
        ]