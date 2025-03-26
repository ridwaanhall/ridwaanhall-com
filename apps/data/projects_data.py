class ProjectsData:
    '''
    projects maximum is featured true is 3
    '''
    projects = [
        {
            'id': 1,
            'title': 'ridwaanhall_dev',
            "headline": "Personal portfolio website built with Django and TailwindCSS, deployed as serverless using Vercel.",
            'description': 'A personal portfolio website built with Django and TailwindCSS, deployed as serverless using Vercel. Features sections for about, projects, blogs, education, experience, and a dynamic dashboard.',
            'github_url': 'https://github.com/ridwaanhall/ridwaanhall_dev',
            'demo_url': 'https://ridwaanhall-dev.vercel.app',
            'image_url': 'https://ridwaanhall-dev.vercel.app/static/img/project/ridwaanhall_dev.webp',
            'is_featured': True,
            'features': [
                {
                    'title': 'Serverless Architecture',
                    'description': 'Deployed as a serverless application on Vercel for high availability and scalability.',
                },
                {
                    'title': 'Interactive Dashboard',
                    'description': 'Dynamic dashboard integrating GitHub and WakaTime APIs to display coding statistics and activities.',
                },
                {
                    'title': 'Responsive Design',
                    'description': 'Fully responsive design built with TailwindCSS to provide optimal viewing experience across all devices.',
                }
            ],
            'tech_stack': ['Python', 'Django', 'TailwindCSS', 'Vercel', 'GitHub API', 'WakaTime API'],
            'setup_instructions': 'git clone https://github.com/ridwaanhall/ridwaanhall_dev\ncd ridwaanhall_dev\npip install -r requirements.txt\npython manage.py migrate\npython manage.py runserver'
        },
        {
            'id': 2,
            'title': 'My Lovely Honey',
            "headline": "E-commerce website for honey products built with Django and Bootstrap, deployed using Vercel.",
            'description': 'An e-commerce website for honey products built with Django and Bootstrap, deployed using Vercel. Features product catalog, articles about honey benefits, WhatsApp integration for direct orders, and monthly special offers.',
            'demo_url': 'https://belimadu.com',
            'image_url': 'https://ridwaanhall-dev.vercel.app/static/img/project/belimadu_com.webp',
            'is_featured': True,
            'features': [
                {
                    'title': 'Product Catalog',
                    'description': 'Comprehensive honey product listings with detailed descriptions, pricing, and high-quality images.',
                },
                {
                    'title': 'WhatsApp Integration',
                    'description': 'Direct ordering system through WhatsApp API for seamless customer communication and order processing.',
                },
                {
                    'title': 'Monthly Offers',
                    'description': 'Dynamic monthly special offers section showcasing discounted products and seasonal honey varieties.',
                }
            ],
            'tech_stack': ['Python', 'Django', 'Bootstrap', 'Vercel', 'WhatsApp API'],
            'setup_instructions': 'git clone https://github.com/ridwaanhall/my-lovely-honey\ncd my-lovely-honey\npip install -r requirements.txt\npython manage.py migrate\npython manage.py runserver'
        },
        {
            'id': 3,
            'title': 'Gold Price Prediction and Music Recommendation System',
            'headline': 'Predict gold prices and recommend music tracks using machine learning algorithms.',
            'description': 'This project focuses on predicting gold prices using machine learning to help investors and analysts make informed decisions. Additionally, it includes a music recommendation system to suggest tracks, artists, and albums based on user preferences and listening habits.',
            'github_url': "https://github.com/ridwaanhall/applied-machine-learning",
            'is_featured': True,
            'features': [
                {
                    'title': 'Gold Price Prediction',
                    'description': 'Machine learning model to predict gold prices for informed investment and analysis.',
                },
                {
                    'title': 'Music Recommendation System',
                    'description': 'Suggests tracks, artists, and albums based on user preferences and listening habits.',
                }
            ],
            'tech_stack': ['Machine Learning', 'Music Recommendation Algorithms'],
        },
        {
            'id': 4,
            'title': 'Mobile Legends: Bang Bang API and Website',
            'headline': 'RESTful API and website interface for Mobile Legends: Bang Bang data.',
            'description': 'A comprehensive project that includes a RESTful API for Mobile Legends: Bang Bang data, interactive API documentation for developers, and a website interface for users to explore hero analytics, rankings, and game data.',
            'image_url': 'https://ridwaanhall-dev.vercel.app/static/img/project/mobile_legends_bang_bang_api_and_website.webp',
            'demo_url': "https://api-mobilelegends.vercel.app/",
            'github_url': "https://github.com/ridwaanhall/api-mobilelegends",
            'is_featured': False,
            'features': [
                {
                    'title': 'RESTful API',
                    'description': 'Provides read-only endpoints using GET methods for hero data, rankings, skills, and compatibility metrics.',
                },
                {
                    'title': 'API Documentation',
                    'description': 'Interactive documentation built with Next.js and Shadcn UI for a modern, user-friendly developer experience.',
                },
                {
                    'title': 'User-friendly Website',
                    'description': 'Web interface for casual users to browse hero statistics and game data without technical knowledge.',
                }
            ],
            'tech_stack': ['Django', 'Python', 'REST API', 'Next.js', 'Shadcn UI', 'Vercel'],
        },
        {
            'id': 5,
            'title': 'API PDDikti KEMENDIKSAINTEK',
            'headline': 'API for accessing updated data from PDDikti KEMENDIKSAINTEK.',
            'description': 'This project provides an easy-to-use API for accessing updated data from PDDikti KEMENDIKSAINTEK. It includes API endpoints for educational institution data and other related resources.',
            "image_url": "https://ridwaanhall-dev.vercel.app/static/img/project/api_pddikti_kemendiksaintek.webp",
            'demo_url': "https://pddikti-docs.vercel.app/",
            'github_url': "https://github.com/ridwaanhall/api-pddikti",
            'is_featured': False,
            'features': [
                {
                    'title': 'Easy Access to PDDikti Data',
                    'description': 'API endpoints for retrieving data on educational institutions and more from PDDikti KEMENDIKSAINTEK.',
                },
                {
                    'title': 'User-Friendly API',
                    'description': 'Designed with simplicity and ease of use in mind for developers.',
                },
                {
                    'title': 'Updated Data Integration',
                    'description': 'Supports updated datasets from PDDikti for accuracy and relevance.',
                }
            ],
            'tech_stack': ['Python', 'Django', 'JavaScript', 'CSS'],
        },
    ]
