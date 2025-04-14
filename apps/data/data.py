from django.utils import timezone
import datetime

class AboutData:
    @staticmethod
    def is_working_hours():

        now = timezone.localtime()
        
        is_weekday = now.weekday() < 5
        is_work_hour = 9 <= now.hour < 15

        return is_weekday and is_work_hour

    @classmethod
    def get_about_data(cls):
        return [
            {
                "name": "Ridwan Halim",
                "username": "ridwaanhall",
                "image_url": "https://api.slingacademy.com/public/sample-photos/9.jpeg",
                "cv": "https://bit.ly/cv-ridwaanhall",
                "role": "Machine Learning Mentor",
                "location": {
                    "regency": "Sleman",
                    "province": "Special Region of Yogyakarta",
                    "prov": "Yogyakarta",
                    "country": "Indonesia",
                    "map_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126585.91904713991!2d110.29942949999999!3d-7.732935699999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a59bd800eed9d%3A0x8da2a5bd43977a33!2sSleman%20Regency%2C%20Special%20Region%20of%20Yogyakarta!5e0!3m2!1sen!2sid!4v1693559291713!5m2!1sen!2sid"
                },
                # "is_active": cls.is_working_hours(),
                "social_media": {
                    "github": "https://github.com/ridwaanhall",
                    "linkedin": "https://linkedin.com/in/ridwaanhall",
                    "x": "https://x.com/ridwaanhall",
                    "instagram": "https://instagram.com/ridwaanhall",
                    "medium": "https://medium.com/@ridwaanhall",
                    "email": "hi@ridwaanhall.com"
                },
                "skills": [
                    "Python",
                    "Django",
                    "TensorFlow",
                    "PyTorch",
                    "Flask"
                ],
            }
        ]


class BlogData:
    '''
    blog data maximum of is_featured true is only 2
    '''
    blogs = [
        {
            'id': 1,
            'title': 'Getting Started with Python: A Beginner\'s Guide',
            'description': 'Learn the basics of Python programming and why it\'s an excellent language for beginners.',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/1.jpeg',
            'date': 'January 10, 2023',
            'author': 'Ridwan Halim',
            'content': [
                "Python has become one of the most popular programming languages in the world due to its simplicity and versatility. Whether you're interested in web development, data science, or automation, Python provides a gentle learning curve and powerful capabilities.",
                "To get started with Python, first install it from python.org, then familiarize yourself with basic syntax and data structures. The Python community offers abundant resources for beginners, including documentation, tutorials, and forums where you can seek help."
            ],
            'tags': ['Python', 'Programming', 'Beginners'],
            'is_featured': False
        },
        {
            'id': 2,
            'title': 'Building Web Applications with Django',
            'description': 'Discover how Django makes web development faster and more secure with its batteries-included philosophy.',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/2.jpeg',
            'date': 'February 15, 2023',
            'author': 'Ridwan Halim',
            'content': [
                "Django is a high-level Python web framework that encourages rapid development and clean, pragmatic design. Built by experienced developers, Django takes care of much of the hassle of web development, so you can focus on writing your app without needing to reinvent the wheel.",
                "With its robust ORM, built-in admin interface, and emphasis on security, Django is perfect for projects of any size. This article explores how to set up a Django project, create models, and build views to create a fully functional web application."
            ],
            'tags': ['Django', 'Web Development', 'Python'],
            'is_featured': True
        },
        {
            'id': 3,
            'title': 'Deep Learning with TensorFlow and Keras',
            'description': 'An introduction to building neural networks using TensorFlow and Keras for machine learning projects.',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/3.jpeg',
            'date': 'March 22, 2023',
            'author': 'Ridwan Halim',
            'content': [
                "TensorFlow and Keras have revolutionized deep learning by making neural networks more accessible to developers. TensorFlow provides the backbone computational engine, while Keras offers a user-friendly API that simplifies the process of building and training models.",
                "In this article, we'll walk through creating a simple neural network for image classification, explaining key concepts like layers, activation functions, and how to train and evaluate your model on real data."
            ],
            'tags': ['TensorFlow', 'Keras', 'Deep Learning', 'AI'],
            'is_featured': False
        },
        {
            'id': 4,
            'title': 'Effective Time Management for Developers',
            'description': 'Practical strategies to boost productivity and maintain work-life balance as a software developer.',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/4.jpeg',
            'date': 'April 01, 2023',
            'author': 'Ridwan Halim',
            'content': [
                "Time management is crucial for developers facing complex projects and tight deadlines. Techniques like the Pomodoro method (25 minutes of focused work followed by a short break) can significantly improve productivity while preventing burnout.",
                "Other effective strategies include timeboxing tasks, minimizing context switching, and setting clear boundaries between work and personal time. Learn how to implement these practices to become more efficient while maintaining creativity and problem-solving abilities."
            ],
            'tags': ['Productivity', 'Time Management', 'Developer Tips'],
            'is_featured': True
        },
    ]
    
    
class CertificationsData:
    certifications = [
        {
            "id": 1,
            "title": "RESTful Web APIs with Django",
            "credential_url": "https://www.linkedin.com/learning/certificates/75dfc2562365bbe8c92e2d79c8c8b2ddd5313f935086a44ca98c31d2ce5ef43a",
            "year": "2024",
            "institution": "LinkedIn",
            "is_featured": True,
            "achievements": [
                "Created RESTful APIs using Django REST Framework with best practices",
                "Mastered serializers, filtering, pagination, and router implementations",
                "Deployed functional APIs with authentication and authorization"
            ]
        },
        {
            "id": 2,
            "title": "Applied Machine Learning",
            "credential_url": "https://www.dicoding.com/certificates/NVP74VLKRPR0",
            "year": "2024",
            "institution": "Dicoding Indonesia",
            "is_featured": True,
            "achievements": [
                "Learned ML system design using k-NN and Random Forest algorithms",
                "Built sentiment analysis models with Deep Learning and SVM",
                "Developed recommendation systems with Content-based and Collaborative Filtering"
            ]
        }
    ]


class EducationData:
    education = [
        {
            "degree": "B.Tech in Artificial Intelligence",
            "years": "2021 - 2025",
            "institution": "Universitas Teknologi Yogyakarta",
            "is_last": True,
            "achievements": [
                "Studied Algorithm Programming and Object-Oriented Programming",
                "Completed Web and Mobile Development courses",
                "Learned Big Data & Data Analytics",
                "Studied Machine Learning and Augmented Reality Technology",
                "Mastered Data Structures & Algorithms and Neural Networks"
            ]
        },
        {
            "degree": "Associate of Science in Natural Sciences",
            "years": "2018 - 2021",
            "institution": "MAS Al Mukmin Ngruki",
            "is_last": False,
            "achievements": [
                "Participated in Santri Pecinta Alam (SAPALA KAMUFISA).",
                "Engaged in environmental and outdoor activities as part of the society."
            ]
        },
        {
            "degree": "Junior High School Diploma",
            "years": "2015 - 2018",
            "institution": "MTsS Islam Ngruki",
            "is_last": False,
            "achievements": [
                "Memorized portions of the Quran.",
                "Practiced archery and taught Islamic religious knowledge.",
                "Learned foundational web development skills including HTML, CSS, and PHP."
            ]
        }
    ]


class ExperiencesData:
    experiences = [
        {
            "title": "Machine Learning Mentor",
            "company": "Coding Camp powered by DBS Foundation",
            "period": "Feb 2025 - Present",
            "is_current": True,
            "responsibilities": [
                "Mentoring a cohort of 25 students (Feb-Jul 2025) through weekly sessions, aiming for a minimum 88% graduation rate.",
                "Allocating 7+ hours per week, leading 1-hour weekly consultations, monitoring progress, and facilitating team-building activities.",
                "Supporting 50-75 students with 2-hour weekly technical and soft skills instruction across merged groups.",
                "Participating in 1.5-hour monthly program meetings and mentor development sessions."
            ]
        },
        {
            "title": "ML Ops Cohort",
            "company": "Coding Camp powered by DBS Foundation",
            "period": "Dec 2024 - Jan 2025",
            "is_current": False,
            "responsibilities": [
                "Learned principles of ML Ops for reliable and scalable machine learning systems.",
                "Gained insights into managing ML systems in production environments."
            ]
        },
        {
            "title": "Machine Learning Expert Cohort",
            "company": "Coding Camp powered by DBS Foundation",
            "period": "Oct 2024 - Dec 2024",
            "is_current": False,
            "responsibilities": [
                "Designed machine learning systems as part of structured projects.",
                "Developed predictive analytics models using algorithms like k-Nearest Neighbor, Random Forest, and AdaBoost.",
                "Built sentiment analysis models with Deep Learning and Support Vector Machine techniques.",
                "Applied computer vision techniques for image recognition and object detection.",
                "Created recommendation systems using Content-based and Collaborative Filtering approaches."
            ]
        },
        {
            "title": "Machine Learning Intermediate Cohort",
            "company": "Coding Camp powered by DBS Foundation",
            "period": "Jul 2024 - Sep 2024",
            "is_current": False,
            "responsibilities": [
                "Built advanced neural network models using TensorFlow and Keras.",
                "Implemented NLP projects for text classification and sentiment analysis.",
                "Developed deep learning models for time series analysis and image classification.",
                "Explored recommendation systems and reinforcement learning algorithms.",
                "Mastered generative AI concepts and model deployment strategies."
            ]
        },
        {
            "title": "Machine Learning Beginner Cohort",
            "company": "Coding Camp powered by DBS Foundation",
            "period": "Jan 2024 - Jun 2024",
            "is_current": False,
            "responsibilities": [
                "Learned foundational data visualization techniques using Google Sheets.",
                "Mastered Python basics and object-oriented programming principles.",
                "Studied supervised and unsupervised machine learning algorithms."
            ]
        },
        {
            "title": "Founder & CEO",
            "company": "Copilot ID",
            "period": "Jan 2023 - Present",
            "is_current": True,
            "responsibilities": [
                "Led the development of Python-based projects.",
                "Specialized in AI technologies and software frameworks such as Django and Flask."
            ]
        },
        {
            "title": "Chief Secretary",
            "company": "IKA-PPIM 2021",
            "period": "Sep 2021 - Present",
            "is_current": True,
            "responsibilities": [
                "Managed alumni data for over 200 individuals with filtering and graphical analysis.",
                "Prepared organizational documents and meeting summaries.",
                "Created user-friendly design interfaces for alumni management."
            ]
        },
        {
            "title": "Machine Learning Intern",
            "company": "YoungDev",
            "period": "Apr 2024 - May 2024",
            "is_current": False,
            "responsibilities": [
                "Developed predictive models using Python and Scikit-Learn.",
                "Created classification and regression models with high precision and accuracy."
            ]
        },
        {
            "title": "Machine Learning for Cyber Security Intern",
            "company": "iNeuron.ai",
            "period": "Jan 2024 - Jan 2024",
            "is_current": False,
            "responsibilities": [
                "Focused on a project related to phishing domain detection.",
                "Applied machine learning principles to enhance cybersecurity solutions."
            ]
        },
        {
            "title": "Assistant Squad Leader of Web Developer Intern",
            "company": "GAOTek Inc.",
            "period": "Apr 2024 - May 2024",
            "is_current": False,
            "responsibilities": [
                "Guided over 100 interns and ensured timely progress tracking.",
                "Facilitated daily meetings and communication among teams.",
                "Assisted interns with technical and project challenges."
            ]
        },
        {
            "title": "Deputy of Da’wah",
            "company": "IST (Student Organization of Al Mukmin Islamic Boarding School)",
            "period": "Sep 2019 - Sep 2020",
            "is_current": False,
            "responsibilities": [
                "Organized 50 Islamic boarding school students for teaching in nearby villages.",
                "Collaborated with other sections to create competitions for over 500 students.",
                "Enhanced the disciplinary environment within the boarding school."
            ]
        }
    ]


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