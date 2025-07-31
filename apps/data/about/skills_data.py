from django.conf import settings


class SkillsData:
    # Dictionary of all available skills with easy-to-use keys
    tech_stack = {
        "python": {
            "name": "Python",
            "description": "Versatile programming language for web development, data science, and automation",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/python-original.svg"
        },
        "php": {
            "name": "PHP",
            "description": "Server-side scripting language for dynamic web applications",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/php-original.svg"
        },
        "javascript": {
            "name": "JavaScript",
            "description": "Dynamic programming language for interactive web experiences",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/javascript-original.svg"
        },
        "django": {
            "name": "Django",
            "description": "High-level Python web framework for rapid development",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/django-plain.svg"
        },
        "flask": {
            "name": "Flask",
            "description": "Lightweight and flexible Python web framework",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/flask-original.svg"
        },
        "react": {
            "name": "React",
            "description": "JavaScript library for building user interfaces",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/react-original.svg"
        },
        "nextjs": {
            "name": "Next.js",
            "description": "React framework for production-ready web applications",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/nextjs-original.svg"
        },
        "html5": {
            "name": "HTML5",
            "description": "Modern markup language for structuring web content",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/html5-original.svg"
        },
        "css3": {
            "name": "CSS3",
            "description": "Styling language for beautiful web design",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/css3-original.svg"
        },
        "bootstrap": {
            "name": "Bootstrap",
            "description": "Popular CSS framework for responsive design",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/bootstrap-original.svg"
        },
        "tailwindcss": {
            "name": "TailwindCSS",
            "description": "Utility-first CSS framework for rapid UI development",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/tailwindcss-original.svg"
        },
        "bulma": {
            "name": "Bulma",
            "description": "Modern CSS framework based on Flexbox",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/bulma-plain.svg"
        },
        "nodejs": {
            "name": "Node.js",
            "description": "JavaScript runtime for server-side development",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/nodejs-original.svg"
        },
        "materialui": {
            "name": "Material-UI",
            "description": "React components implementing Google's Material Design",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/materialui-original.svg"
        },
        "typescript": {
            "name": "TypeScript",
            "description": "Typed superset of JavaScript for better development",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/typescript-original.svg"
        },
        "laravel": {
            "name": "Laravel",
            "description": "Elegant PHP framework for web artisans",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/laravel-original.svg"
        },
        "tensorflow": {
            "name": "TensorFlow",
            "description": "Open-source machine learning framework",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/tensorflow-original.svg"
        },
        "pytorch": {
            "name": "PyTorch",
            "description": "Deep learning framework with dynamic computation graphs",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/pytorch-original.svg"
        },
        "keras": {
            "name": "Keras",
            "description": "High-level neural networks API for deep learning",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/keras-original.svg"
        },
        "scikitlearn": {
            "name": "Scikit-learn",
            "description": "Machine learning library for Python",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/scikitlearn-original.svg"
        },
        "mysql": {
            "name": "MySQL",
            "description": "Popular relational database management system",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/mysql-original.svg"
        },
        "sqlite": {
            "name": "SQLite",
            "description": "Lightweight embedded relational database",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/sqlite-original.svg"
        },
        "mongodb": {
            "name": "MongoDB",
            "description": "NoSQL document database for modern applications",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/mongodb-original.svg"
        },
        "postgresql": {
            "name": "PostgreSQL",
            "description": "Advanced open-source relational database",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/postgresql-original.svg"
        },
        "git": {
            "name": "Git",
            "description": "Distributed version control system for tracking changes",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/git-original.svg"
        },
        "github": {
            "name": "GitHub",
            "description": "Web-based platform for version control and collaboration",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/github-original.svg"
        },
        "django_rest_framework": {
            "name": "Django REST Framework",
            "description": "Powerful toolkit for building Web APIs in Django",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/djangorest-original.svg"
        },
        "postman": {
            "name": "Postman",
            "description": "API development and testing platform",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/postman-original.svg"
        },
        "graphql": {
            "name": "GraphQL",
            "description": "Query language for APIs with flexible data fetching",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/graphql-plain.svg"
        },
        "vercel": {
            "name": "Vercel",
            "description": "Platform for frontend frameworks and static sites",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/vercel-original.svg"
        },
        "netlify": {
            "name": "Netlify",
            "description": "Platform for automated web development workflows",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/netlify-original.svg"
        },
        "cloudflare_pages": {
            "name": "Cloudflare Pages",
            "description": "JAMstack platform for fast and secure websites",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/cloudflare-original.svg"
        },
        "cloudflare_workers": {
            "name": "Cloudflare Workers",
            "description": "Serverless execution environment at the edge",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/cloudflareworkers-original.svg"
        },
        "nginx": {
            "name": "Nginx",
            "description": "High-performance web server and reverse proxy",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/nginx-original.svg"
        },
        "vscode": {
            "name": "VS Code",
            "description": "Lightweight yet powerful source code editor",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/vscode-original.svg"
        },
        "jetbrains": {
            "name": "JetBrains",
            "description": "Professional IDEs for various programming languages",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/jetbrains-original.svg"
        },
        "figma": {
            "name": "Figma",
            "description": "Collaborative interface design tool",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/figma-original.svg"
        },
        "canva": {
            "name": "Canva",
            "description": "Online design and publishing platform",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/canva-original.svg"
        },
        "jupyter": {
            "name": "Jupyter Notebook",
            "description": "Interactive computing environment for data science",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/jupyter-original.svg"
        },
        "anaconda": {
            "name": "Anaconda",
            "description": "Python distribution for data science and machine learning",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/anaconda-original.svg"
        },
        "opencv": {
            "name": "OpenCV",
            "description": "Computer vision and image processing library",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/opencv-original.svg"
        },
        "pandas": {
            "name": "Pandas",
            "description": "Data manipulation and analysis library for Python",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/pandas-original.svg"
        },
        "numpy": {
            "name": "NumPy",
            "description": "Fundamental package for scientific computing in Python",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/numpy-original.svg"
        },
        "matplotlib": {
            "name": "Matplotlib",
            "description": "Comprehensive library for creating visualizations in Python",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/matplotlib-original.svg"
        },
        "plotly": {
            "name": "Plotly",
            "description": "Interactive graphing library for data visualization",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/plotly-original.svg"
        },
        "streamlit": {
            "name": "Streamlit",
            "description": "Framework for building data science web applications",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/streamlit-original.svg"
        },
        "fastapi": {
            "name": "FastAPI",
            "description": "Modern, fast web framework for building APIs with Python",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/fastapi-original.svg"
        },
        "selenium": {
            "name": "Selenium",
            "description": "Web browser automation framework",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/selenium-original.svg"
        },
        "pypi": {
            "name": "PyPi",
            "description": "Repository of software for the Python programming language",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/pypi-original.svg"
        },
        "woocommerce": {
            "name": "WooCommerce",
            "description": "E-commerce plugin for WordPress websites",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/woocommerce-original.svg"
        },
        "wordpress": {
            "name": "WordPress",
            "description": "Popular content management system for websites",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/wordpress-plain.svg"
        },
        "sqlalchemy": {
            "name": "SQLAlchemy",
            "description": "Python SQL toolkit and Object-Relational Mapping library",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/sqlalchemy-original.svg"
        },
        "aco": {
            "name": "ACO",
            "description": "Ant Colony Optimization for solving computational problems",
            "icon_svg": ""
        },
        "adminlte": {
            "name": "AdminLTE",
            "description": "Sleek admin dashboard template for web apps",
            "icon_svg": ""
        },
        "beautifulsoup": {
            "name": "BeautifulSoup",
            "description": "Web scraping made easy with Python",
            "icon_svg": ""
        },
        "cnn": {
            "name": "CNN",
            "description": "Convolutional Neural Networks for image processing and recognition",
            "icon_svg": ""
        },
        "css": {
            "name": "CSS",
            "description": "Styles web pages to look good and feel right",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/css3-original.svg"
        },
        "chartjs": {
            "name": "Chart.js",
            "description": "Simple yet flexible JavaScript charts for data visualization",
            "icon_svg": ""
        },
        "cloudflare": {
            "name": "Cloudflare",
            "description": "Speeds up sites and keeps them safe with CDN and security",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/cloudflare-original.svg"
        },
        "datatables": {
            "name": "DataTables",
            "description": "Enhances HTML tables with sorting, searching, and pagination",
            "icon_svg": ""
        },
        "flask_mail": {
            "name": "Flask-Mail",
            "description": "Email support for Flask applications",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/flask-original.svg"
        },
        "gru": {
            "name": "GRU",
            "description": "Gated Recurrent Units for efficient sequence modeling",
            "icon_svg": ""
        },
        "gui_framework": {
            "name": "GUI Framework",
            "description": "Framework for building graphical user interfaces",
            "icon_svg": ""
        },
        "github_api": {
            "name": "GitHub API",
            "description": "Grabs project stats and activity straight from my repos",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/github-original.svg"
        },
        "google_maps": {
            "name": "Google Maps",
            "description": "Brings maps and location data to your web apps",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/google-original.svg"
        },
        "hog": {
            "name": "HOG",
            "description": "Histogram of Oriented Gradients for object detection",
            "icon_svg": ""
        },
        "jwt": {
            "name": "JWT",
            "description": "Securely transmit information between parties as a JSON object",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/json-original.svg"
        },
        "knn": {
            "name": "KNN",
            "description": "K-Nearest Neighbors for classification based on distance metrics",
            "icon_svg": ""
        },
        "lstm": {
            "name": "LSTM",
            "description": "Long Short-Term Memory networks for time series and sequence data",
            "icon_svg": ""
        },
        "leaflet": {
            "name": "Leaflet",
            "description": "Interactive maps for web apps, easy to use and customize",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/leaflet.svg"
        },
        "mdx": {
            "name": "MDX",
            "description": "Mixes Markdown with JSX for dynamic docs",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/markdown-original.svg"
        },
        "machine_learning": {
            "name": "Machine Learning",
            "description": "Crunching data with algorithms to predict and analyze stuff",
            "icon_svg": ""
        },
        "music_recommendation": {
            "name": "Music Recommendation Algorithms",
            "description": "Suggests tunes based on what you vibe with",
            "icon_svg": ""
        },
        "neural_networks": {
            "name": "Neural Networks",
            "description": "AI models that mimic the human brain for complex tasks",
            "icon_svg": ""
        },
        "once_ui": {
            "name": "Once UI",
            "description": "Design system for building modern, polished web apps",
            "icon_svg": ""
        },
        "openai_api": {
            "name": "OpenAI API",
            "description": "Integrate AI capabilities into your apps with ease",
            "icon_svg": ""
        },
        "openstreetmap": {
            "name": "OpenStreetMap",
            "description": "Free, editable map of the world, perfect for web apps",
            "icon_svg": ""
        },
        "rest_api": {
            "name": "REST API",
            "description": "The blueprint for smooth, networked app communication",
            "icon_svg": ""
        },
        "rnn": {
            "name": "RNN",
            "description": "Recurrent Neural Networks for sequence prediction tasks",
            "icon_svg": ""
        },
        "radix_ui": {
            "name": "Radix UI",
            "description": "Low-level UI components for accessible, custom designs",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/radix-ui.svg"
        },
        "scss": {
            "name": "SCSS",
            "description": "Supercharged CSS with variables and nesting for style",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/sass-original.svg"
        },
        "svm": {
            "name": "SVM",
            "description": "Support Vector Machines for classification and regression tasks",
            "icon_svg": ""
        },
        "seaborn": {
            "name": "Seaborn",
            "description": "Statistical data visualization library based on Matplotlib",
            "icon_svg": ""
        },
        "shadcn_ui": {
            "name": "Shadcn UI",
            "description": "Modern UI components to craft clean, stylish interfaces",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/shadcnui.svg"
        },
        "telegram_api": {
            "name": "Telegram API",
            "description": "Connects your apps to Telegram for messaging and bots",
            "icon_svg": ""
        },
        "wakatime_api": {
            "name": "WakaTime API",
            "description": "Tracks my coding hours and analytics like a pro",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/wakatime-white.svg"
        },
        "whitenoise": {
            "name": "Whitenoise",
            "description": "Serves Django static files like a charm",
            "icon_svg": ""
        },
        "timm": {
            "name": "timm",
            "description": "PyTorch image models library with pre-trained models",
            "icon_svg": ""
        },
        "allauth": {
            "name": "Django Allauth",
            "description": "Django apps for authentication, registration, account and social login management",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/allauth.svg"
        },
        "pytest": {
            "name": "pytest",
            "description": "Framework that makes building simple and scalable test cases easy",
            "icon_svg": f"{settings.BASE_URL}/static/svg/icon/pytest.svg"
        },
    }
    
    # Legacy list format for backward compatibility
    @classmethod
    def get_skills_list(cls):
        """Convert tech_stack dictionary to list format for backward compatibility"""
        return list(cls.tech_stack.values())
    
    @classmethod
    def get_tech_stack_for_project(cls, tech_keys):
        """Convert list of tech keys to list of full tech objects"""
        return [cls.tech_stack[key] for key in tech_keys if key in cls.tech_stack]
    
    # Keep the old property for backward compatibility
    @property
    def skills(self):
        """Legacy property for backward compatibility"""
        return self.get_skills_list()
