class ProjectsData:
    '''
    projects maximum is featured true is 3
    '''
    projects = [
        {
            'id': 1,
            'title': 'ridwaanhall_dev',
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
            'description': 'This project focuses on predicting gold prices using machine learning to help investors and analysts make informed decisions. Additionally, it includes a music recommendation system to suggest tracks, artists, and albums based on user preferences and listening habits.',
            # 'demo_url': null,
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
            # 'setup_instructions': null
        },
        # {
        #     'id': 4,
        #     'title': 'MERN Task Manager',
        #     'description': 'A responsive task management application built with the MERN stack (MongoDB, Express, React, Node.js).',
        #     'github_url': 'https://github.com/ridwaanhall/mern-task-manager',
        #     'demo_url': 'https://mern-task-manager-demo.netlify.app',
        #     'image_url': 'https://api.slingacademy.com/public/sample-photos/9.jpeg',
        #     'is_featured': False,
        #     'features': [
        #         {
        #             'title': 'Drag-and-Drop Interface',
        #             'description': 'Intuitive drag-and-drop interface for organizing tasks across different status categories.',
        #             'image_url': 'https://api.slingacademy.com/public/sample-photos/10.jpeg',
        #             'icon': 'tasks'
        #         },
        #         {
        #             'title': 'Real-time Collaboration',
        #             'description': 'Socket.io integration for real-time updates when team members modify tasks.',
        #             'image_url': 'https://api.slingacademy.com/public/sample-photos/11.jpeg',
        #             'icon': 'users'
        #         }
        #     ],
        #     'tech_stack': ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Socket.io'],
        #     'code_sample': 'const express = require(\'express\');\nconst mongoose = require(\'mongoose\');\nconst Task = require(\'./models/Task\');\n\nconst app = express();\napp.use(express.json());\n\napp.get(\'/api/tasks\', async (req, res) => {\n    try {\n        const tasks = await Task.find();\n        res.json(tasks);\n    } catch (err) {\n        res.status(500).json({ message: err.message });\n    }\n});',
        #     'setup_instructions': 'git clone https://github.com/ridwaanhall/mern-task-manager\ncd mern-task-manager\nnpm install\nnpm run dev'
        # }
    ]