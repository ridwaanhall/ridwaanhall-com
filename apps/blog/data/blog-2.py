"""
Blog Post #2: Whipping Up Web Apps with Django's Magic
Generated from centralized blog data
"""

from datetime import datetime
from django.conf import settings

# Blog data for: Whipping Up Web Apps with Django's Magic
blog_data = {
    "id": 2,
    "title": """Whipping Up Web Apps with Django's Magic""",
    "description": """See how Django's all-in-one toolkit makes building secure, speedy web apps a total breeze.""",
    "images": {
        "building_web_applications_with_django.webp": f"{settings.BLOG_BASE_IMG_URL}/building_web_applications_with_django.webp"
    },
    "created_at": datetime.strptime("2025-03-24T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-05-10T14:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "author": "Ridwan Halim",
    "username": "roneha",
    "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
    "content": [
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "Django's the Python framework that's like having a superpower for web dev. It's got everything—security, speed, and a vibe that lets you focus on coding your app instead of wrestling with configs. Think of it as the cheat code for building sites like OpenShop (yep, like that e-commerce API we've geeked out over!)."
        },
        {
            "type": "h2",
            "class": "text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3",
            "text": "Getting Started with Django"
        },
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "First, fire up a project with <code>django-admin startproject myapp</code>. Boom—you've got a skeleton ready to roll. Create an app (<code>python manage.py startapp shop</code>) to handle your logic, like products or users. Django's ORM is a beast: define a <code>Product</code> model with fields like <code>name</code> and <code>price</code>, and it'll handle the database heavy lifting."
        },
        {
            "type": "h2",
            "class": "text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3",
            "text": "Views and Templates: The Core of Django"
        },
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "Views are where the fun's at—map a URL (say, <code>/products/</code>) to a function or class that pulls data and renders a template. Speaking of templates, Django's got a slick system to keep your HTML clean. Throw in the built-in admin panel (<code>/admin/</code>), and you're managing data like a pro without writing extra code."
        },
        {
            "type": "h2",
            "class": "text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3",
            "text": "Django's Security and Scalability"
        },
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "Security? Django's got your back with CSRF protection and user auth out of the box. Need an API? Pair it with Django REST Framework (like we did for OpenShop) for JSON endpoints that scream speed. Scalability? It's battle-tested—Instagram and Pinterest run on it."
        },
        {
            "type": "h2",
            "class": "text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3",
            "text": "Building Your First Django Project"
        },
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "Wanna try it? Build a simple blog: set up models for posts, create views to list and detail them, and style it with Bootstrap. Debug with <code>python manage.py runserver</code> and tweak as you go. Trust me, once you go Django, you won't wanna code raw again."
        }
    ],
    "is_featured": False,
    "tags": ['Django', 'Web Dev', 'Python'],
    "category": "",
    "read_time": 5,
    "views": 0,
    "slug": ""
}
