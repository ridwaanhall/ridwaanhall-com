class ProjectsData:
    '''
    projects maximum is featured true is 3
    '''
    
    tech_stack = {
        "python": {
            "name": "Python",
            "description": "Main programming language used for backend development"
        },
        "django": {
            "name": "Django",
            "description": "Web framework for building the backend application"
        },
        "tailwindcss": {
            "name": "TailwindCSS",
            "description": "Utility-first CSS framework for styling the frontend"
        },
        "vercel": {
            "name": "Vercel",
            "description": "Platform for serverless deployment and hosting"
        },
        "github_api": {
            "name": "GitHub API",
            "description": "API for fetching GitHub project statistics and activities"
        },
        "wakatime_api": {
            "name": "WakaTime API",
            "description": "API for retrieving coding time metrics and analytics"
        },
        "bootstrap": {
            "name": "Bootstrap",
            "description": "CSS framework for responsive design and components"
        },
        "machine_learning": {
            "name": "Machine Learning",
            "description": "Techniques and algorithms for predictive modeling and data analysis"
        },
        "music_recommendation": {
            "name": "Music Recommendation Algorithms",
            "description": "Algorithms for suggesting music tracks based on user preferences"
        },
        "rest_api": {
            "name": "REST API",
            "description": "Architectural style for designing networked applications"
        },
        "nextjs": {
            "name": "Next.js",
            "description": "React framework for server-rendered applications"
        },
        "shadcn_ui": {
            "name": "Shadcn UI",
            "description": "UI components and design system for building modern web applications"
        },
        "javascript": {
            "name": "JavaScript",
            "description": "Programming language for building interactive web applications"
        },
        "css": {
            "name": "CSS",
            "description": "Cascading Style Sheets for styling web pages"
        },
        "streamlit": {
            "name": "Streamlit",
            "description": "Framework for building data applications and dashboards in Python"
        },
        "tensorflow": {
            "name": "TensorFlow",
            "description": "Open-source library for machine learning and deep learning"
        },
        "once_ui": {
            "name": "Once UI",
            "description": "Design system and component library for building modern web applications"
        },
        "typescript": {
            "name": "TypeScript",
            "description": "Superset of JavaScript that adds static typing to the language"
        },
        "scss": {
            "name": "SCSS",
            "description": "Sass (Syntactically Awesome Style Sheets) for writing CSS with variables and nesting"
        },
        "mdx": {
            "name": "MDX",
            "description": "Markdown for JSX, allowing you to write JSX in Markdown documents"
        },
        "vercel_postgres": {
            "name": "Vercel Postgres",
            "description": "Managed PostgreSQL database service provided by Vercel"
        },
        "radix_ui": {
            "name": "Radix UI",
            "description": "Low-level UI components for building accessible and customizable user interfaces"
        },
        "bulma": {
            "name": "Bulma",
            "description": "CSS framework based on Flexbox for responsive design and components"
        },
        "whitenoise": {
            "name": "Whitenoise",
            "description": "Middleware for serving static files in Django applications"
        },
        "cloudflare": {
            "name": "Cloudflare",
            "description": "Web performance and security company providing CDN and DDoS protection"
        },
        "django_rest_framework": {
            "name": "Django REST Framework",
            "description": "Powerful toolkit for building Web APIs in Django applications"
        },
    }
    
    projects = [
        {
            "id": 1,
            "title": "ridwaanhall.dev",
            "headline": "Personal portfolio website built with Django and TailwindCSS, deployed as serverless using Vercel.",
            "description": [
                "A personal portfolio website built with Django and TailwindCSS, deployed as serverless using Vercel. Features sections for about, projects, blogs, education, experience, and a dynamic dashboard.",
                "This project showcases modern web development practices by combining Django's powerful backend capabilities with TailwindCSS's utility-first approach to styling. The serverless architecture on Vercel ensures optimal performance with minimal maintenance overhead.",
                "The site features a comprehensive API integration system that pulls real-time data from GitHub and WakaTime to display up-to-date coding statistics and project activities. The responsive design ensures seamless user experience across desktop, tablet, and mobile devices."
            ],
            "github_url": "https://github.com/ridwaanhall/ridwaanhall_dev",
            "demo_url": "https://ridwaanhall.com",
            "image_url": "https://ridwaanhall.com/static/img/project/ridwaanhall_dev.webp",
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
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["tailwindcss"],
                tech_stack["vercel"],
                tech_stack["github_api"],
                tech_stack["wakatime_api"]
            ],
        },
        {
            "id": 2,
            "title": "belimadu.com",
            "headline": "E-commerce website for honey products built with Django and Bootstrap, deployed using Vercel.",
            "description": [
                "An e-commerce website for honey products built with Django and Bootstrap, deployed using Vercel. Features product catalog, articles about honey benefits, WhatsApp integration for direct orders, and monthly special offers.",
                "The platform serves as a complete digital solution for honey vendors, combining informative content about honey's health benefits with a streamlined shopping experience. The site implements SEO best practices to increase organic traffic and visibility.",
                "Customer engagement is enhanced through monthly promotional campaigns and a direct communication channel via WhatsApp integration, allowing for personalized service and immediate response to customer inquiries."
            ],
            "demo_url": "https://belimadu.com",
            "image_url": "https://ridwaanhall.com/static/img/project/belimadu_com.webp",
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
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"], 
                tech_stack["bootstrap"],
                tech_stack["vercel"]
            ],
        },
        {
            "id": 3,
            "title": "Gold Price Prediction and Music Recommendation System",
            "headline": "Predict gold prices and recommend music tracks using machine learning algorithms.",
            "description": [
                "This project focuses on predicting gold prices using machine learning to help investors and analysts make informed decisions. Additionally, it includes a music recommendation system to suggest tracks, artists, and albums based on user preferences and listening habits.",
                "The gold price prediction component utilizes historical price data and economic indicators to forecast future gold prices with impressive accuracy. Multiple regression models and time series analysis techniques were implemented and compared to identify the most reliable prediction method.",
                "The music recommendation engine employs collaborative filtering and content-based approaches to create personalized playlists for users. The system analyzes listening patterns, genre preferences, and acoustic features of tracks to suggest music that aligns with individual tastes while introducing new discoveries."
            ],
            "github_url": "https://github.com/ridwaanhall/applied-machine-learning",
            "image_url": "https://ridwaanhall.com/static/img/project/gold_price_prediction_and_music_recommendation_system.webp",
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
            "tech_stack": [
                tech_stack["machine_learning"],
                tech_stack["music_recommendation"]
            ],
        },
        {
            "id": 4,
            "title": "Mobile Legends: Bang Bang API and Website",
            "headline": "RESTful API and website interface for Mobile Legends: Bang Bang data.",
            "description": [
                "A comprehensive project that includes a RESTful API for Mobile Legends: Bang Bang data, interactive API documentation for developers, and a website interface for users to explore hero analytics, rankings, and game data.",
                "This platform serves as a central hub for game enthusiasts and developers interested in Mobile Legends data. The API offers detailed endpoints for heroes, skills, equipment, and meta statistics that can be integrated into third-party applications and tools.",
                "The accompanying website provides intuitive visualization of complex game data, making it accessible to casual players looking to improve their gameplay. Advanced features include hero compatibility metrics, counter-pick suggestions, and optimal build paths based on current meta analysis."
            ],
            "image_url": "https://ridwaanhall.com/static/img/project/mobile_legends_bang_bang_api_and_website.webp",
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
            "tech_stack": [
                tech_stack["django"],
                tech_stack["python"],
                tech_stack["rest_api"],
                tech_stack["nextjs"],
                tech_stack["shadcn_ui"],
                tech_stack["vercel"]
            ],
        },
        {
            "id": 5,
            "title": "API PDDikti KEMENDIKSAINTEK",
            "headline": "API for accessing updated data from PDDikti KEMENDIKSAINTEK.",
            "description": [
                "This project provides an easy-to-use API for accessing updated data from PDDikti KEMENDIKSAINTEK. It includes API endpoints for educational institution data and other related resources.",
                "The API simplifies the process of retrieving educational data from Indonesia's official higher education database. Researchers, educational institutions, and developers can access structured information about universities, colleges, programs, and accreditation statuses through standardized endpoints.",
                "Designed with performance in mind, the API implements caching strategies and optimization techniques to handle high request volumes while maintaining quick response times. Comprehensive documentation guides users through authentication, request formation, and data interpretation."
            ],
            "image_url": "https://ridwaanhall.com/static/img/project/api_pddikti_kemendiksaintek.webp",
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
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["javascript"],
                tech_stack["css"]
            ],
        },
        {
            "id": 6,
            "title": "Bike Sharing Analysis Dashboard",
            "headline": "Explore the relationship between weather conditions and bike rentals with an interactive dashboard.",
            "description": [
                "This project explores the relationship between weather conditions and bike rentals. It includes a dashboard to visualize trends, such as popular seasons, working days vs weekends, and the impact of weather on bike rental patterns.",
                "Using advanced data analysis techniques, the dashboard presents insights that can help bike-sharing companies optimize their fleet distribution and pricing strategies based on weather forecasts and historical patterns.",
                "The interactive visualizations allow users to filter data by multiple parameters including temperature ranges, humidity levels, windspeed, and time periods to identify specific correlations that influence rental behaviors. Machine learning models provide predictive analytics for future rental demands based on weather forecasts."
            ],
            "demo_url": "https://ridwaanhall-bike-sharing-analytics.streamlit.app/",
            "github_url": "https://github.com/ridwaanhall/dicoding-bike-sharing-analysis",
            "image_url": "https://ridwaanhall.com/static/img/project/bike_sharing_analysis_dashboard.webp",
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
            "tech_stack": [
                tech_stack["python"],
                tech_stack["streamlit"],
                tech_stack["tensorflow"]
            ],
        },
        {
            "id": 7,
            "title": "Sentiment Analysis Tokopedia App Using Machine Learning Techniques",
            "headline": "Comprehensive pipeline for sentiment analysis of Google Play Store reviews for the Tokopedia app.",
            "description": [
                "This project implements a comprehensive pipeline for sentiment analysis of Google Play Store reviews for the Tokopedia app. It includes data scraping, preprocessing, feature extraction, and evaluation using various machine learning models.",
                "The sentiment analysis system extracts valuable customer insights from thousands of user reviews, helping identify specific strengths and weaknesses of the Tokopedia application from the user perspective. These insights can guide product development priorities and customer experience improvements.",
                "The pipeline employs multiple natural language processing techniques to handle the complexities of Indonesian language text, including slang, abbreviations, and mixed-language content commonly found in user reviews. Comparative analysis between different machine learning models reveals the most effective approaches for this specific domain."
            ],
            "github_url": "https://github.com/ridwaanhall/Dicoding-Machine-Learning-Intermediate/tree/main/01_project",
            "image_url": "https://ridwaanhall.com/static/img/project/sentiment_analysis_tokopedia_app.webp",
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
            "tech_stack": [
                tech_stack["python"],
                tech_stack["machine_learning"]
            ],
        },
        {
            "id": 8,
            "title": "ridwaanhall.pythonanywhere.com",
            "headline": "Personal portfolio website built with Vuexy HTML and Django, showcasing yearly stats via GitHub API.",
            "description": [
                "A personal portfolio website crafted with Vuexy HTML and Django. Features sections for about, projects, blogs, education, experience, and a dynamic dashboard integrating yearly statistics through GitHub API.",
                "This portfolio platform combines elegant visual design with powerful backend functionality to create a comprehensive showcase of professional accomplishments and technical capabilities. The site structure follows best practices for content organization and user flow.",
                "Behind the scenes, the site implements custom Django models and views to manage content dynamically, allowing for easy updates and maintenance. Authentication systems protect administrative areas while providing seamless access to public-facing content."
            ],
            "image_url": "https://ridwaanhall.com/static/img/project/ridwaanhall_pythonanywhere_com.webp",
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
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["github_api"]
            ],
        },
        {
            "id": 9,
            "title": "ridwaanhall.me",
            "headline": "Personal portfolio website built using the Once UI framework on Next.js.",
            "description": [
                "A personal portfolio website leveraging the Once UI framework on Next.js, featuring responsive design, SEO optimization, customization options, and localization support.",
                "This modern portfolio implements advanced Next.js features including Server Components, optimized image loading, and efficient code splitting to deliver exceptional performance metrics. The site achieves perfect Lighthouse scores across performance, accessibility, best practices, and SEO dimensions.",
                "The internationalization system supports multiple languages through a robust content management approach that maintains consistent design and functionality across language variants. Custom animations and interactive elements enhance user engagement without compromising load times."
            ],
            "image_url": "https://ridwaanhall.com/static/img/project/ridwaanhall_me.webp",
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
            "tech_stack": [
                tech_stack["nextjs"],
                tech_stack["once_ui"],
                tech_stack["typescript"],
                tech_stack["scss"],
                tech_stack["mdx"],
                tech_stack["javascript"]
            ],
            "setup_instructions": "Refer to the repository README for detailed setup instructions and deployment processes."
        },
        {
            "id": 10,
            "title": "Neon AI",
            "headline": "AI Chatbot built using advanced tools and frameworks.",
            "description": [
                "An AI chatbot leveraging the Once UI framework on Next.js, featuring advanced routing, React Server Components, and unified APIs for seamless integration and performance optimization.",
                "The Neon AI platform reimagines conversational AI interfaces by combining cutting-edge language model capabilities with intuitive user experience design. The architecture leverages streaming responses for immediate feedback and realistic conversation flow.",
                "The system includes context-aware conversation history management to maintain coherent multi-turn dialogues while respecting privacy and security considerations. Integration with structured data sources enables the chatbot to retrieve and present information in visually appealing formats beyond simple text responses."
            ],
            "image_url": "https://ridwaanhall.com/static/img/project/neon_ai.webp", 
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
            "tech_stack": [
                tech_stack["nextjs"],
                tech_stack["tailwindcss"],
                tech_stack["typescript"],
                tech_stack["vercel_postgres"],
                tech_stack["radix_ui"]
            ],
            "setup_instructions": "Refer to the README.md in the repository for setup details and deployment processes."
        },
        {
            "id": 11,
            "title": "Instagram Analytics",
            "headline": "Analyze Instagram followers and following data effectively.",
            "description": [
                "A Python script to analyze Instagram followers and following data, providing various analytics such as mutual followers, non-followers, and more.",
                "This tool helps social media managers and influencers optimize their Instagram growth strategy by identifying key relationship patterns within their follower network. The analytics highlight engagement opportunities with accounts that have reciprocal interest versus those that don't follow back.",
                "Beyond simple following/follower ratios, the system categorizes relationships to identify potential networking opportunities and engagement gaps. The application provides both aggregate statistics and detailed lists that can be exported for further analysis or direct outreach campaigns."
            ],
            "image_url": "https://ridwaanhall.com/static/img/project/instagram_following_followers.webp",
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
            "tech_stack": [
                tech_stack["bulma"],
                tech_stack["django"],
                tech_stack["whitenoise"]
            ],
            "setup_instructions": "Clone the repository, place the required JSON files (following.json and followers_1.json), and run the script using Python."
        },
        {
            "id": 12,
            "title": "Lumina",
            "headline": "A solution for students who often forget attendance.",
            "description": [
                "Lumina is an automated attendance code generator designed to help students overcome the challenge of forgetting attendance easily, quickly, and securely.",
                "Developed specifically for educational settings, this tool addresses a common pain point for students by providing instant access to encrypted attendance codes that comply with institutional requirements. The system works across multiple course structures and attendance systems.",
                "The encryption algorithm ensures that generated codes maintain their validity while protecting against unauthorized use or manipulation. User experience was prioritized throughout development, resulting in a streamlined interface that requires minimal steps even in time-constrained situations."
            ],
            "image_url": "https://ridwaanhall.com/static/img/project/lumina.webp",
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
            "tech_stack": [
                tech_stack["python"],
                tech_stack["django"],
                tech_stack["bulma"],
                tech_stack["vercel"],
                tech_stack["cloudflare"]
            ],
            "setup_instructions": "Refer to the README.md in the repository for setup details and deployment processes."
        },
        {
            "id": 13,
            "title": "NGL Link Spam",
            "headline": "Send messages to NGL without logging in.",
            "description": [
                "A Python project that allows users to send messages to NGL using different options, including custom messages and random messages, without requiring login credentials.",
                "This automation tool demonstrates practical application of web requests and API interactions by interfacing with NGL's messaging infrastructure. The project showcases how Python can be used to programmatically interact with web services that primarily expect human interaction.",
                "The implementation includes rate limiting and request management capabilities to ensure responsible usage and prevent service disruptions. Different messaging modes provide flexibility for various use cases, from testing to automated notifications."
            ],
            "image_url": "https://ridwaanhall.com/static/img/project/ngl_link_spamming.webp",
            "github_url": "https://github.com/ridwaanhall/ngl-link-spamming",
            "is_featured": False,
            "features": [
                {
                    "title": "Custom Message Sender",
                    "description": "Send personalized messages to NGL targets efficiently."
                },
                {
                    "title": "Random Message Generator",
                    "description": "Generate and send random messages with ease."
                },
                {
                    "title": "No Login Required",
                    "description": "Send messages directly without needing to log in to NGL."
                }
            ],
            "tech_stack": [
                tech_stack["python"]
            ],
            "setup_instructions": "Clone the repository, install the dependencies listed in requirements.txt, and use one of the available scripts (send_custom.py, send_random.py, or send_msg.py) to send messages."
        }
    ]
