class ProjectsData:
    '''
    projects maximum is featured true is 3
    '''
    projects = [
        {
            "id": 1,
            "title": "ridwaanhall.dev",
            "headline": "Personal portfolio website built with Django and TailwindCSS, deployed as serverless using Vercel.",
            "description": "A personal portfolio website built with Django and TailwindCSS, deployed as serverless using Vercel. Features sections for about, projects, blogs, education, experience, and a dynamic dashboard.",
            "github_url": "https://github.com/ridwaanhall/ridwaanhall_dev",
            "demo_url": "https://ridwaanhall.me",
            "image_url": "https://ridwaanhall.me/static/img/project/ridwaanhall_dev.webp",
            "is_featured": True,
            "features": [
                {
                    "title": "Serverless Architecture",
                    "description": "Deployed as a serverless application on Vercel for high availability and scalability.",
                },
                {
                    "title": "Interactive Dashboard",
                    "description": "Dynamic dashboard integrating GitHub and WakaTime APIs to display coding statistics and activities.",
                },
                {
                    "title": "Responsive Design",
                    "description": "Fully responsive design built with TailwindCSS to provide optimal viewing experience across all devices.",
                }
            ],
            "tech_stack": ["Python", "Django", "TailwindCSS", "Vercel", "GitHub API", "WakaTime API"],
        },
        {
            "id": 2,
            "title": "belimadu.com",
            "headline": "E-commerce website for honey products built with Django and Bootstrap, deployed using Vercel.",
            "description": "An e-commerce website for honey products built with Django and Bootstrap, deployed using Vercel. Features product catalog, articles about honey benefits, WhatsApp integration for direct orders, and monthly special offers.",
            "demo_url": "https://belimadu.com",
            "image_url": "https://ridwaanhall.me/static/img/project/belimadu_com.webp",
            "is_featured": True,
            "features": [
                {
                    "title": "Product Catalog",
                    "description": "Comprehensive honey product listings with detailed descriptions, pricing, and high-quality images.",
                },
                {
                    "title": "WhatsApp Integration",
                    "description": "Direct ordering system through WhatsApp API for seamless customer communication and order processing.",
                },
                {
                    "title": "Monthly Offers",
                    "description": "Dynamic monthly special offers section showcasing discounted products and seasonal honey varieties.",
                }
            ],
            "tech_stack": ["Python", "Django", "Bootstrap", "Vercel", "WhatsApp API"],
        },
        {
            "id": 3,
            "title": "Gold Price Prediction and Music Recommendation System",
            "headline": "Predict gold prices and recommend music tracks using machine learning algorithms.",
            "description": "This project focuses on predicting gold prices using machine learning to help investors and analysts make informed decisions. Additionally, it includes a music recommendation system to suggest tracks, artists, and albums based on user preferences and listening habits.",
            "github_url": "https://github.com/ridwaanhall/applied-machine-learning",
            "image_url": "https://ridwaanhall.me/static/img/project/gold_price_prediction_and_music_recommendation_system.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Gold Price Prediction",
                    "description": "Machine learning model to predict gold prices for informed investment and analysis.",
                },
                {
                    "title": "Music Recommendation System",
                    "description": "Suggests tracks, artists, and albums based on user preferences and listening habits.",
                }
            ],
            "tech_stack": ["Machine Learning", "Music Recommendation Algorithms"],
        },
        {
            "id": 4,
            "title": "Mobile Legends: Bang Bang API and Website",
            "headline": "RESTful API and website interface for Mobile Legends: Bang Bang data.",
            "description": "A comprehensive project that includes a RESTful API for Mobile Legends: Bang Bang data, interactive API documentation for developers, and a website interface for users to explore hero analytics, rankings, and game data.",
            "image_url": "https://ridwaanhall.me/static/img/project/mobile_legends_bang_bang_api_and_website.webp",
            "demo_url": "https://api-mobilelegends.vercel.app/",
            "github_url": "https://github.com/ridwaanhall/api-mobilelegends",
            "is_featured": False,
            "features": [
                {
                    "title": "RESTful API",
                    "description": "Provides read-only endpoints using GET methods for hero data, rankings, skills, and compatibility metrics.",
                },
                {
                    "title": "API Documentation",
                    "description": "Interactive documentation built with Next.js and Shadcn UI for a modern, user-friendly developer experience.",
                },
                {
                    "title": "User-friendly Website",
                    "description": "Web interface for casual users to browse hero statistics and game data without technical knowledge.",
                }
            ],
            "tech_stack": ["Django", "Python", "REST API", "Next.js", "Shadcn UI", "Vercel"],
        },
        {
            "id": 5,
            "title": "API PDDikti KEMENDIKSAINTEK",
            "headline": "API for accessing updated data from PDDikti KEMENDIKSAINTEK.",
            "description": "This project provides an easy-to-use API for accessing updated data from PDDikti KEMENDIKSAINTEK. It includes API endpoints for educational institution data and other related resources.",
            "image_url": "https://ridwaanhall.me/static/img/project/api_pddikti_kemendiksaintek.webp",
            "demo_url": "https://pddikti-docs.vercel.app/",
            "github_url": "https://github.com/ridwaanhall/api-pddikti",
            "is_featured": False,
            "features": [
                {
                    "title": "Easy Access to PDDikti Data",
                    "description": "API endpoints for retrieving data on educational institutions and more from PDDikti KEMENDIKSAINTEK.",
                },
                {
                    "title": "User-Friendly API",
                    "description": "Designed with simplicity and ease of use in mind for developers.",
                },
                {
                    "title": "Updated Data Integration",
                    "description": "Supports updated datasets from PDDikti for accuracy and relevance.",
                }
            ],
            "tech_stack": ["Python", "Django", "JavaScript", "CSS"],
        },
        {
            "id": 6,
            "title": "Bike Sharing Analysis Dashboard",
            "headline": "Explore the relationship between weather conditions and bike rentals with an interactive dashboard.",
            "description": "This project explores the relationship between weather conditions and bike rentals. It includes a dashboard to visualize trends, such as popular seasons, working days vs weekends, and the impact of weather on bike rental patterns.",
            "demo_url": "https://ridwaanhall-bike-sharing-analytics.streamlit.app/",
            "github_url": "https://github.com/ridwaanhall/dicoding-bike-sharing-analysis",
            "image_url": "https://ridwaanhall.me/static/img/project/bike_sharing_analysis_dashboard.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Seasonal Analysis",
                    "description": "Analysis of bike rentals to determine the most and least popular seasons.",
                },
                {
                    "title": "Weather Correlation",
                    "description": "Examination of how weather conditions affect the total bike rentals.",
                },
                {
                    "title": "Working Days vs Holidays",
                    "description": "Comparison of bike rental trends between weekdays and weekends/holidays.",
                },
                {
                    "title": "Streamlit Dashboard",
                    "description": "Interactive visualization of the analysis results using Streamlit.",
                }
            ],
            "tech_stack": ["Python", "Streamlit", "Data Analysis", "TensorFlow"],
        },
        {
            "id": 7,
            "title": "Sentiment Analysis Tokopedia App Using Machine Learning Techniques",
            "headline": "Comprehensive pipeline for sentiment analysis of Google Play Store reviews for the Tokopedia app.",
            "description": "This project implements a comprehensive pipeline for sentiment analysis of Google Play Store reviews for the Tokopedia app. It includes data scraping, preprocessing, feature extraction, and evaluation using various machine learning models.",
            "github_url": "https://github.com/ridwaanhall/Dicoding-Machine-Learning-Intermediate/tree/main/01_project",
            "image_url": "https://ridwaanhall.me/static/img/project/sentiment_analysis_tokopedia_app.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Data Scraping",
                    "description": "Scrapes user reviews from the Google Play Store using a custom scraper.",
                },
                {
                    "title": "Text Preprocessing",
                    "description": "Includes cleaning, case folding, tokenizing, stopword removal, and stemming.",
                },
                {
                    "title": "Feature Extraction",
                    "description": "Utilizes TF-IDF, Count Vectorization, and Word2Vec for feature representation.",
                },
                {
                    "title": "Model Evaluation",
                    "description": "Evaluates models like Logistic Regression, XGBoost, and Random Forest to determine the best-performing algorithm.",
                },
                {
                    "title": "Sentiment Prediction",
                    "description": "Provides percentage-based sentiment analysis results for new user reviews.",
                }
            ],
            "tech_stack": ["Python", "Machine Learning", "Text Processing"],
        },
        {
            "id": 8,
            "title": "ridwaanhall.pythonanywhere.com",
            "headline": "Personal portfolio website built with Vuexy HTML and Django, showcasing yearly stats via GitHub API.",
            "description": "A personal portfolio website crafted with Vuexy HTML and Django. Features sections for about, projects, blogs, education, experience, and a dynamic dashboard integrating yearly statistics through GitHub API.",
            "image_url": "https://ridwaanhall.me/static/img/project/ridwaanhall_pythonanywhere_com.webp",
            "is_featured": False,
            "features": [
                {
                    "title": "Website Pages",
                    "description": "Includes pages such as About, Career, Contact, Projects, Dashboard, Attendance, Playground, Decrypt, Login, Certificate, Coming Soon, Error, and Home, each with unique purposes and functionalities."
                },
                {
                    "title": "Professional Interface",
                    "description": "Built with Vuexy HTML for a modern and visually appealing design."
                },
                {
                    "title": "Yearly Stats Dashboard",
                    "description": "Integrated with GitHub API for yearly statistics."
                },
                {
                    "title": "Responsive Design",
                    "description": "Optimized for seamless viewing across all devices."
                }
            ],
            "tech_stack": ["Python", "Django", "Vuexy HTML", "GitHub API"],
        },
        {
            "id": 9,
            "title": "ridwaanhall.me",
            "headline": "Personal portfolio website built using the Once UI framework on Next.js.",
            "description": "A personal portfolio website leveraging the Once UI framework on Next.js, featuring responsive design, SEO optimization, customization options, and localization support.",
            "image_url": "https://ridwaanhall.me/static/img/project/ridwaanhall_me.webp",
            "github_url": "https://github.com/ridwaanhall/ridwaanhall.me",
            "is_featured": False,
            "features": [
                {
                    "title": "Once UI Framework",
                    "description": "Includes all tokens, components, and features of the Once UI framework."
                },
                {
                    "title": "SEO Optimization",
                    "description": "Automatic open-graph, X image generation, and metadata generation for better search engine visibility."
                },
                {
                    "title": "Responsive Design",
                    "description": "A responsive layout optimized for all screen sizes and timeless design."
                },
                {
                    "title": "Extensive Customization",
                    "description": "Endless customization options through data attributes."
                },
                {
                    "title": "Content Management",
                    "description": "Render sections conditionally, manage social links, and password-protect specific URLs."
                },
                {
                    "title": "Localization",
                    "description": "Supports multilingual content using the next-intl library for a wider audience reach."
                }
            ],
            "tech_stack": ["Next.js", "Once UI", "TypeScript", "SCSS", "MDX", "JavaScript"],
            "setup_instructions": "Refer to the repository README for detailed setup instructions and deployment processes."
        },
        {
            "id": 10,
            "title": "Neon AI",
            "headline": "AI Chatbot built using advanced tools and frameworks.",
            "description": "An AI chatbot leveraging the Once UI framework on Next.js, featuring advanced routing, React Server Components, and unified APIs for seamless integration and performance optimization.",
            "image_url": "https://ridwaanhall.me/static/img/project/neon_ai.webp", 
            "github_url": "https://github.com/ridwaanhall/neon-ai",
            "demo_url": "https://ridwaanhall-ai.vercel.app",
            "is_featured": False,
            "features": [
                {
                    "title": "Advanced Routing",
                    "description": "Optimized navigation and performance with Next.js App Router."
                },
                {
                    "title": "AI SDK",
                    "description": "Unified API for generating text, structured objects, and tool calls with LLMs."
                },
                {
                    "title": "Data Persistence",
                    "description": "Powered by Vercel Postgres and Blob for efficient data storage."
                }
            ],
            "tech_stack": ["Next.js", "Tailwind CSS", "TypeScript", "Vercel Postgres", "Radix UI"],
            "setup_instructions": "Refer to the README.md in the repository for setup details and deployment processes."
        },
        {
            "id": 11,
            "title": "Instagram Analytics",
            "headline": "Analyze Instagram followers and following data effectively.",
            "description": "A Python script to analyze Instagram followers and following data, providing various analytics such as mutual followers, non-followers, and more.",
            "image_url": "https://ridwaanhall.me/static/img/project/instagram_following_followers.webp",
            "github_url": "https://github.com/ridwaanhall/instagram-following-followers",
            "demo_url": "https://instagram-following-followers.vercel.app",
            "is_featured": False,
            "features": [
                {
                    "title": "Followers Analysis",
                    "description": "Counts and lists mutual followers, non-followers, and one-sided followers."
                },
                {
                    "title": "Following Analysis",
                    "description": "Counts and lists one-sided followings effectively."
                },
                {
                    "title": "JSON Compatibility",
                    "description": "Processes Instagram data formatted in JSON for better analytics."
                }
            ],
            "tech_stack": ["bulmaCSS", "Django", "Whitenoise"],
            "setup_instructions": "Clone the repository, place the required JSON files (following.json and followers_1.json), and run the script using Python."
        },
        {
            "id": 12,
            "title": "Lumina",
            "headline": "A solution for students who often forget attendance.",
            "description": "Lumina is an automated attendance code generator designed to help students overcome the challenge of forgetting attendance easily, quickly, and securely.",
            "image_url": "https://ridwaanhall.me/static/img/project/lumina.webp",
            "github_url": "https://github.com/ridwaanhall/Lumina",
            "demo_url": "https://lupa-presensi.vercel.app",
            "is_featured": False,
            "features": [
                {
                    "title": "Automatic Code Generator",
                    "description": "Generates new encrypted attendance codes instantly."
                },
                {
                    "title": "Intuitive Design",
                    "description": "A simple and easy-to-use interface, even in panic situations."
                },
                {
                    "title": "Secure Encryption",
                    "description": "Safe and reliable encryption process for attendance codes."
                }
            ],
            "tech_stack": ["Python", "Django", "Bulma", "Vercel", "Cloudflare"],
            "setup_instructions": "Refer to the README.md in the repository for setup details and deployment processes."
        }
    ]
