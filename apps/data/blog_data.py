class BlogData:
    '''
    blog data maximum of is_featured true is only 2
    '''
    blogs = [
        {
            'id': 1,
            'title': 'Getting Started with Python: A Beginner\'s Guide',
            'description': 'Learn the basics of Python programming and why it\'s an excellent language for beginners.',
            'image_url': 'https://ridwaanhall.vercel.app/static/img/blog/start_with_python1.webp',
            'date': 'March 24, 2025',
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
            'image_url': 'https://ridwaanhall.vercel.app/static/img/blog/building_web_applictions_with_django.webp',
            'date': 'March 24, 2025',
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
            'image_url': 'https://ridwaanhall.vercel.app/static/img/blog/deep_learning_with_tensorflow_and_keras.webp',
            'date': 'March 24, 2025',
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
            'image_url': 'https://ridwaanhall.vercel.app/static/img/blog/effective_time_management_for_developers.webp',
            'date': 'March 24, 2025',
            'author': 'Ridwan Halim',
            'content': [
                "Time management is crucial for developers facing complex projects and tight deadlines. Techniques like the Pomodoro method (25 minutes of focused work followed by a short break) can significantly improve productivity while preventing burnout.",
                "Other effective strategies include timeboxing tasks, minimizing context switching, and setting clear boundaries between work and personal time. Learn how to implement these practices to become more efficient while maintaining creativity and problem-solving abilities."
            ],
            'tags': ['Productivity', 'Time Management', 'Developer Tips'],
            'is_featured': True
        },
    ]