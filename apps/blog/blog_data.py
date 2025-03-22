# blog_data.py

from django.utils.text import slugify

class BlogData:
    blogs = [
        {
            'id': 1,
            'title': 'Dummy Post 1',
            'description': 'This is a dummy post description for post 1.',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/1.jpeg',
            'date': 'January 10, 2023',
            'author': 'Jane Smith',
            'content': [
                "This is the content for Dummy Post 1. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
            ],
            'tags': ['TagA', 'TagB'],
            'is_featured': False
        },
        {
            'id': 2,
            'title': 'Dummy Post 2',
            'description': 'This is a dummy post description for post 2.',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/1.jpeg',
            'date': 'February 15, 2023',
            'author': 'Peter Jones',
            'content': [
                "Content of Dummy Post 2. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
                "Nisi ut aliquip ex ea commodo consequat."
            ],
            'tags': ['TagC', 'TagD', 'TagE'],
            'is_featured': True
        },
        {
            'id': 3,
            'title': 'Dummy Post 3',
            'description': 'This is a dummy post description for post 3.',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/1.jpeg',
            'date': 'March 22, 2023',
            'author': 'John Doe',
            'content': [
                "Dummy Post 3 content goes here. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.",
                "Eu fugiat nulla pariatur."
            ],
            'tags': ['TagF'],
            'is_featured': False
        },
        {
            'id': 4,
            'title': 'Dummy Post 4',
            'description': 'This is a dummy post description for post 4.',
            'image_url': 'https://api.slingacademy.com/public/sample-photos/1.jpeg',
            'date': 'April 01, 2023',
            'author': 'Jane Smith',
            'content': [
                "This is the fourth dummy post's content. Excepteur sint occaecat cupidatat non proident.",
                "Sunt in culpa qui officia deserunt mollit anim id est laborum."
            ],
            'tags': ['TagG', 'TagH', 'TagI', 'TagJ'],
            'is_featured': True
        },
    ]