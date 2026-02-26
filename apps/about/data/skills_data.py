from __future__ import annotations

from dataclasses import asdict

from django.conf import settings

from apps.about.types import Skill


def _skill(name: str, description: str, icon_svg: str = "") -> dict:
    return asdict(Skill(name=name, description=description, icon_svg=icon_svg))


class SkillsData:
    # Dictionary of all available skills with easy-to-use keys
    tech_stack = {
        "replit": _skill(
            name="Replit",
            description="Online IDE and hosting platform for web applications",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/replit.svg",
        ),
        "vuexy": _skill(
            name="Vuexy",
            description="A premium admin dashboard template created by PixInvent.",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/vuexy.svg",
        ),
        "python": _skill(
            name="Python",
            description="Versatile programming language for web development, data science, and automation",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/python-original.svg",
        ),
        "php": _skill(
            name="PHP",
            description="Server-side scripting language for dynamic web applications",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/php-original.svg",
        ),
        "javascript": _skill(
            name="JavaScript",
            description="Dynamic programming language for interactive web experiences",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/javascript-original.svg",
        ),
        "django": _skill(
            name="Django",
            description="High-level Python web framework for rapid development",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/django-plain.svg",
        ),
        "flask": _skill(
            name="Flask",
            description="Lightweight and flexible Python web framework",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/flask-original.svg",
        ),
        "react": _skill(
            name="React",
            description="JavaScript library for building user interfaces",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/react-original.svg",
        ),
        "nextjs": _skill(
            name="Next.js",
            description="React framework for production-ready web applications",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/nextjs-original.svg",
        ),
        "html5": _skill(
            name="HTML5",
            description="Modern markup language for structuring web content",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/html5-original.svg",
        ),
        "css3": _skill(
            name="CSS3",
            description="Styling language for beautiful web design",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/css3-original.svg",
        ),
        "bootstrap": _skill(
            name="Bootstrap",
            description="Popular CSS framework for responsive design",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/bootstrap-original.svg",
        ),
        "tailwindcss": _skill(
            name="TailwindCSS",
            description="Utility-first CSS framework for rapid UI development",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/tailwindcss-original.svg",
        ),
        "bulma": _skill(
            name="Bulma",
            description="Modern CSS framework based on Flexbox",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/bulma-plain.svg",
        ),
        "nodejs": _skill(
            name="Node.js",
            description="JavaScript runtime for server-side development",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/nodejs-original.svg",
        ),
        "materialui": _skill(
            name="Material-UI",
            description="React components implementing Google's Material Design",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/materialui-original.svg",
        ),
        "typescript": _skill(
            name="TypeScript",
            description="Typed superset of JavaScript for better development",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/typescript-original.svg",
        ),
        "laravel": _skill(
            name="Laravel",
            description="Elegant PHP framework for web artisans",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/laravel-original.svg",
        ),
        "tensorflow": _skill(
            name="TensorFlow",
            description="Open-source machine learning framework",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/tensorflow-original.svg",
        ),
        "pytorch": _skill(
            name="PyTorch",
            description="Deep learning framework with dynamic computation graphs",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/pytorch-original.svg",
        ),
        "keras": _skill(
            name="Keras",
            description="High-level neural networks API for deep learning",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/keras-original.svg",
        ),
        "scikitlearn": _skill(
            name="Scikit-learn",
            description="Machine learning library for Python",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/scikitlearn-original.svg",
        ),
        "mysql": _skill(
            name="MySQL",
            description="Popular relational database management system",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/mysql-original.svg",
        ),
        "sqlite": _skill(
            name="SQLite",
            description="Lightweight embedded relational database",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/sqlite-original.svg",
        ),
        "mongodb": _skill(
            name="MongoDB",
            description="NoSQL document database for modern applications",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/mongodb-original.svg",
        ),
        "postgresql": _skill(
            name="PostgreSQL",
            description="Advanced open-source relational database",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/postgresql-original.svg",
        ),
        "git": _skill(
            name="Git",
            description="Distributed version control system for tracking changes",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/git-original.svg",
        ),
        "github": _skill(
            name="GitHub",
            description="Web-based platform for version control and collaboration",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/github-original.svg",
        ),
        "django_rest_framework": _skill(
            name="Django REST Framework",
            description="Powerful toolkit for building Web APIs in Django",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/djangorest-original.svg",
        ),
        "postman": _skill(
            name="Postman",
            description="API development and testing platform",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/postman-original.svg",
        ),
        "graphql": _skill(
            name="GraphQL",
            description="Query language for APIs with flexible data fetching",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/graphql-plain.svg",
        ),
        "vercel": _skill(
            name="Vercel",
            description="Platform for frontend frameworks and static sites",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/vercel-original.svg",
        ),
        "netlify": _skill(
            name="Netlify",
            description="Platform for automated web development workflows",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/netlify-original.svg",
        ),
        "cloudflare_pages": _skill(
            name="Cloudflare Pages",
            description="JAMstack platform for fast and secure websites",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/cloudflare-original.svg",
        ),
        "cloudflare_workers": _skill(
            name="Cloudflare Workers",
            description="Serverless execution environment at the edge",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/cloudflareworkers-original.svg",
        ),
        "nginx": _skill(
            name="Nginx",
            description="High-performance web server and reverse proxy",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/nginx-original.svg",
        ),
        "vscode": _skill(
            name="VS Code",
            description="Lightweight yet powerful source code editor",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/vscode-original.svg",
        ),
        "jetbrains": _skill(
            name="JetBrains",
            description="Professional IDEs for various programming languages",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/jetbrains-original.svg",
        ),
        "figma": _skill(
            name="Figma",
            description="Collaborative interface design tool",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/figma-original.svg",
        ),
        "canva": _skill(
            name="Canva",
            description="Online design and publishing platform",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/canva-original.svg",
        ),
        "jupyter": _skill(
            name="Jupyter Notebook",
            description="Interactive computing environment for data science",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/jupyter-original.svg",
        ),
        "anaconda": _skill(
            name="Anaconda",
            description="Python distribution for data science and machine learning",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/anaconda-original.svg",
        ),
        "opencv": _skill(
            name="OpenCV",
            description="Computer vision and image processing library",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/opencv-original.svg",
        ),
        "pandas": _skill(
            name="Pandas",
            description="Data manipulation and analysis library for Python",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/pandas-original.svg",
        ),
        "numpy": _skill(
            name="NumPy",
            description="Fundamental package for scientific computing in Python",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/numpy-original.svg",
        ),
        "matplotlib": _skill(
            name="Matplotlib",
            description="Comprehensive library for creating visualizations in Python",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/matplotlib-original.svg",
        ),
        "plotly": _skill(
            name="Plotly",
            description="Interactive graphing library for data visualization",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/plotly-original.svg",
        ),
        "streamlit": _skill(
            name="Streamlit",
            description="Framework for building data science web applications",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/streamlit-original.svg",
        ),
        "fastapi": _skill(
            name="FastAPI",
            description="Modern, fast web framework for building APIs with Python",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/fastapi-original.svg",
        ),
        "selenium": _skill(
            name="Selenium",
            description="Web browser automation framework",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/selenium-original.svg",
        ),
        "pypi": _skill(
            name="PyPi",
            description="Repository of software for the Python programming language",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/pypi-original.svg",
        ),
        "woocommerce": _skill(
            name="WooCommerce",
            description="E-commerce plugin for WordPress websites",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/woocommerce-original.svg",
        ),
        "wordpress": _skill(
            name="WordPress",
            description="Popular content management system for websites",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/wordpress-plain.svg",
        ),
        "sqlalchemy": _skill(
            name="SQLAlchemy",
            description="Python SQL toolkit and Object-Relational Mapping library",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/sqlalchemy-original.svg",
        ),
        "aco": _skill(
            name="ACO",
            description="Ant Colony Optimization for solving computational problems",
        ),
        "adminlte": _skill(
            name="AdminLTE",
            description="Sleek admin dashboard template for web apps",
        ),
        "beautifulsoup": _skill(
            name="BeautifulSoup",
            description="Web scraping made easy with Python",
        ),
        "cnn": _skill(
            name="CNN",
            description="Convolutional Neural Networks for image processing and recognition",
        ),
        "css": _skill(
            name="CSS",
            description="Styles web pages to look good and feel right",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/css3-original.svg",
        ),
        "chartjs": _skill(
            name="Chart.js",
            description="Simple yet flexible JavaScript charts for data visualization",
        ),
        "cloudflare": _skill(
            name="Cloudflare",
            description="Speeds up sites and keeps them safe with CDN and security",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/cloudflare-original.svg",
        ),
        "datatables": _skill(
            name="DataTables",
            description="Enhances HTML tables with sorting, searching, and pagination",
        ),
        "flask_mail": _skill(
            name="Flask-Mail",
            description="Email support for Flask applications",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/flask-original.svg",
        ),
        "gru": _skill(
            name="GRU",
            description="Gated Recurrent Units for efficient sequence modeling",
        ),
        "gui_framework": _skill(
            name="GUI Framework",
            description="Framework for building graphical user interfaces",
        ),
        "github_api": _skill(
            name="GitHub API",
            description="Grabs project stats and activity straight from my repos",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/github-original.svg",
        ),
        "google_maps": _skill(
            name="Google Maps",
            description="Brings maps and location data to your web apps",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/google-original.svg",
        ),
        "hog": _skill(
            name="HOG",
            description="Histogram of Oriented Gradients for object detection",
        ),
        "jwt": _skill(
            name="JWT",
            description="Securely transmit information between parties as a JSON object",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/json-original.svg",
        ),
        "knn": _skill(
            name="KNN",
            description="K-Nearest Neighbors for classification based on distance metrics",
        ),
        "lstm": _skill(
            name="LSTM",
            description="Long Short-Term Memory networks for time series and sequence data",
        ),
        "leaflet": _skill(
            name="Leaflet",
            description="Interactive maps for web apps, easy to use and customize",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/leaflet.svg",
        ),
        "mdx": _skill(
            name="MDX",
            description="Mixes Markdown with JSX for dynamic docs",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/markdown-original.svg",
        ),
        "machine_learning": _skill(
            name="Machine Learning",
            description="Crunching data with algorithms to predict and analyze stuff",
        ),
        "music_recommendation": _skill(
            name="Music Recommendation Algorithms",
            description="Suggests tunes based on what you vibe with",
        ),
        "neural_networks": _skill(
            name="Neural Networks",
            description="AI models that mimic the human brain for complex tasks",
        ),
        "once_ui": _skill(
            name="Once UI",
            description="Design system for building modern, polished web apps",
        ),
        "openai_api": _skill(
            name="OpenAI API",
            description="Integrate AI capabilities into your apps with ease",
        ),
        "openstreetmap": _skill(
            name="OpenStreetMap",
            description="Free, editable map of the world, perfect for web apps",
        ),
        "rest_api": _skill(
            name="REST API",
            description="The blueprint for smooth, networked app communication",
        ),
        "rnn": _skill(
            name="RNN",
            description="Recurrent Neural Networks for sequence prediction tasks",
        ),
        "radix_ui": _skill(
            name="Radix UI",
            description="Low-level UI components for accessible, custom designs",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/radix-ui.svg",
        ),
        "scss": _skill(
            name="SCSS",
            description="Supercharged CSS with variables and nesting for style",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/sass-original.svg",
        ),
        "svm": _skill(
            name="SVM",
            description="Support Vector Machines for classification and regression tasks",
        ),
        "seaborn": _skill(
            name="Seaborn",
            description="Statistical data visualization library based on Matplotlib",
        ),
        "shadcn_ui": _skill(
            name="Shadcn UI",
            description="Modern UI components to craft clean, stylish interfaces",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/shadcnui.svg",
        ),
        "telegram": _skill(
            name="Telegram",
            description="Connects your apps to Telegram for messaging and bots",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/telegram.svg",
        ),
        "wakatime_api": _skill(
            name="WakaTime API",
            description="Tracks my coding hours and analytics like a pro",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/wakatime-white.svg",
        ),
        "whitenoise": _skill(
            name="Whitenoise",
            description="Serves Django static files like a charm",
        ),
        "timm": _skill(
            name="timm",
            description="PyTorch image models library with pre-trained models",
        ),
        "allauth": _skill(
            name="Django Allauth",
            description="Django apps for authentication, registration, account and social login management",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/allauth.svg",
        ),
        "pytest": _skill(
            name="pytest",
            description="Framework that makes building simple and scalable test cases easy",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/pytest.svg",
        ),
        "boto3": _skill(
            name="boto3",
            description="AWS SDK for Python to interact with AWS services like S3",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/boto3.svg",
        ),
        "n8n": _skill(
            name="n8n",
            description="Visual automation for APIs, services, and logic—no code needed.",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/n8n.svg",
        ),
        "sheets": _skill(
            name="Sheets",
            description="Online spreadsheets for data storage and automation.",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/google-sheets.svg",
        ),
        "gemini": _skill(
            name="Gemini",
            description="Google AI for OCR, summarization, and smart automation.",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/gemini.svg",
        ),
        "redis": _skill(
            name="Redis",
            description="In-memory data structure store, used as a database, cache, and message broker.",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/redis.svg",
        ),
        "docker": _skill(
            name="Docker",
            description="Containerization platform for consistent development and deployment.",
            icon_svg=f"{settings.BASE_URL}/static/svg/icon/docker.svg",
        ),
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
