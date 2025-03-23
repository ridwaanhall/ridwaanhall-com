class ProjectsData:
    projects = [
        {
            'id': 1,
            'title': 'AI-Powered Chatbot',
            'description': 'An advanced chatbot that uses AI to provide intelligent responses and automate customer support.',
            'github_url': 'https://github.com/example/repo',
            'demo_url': 'https://example.com/demo',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/3.jpeg',
            'is_featured': True,
            'features': [
                {
                    'title': 'Natural Language Processing',
                    'description': 'Utilizes state-of-the-art NLP techniques to understand and respond to user queries with remarkable accuracy.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/2.jpeg',
                    'icon': 'chat'
                },
                {
                    'title': 'Machine Learning',
                    'description': 'Learns from interactions to improve its responses over time, providing an increasingly personalized user experience.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/3.jpeg',
                    'icon': 'light-bulb'
                },
                {
                    'title': 'Integration Ready',
                    'description': 'Easily integrates with existing systems through well-documented APIs and webhook support for seamless deployment.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/3.jpeg',
                    'icon': 'settings'
                }
            ],
            'tech_stack': ['Python', 'Flask', 'TensorFlow', 'React', 'Docker'],
            'code_sample': 'import openai\nfrom flask import Flask, request\n\napp = Flask(__name__)\n\n@app.route(\'/chat\', methods=[\'POST\'])\ndef chat():\n    user_message = request.json.get(\'message\')\n    response = generate_response(user_message)\n    return {\'response\': response}',
            'setup_instructions': 'git clone https://github.com/example/repo\ncd repo\npip install -r requirements.txt\npython app.py'
        },
        {
            'id': 2,
            'title': 'E-commerce Platform',
            'description': 'A fully-featured e-commerce solution with payment processing and inventory management.',
            'github_url': 'https://github.com/example/ecommerce',
            'demo_url': 'https://example.com/ecommerce-demo',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/5.jpeg',
            'is_featured': True,
            'features': [
                {
                    'title': 'Product Management',
                    'description': 'Allows easy addition, removal, and updating of products in the inventory.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/4.jpeg',
                    'icon': 'box'
                },
                {
                    'title': 'Payment Gateway Integration',
                    'description': 'Seamlessly integrates with popular payment gateways to facilitate secure transactions.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/5.jpeg',
                    'icon': 'credit-card'
                }
            ],
        },
        {
            'id': 3,
            'title': 'Social Media Analytics Tool',
            'description': 'A tool to analyze social media trends and provide insights on user engagement.',
            'github_url': 'https://github.com/example/social-media-analytics',
            'demo_url': 'https://example.com/social-media-analytics-demo',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/6.jpeg',
            'is_featured': False,
            'features': [
                {
                    'title': 'Sentiment Analysis',
                    'description': 'Analyzes user sentiment from social media posts to gauge public opinion.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/7.jpeg',
                    'icon': 'smile'
                },
                {
                    'title': 'Trend Analysis',
                    'description': 'Identifies trending topics and hashtags to help businesses stay ahead of the curve.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/8.jpeg',
                    'icon': 'trending-up'
                }
            ],
            'tech_stack': ['Python', 'Django', 'Pandas', 'React', 'Docker'],
            'code_sample': 'import pandas as pd\nfrom django.shortcuts import render\n\ndef analyze(request):\n    data = pd.read_csv(\'social_media_data.csv\')\n    analysis = perform_analysis(data)\n    return render(request, \'analysis.html\', {\'analysis\': analysis})',
            'setup_instructions': 'git clone https://github.com/example/social-media-analytics\ncd social-media-analytics\npip install -r requirements.txt\npython manage.py runserver'
        },
        {
            'id': 4,
            'title': 'Project Management Tool',
            'description': 'A comprehensive project management tool to help teams collaborate and manage tasks efficiently.',
            'github_url': 'https://github.com/example/project-management',
            'demo_url': 'https://example.com/project-management-demo',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/9.jpeg',
            'is_featured': False,
            'features': [
                {
                    'title': 'Task Management',
                    'description': 'Allows teams to create, assign, and track tasks with ease.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/10.jpeg',
                    'icon': 'tasks'
                },
                {
                    'title': 'Team Collaboration',
                    'description': 'Facilitates communication and collaboration among team members.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/11.jpeg',
                    'icon': 'users'
                }
            ],
            'tech_stack': ['JavaScript', 'Node.js', 'Express', 'MongoDB', 'React'],
            'code_sample': 'const express = require(\'express\');\nconst app = express();\n\napp.get(\'/tasks\', (req, res) => {\n    res.send(\'Task management endpoint\');\n});\n\napp.listen(3000, () => {\n    console.log(\'Server is running on port 3000\');\n});',
            'setup_instructions': 'git clone https://github.com/example/project-management\ncd project-management\nnpm install\nnpm start'
        }
    ]