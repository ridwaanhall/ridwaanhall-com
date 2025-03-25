class ProjectsData:
    '''
    projects maximum is featured true is 3
    '''
    projects = [
        {
            'id': 1,
            'title': 'Flask AI Assistant',
            'description': 'A web-based AI assistant that uses OpenAI API to answer questions, generate content, and provide helpful information.',
            'github_url': 'https://github.com/ridwaanhall/Flask-AI-Assistant',
            'demo_url': 'https://flask-ai-assistant.herokuapp.com',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/3.jpeg',
            'is_featured': True,
            'features': [
                {
                    'title': 'Natural Language Processing',
                    'description': 'Integrates with GPT models to understand complex questions and generate human-like responses.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/2.jpeg',
                    'icon': 'chat'
                },
                {
                    'title': 'Multiple Modes',
                    'description': 'Supports different conversation modes including general chat, code assistance, and creative writing.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/3.jpeg',
                    'icon': 'light-bulb'
                },
                {
                    'title': 'Response History',
                    'description': 'Maintains conversation context and allows users to revisit previous interactions.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/3.jpeg',
                    'icon': 'settings'
                }
            ],
            'tech_stack': ['Python', 'Flask', 'OpenAI API', 'SQLite', 'Bootstrap'],
            'code_sample': 'import openai\nfrom flask import Flask, request\n\napp = Flask(__name__)\n\n@app.route(\'/chat\', methods=[\'POST\'])\ndef chat():\n    user_message = request.json.get(\'message\')\n    response = generate_response(user_message)\n    return {\'response\': response}',
            'setup_instructions': 'git clone https://github.com/ridwaanhall/Flask-AI-Assistant\ncd Flask-AI-Assistant\npip install -r requirements.txt\npython app.py'
        },
        {
            'id': 2,
            'title': 'Django E-commerce',
            'description': 'A full-featured e-commerce platform built with Django, featuring product management, cart functionality, and payment processing.',
            'github_url': 'https://github.com/ridwaanhall/django-ecommerce',
            'demo_url': 'https://django-ecommerce-demo.herokuapp.com',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/5.jpeg',
            'is_featured': True,
            'features': [
                {
                    'title': 'Product Catalog',
                    'description': 'Comprehensive product management with categories, search, and filtering options.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/4.jpeg',
                    'icon': 'box'
                },
                {
                    'title': 'Secure Checkout',
                    'description': 'Integration with Stripe for secure payment processing and order management.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/5.jpeg',
                    'icon': 'credit-card'
                }
            ],
            'tech_stack': ['Python', 'Django', 'PostgreSQL', 'Stripe API', 'AWS S3'],
            'code_sample': 'from django.db import models\n\nclass Product(models.Model):\n    name = models.CharField(max_length=200)\n    price = models.DecimalField(max_digits=10, decimal_places=2)\n    description = models.TextField()\n    image = models.ImageField(upload_to=\'products/\')\n\n    def __str__(self):\n        return self.name',
            'setup_instructions': 'git clone https://github.com/ridwaanhall/django-ecommerce\ncd django-ecommerce\npip install -r requirements.txt\npython manage.py migrate\npython manage.py runserver'
        },
        {
            'id': 3,
            'title': 'Twitter Sentiment Analysis',
            'description': 'A tool that analyzes Twitter data to determine sentiment and identify trends for marketing insights.',
            'github_url': 'https://github.com/ridwaanhall/twitter-sentiment',
            'demo_url': 'https://twitter-sentiment-analyzer.herokuapp.com',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/6.jpeg',
            'is_featured': True,
            'features': [
                {
                    'title': 'Real-time Analysis',
                    'description': 'Processes Twitter streams in real-time to provide immediate insights on public sentiment.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/7.jpeg',
                    'icon': 'smile'
                },
                {
                    'title': 'Data Visualization',
                    'description': 'Interactive dashboards with charts and graphs to visualize sentiment trends over time.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/8.jpeg',
                    'icon': 'trending-up'
                }
            ],
            'tech_stack': ['Python', 'FastAPI', 'Pandas', 'NLTK', 'Plotly', 'Twitter API'],
            'code_sample': 'import pandas as pd\nimport nltk\nfrom nltk.sentiment import SentimentIntensityAnalyzer\n\ndef analyze_tweets(tweets):\n    sia = SentimentIntensityAnalyzer()\n    results = []\n    \n    for tweet in tweets:\n        sentiment = sia.polarity_scores(tweet[\'text\'])\n        results.append({\'text\': tweet[\'text\'], \'sentiment\': sentiment})\n        \n    return results',
            'setup_instructions': 'git clone https://github.com/ridwaanhall/twitter-sentiment\ncd twitter-sentiment\npip install -r requirements.txt\nuvicorn main:app --reload'
        },
        {
            'id': 4,
            'title': 'MERN Task Manager',
            'description': 'A responsive task management application built with the MERN stack (MongoDB, Express, React, Node.js).',
            'github_url': 'https://github.com/ridwaanhall/mern-task-manager',
            'demo_url': 'https://mern-task-manager-demo.netlify.app',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/9.jpeg',
            'is_featured': False,
            'features': [
                {
                    'title': 'Drag-and-Drop Interface',
                    'description': 'Intuitive drag-and-drop interface for organizing tasks across different status categories.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/10.jpeg',
                    'icon': 'tasks'
                },
                {
                    'title': 'Real-time Collaboration',
                    'description': 'Socket.io integration for real-time updates when team members modify tasks.',
                    'image_url': 'https://api.slingacademy.com/public/sample-photos/11.jpeg',
                    'icon': 'users'
                }
            ],
            'tech_stack': ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Socket.io'],
            'code_sample': 'const express = require(\'express\');\nconst mongoose = require(\'mongoose\');\nconst Task = require(\'./models/Task\');\n\nconst app = express();\napp.use(express.json());\n\napp.get(\'/api/tasks\', async (req, res) => {\n    try {\n        const tasks = await Task.find();\n        res.json(tasks);\n    } catch (err) {\n        res.status(500).json({ message: err.message });\n    }\n});',
            'setup_instructions': 'git clone https://github.com/ridwaanhall/mern-task-manager\ncd mern-task-manager\nnpm install\nnpm run dev'
        }
    ]