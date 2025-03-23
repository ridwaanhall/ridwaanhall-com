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
                    'image_url': '',  # This will use the placeholder icon
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
            # Additional fields would follow the same pattern
        }
        # More projects would be added here
    ]