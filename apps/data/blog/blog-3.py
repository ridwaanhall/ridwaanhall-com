"""
Blog Post #3: Neural Nets Made Easy with TensorFlow & Keras
Generated from centralized blog data
"""

from datetime import datetime
from django.conf import settings

# Blog data for: Neural Nets Made Easy with TensorFlow & Keras
blog_data = {
    "id": 3,
    "title": """Neural Nets Made Easy with TensorFlow & Keras""",
    "description": """Ready to build AI that sees and thinks? Let's get rolling with TensorFlow and Keras for some deep learning fun!""",
    "image_url": "https://ridwaanhall.com/static/img/blog/deep_learning_with_tensorflow_and_keras.webp",
    "img_name": "deep_learning_with_tensorflow_and_keras.webp",
    "created_at": datetime.strptime("2025-03-24T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-05-10T14:56:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "author": "Ridwan Halim",
    "username": "ridwaanhall",
    "author_image": "https://ridwaanhall.com/static/img/ridwaanhall.webp",
    "content": ["<p class='mb-4 text-sm md:text-base lg:text-lg'>TensorFlow and Keras are like the Batman and Robin of deep learning—TensorFlow's the heavy-duty engine, Keras is the slick API making neural nets feel like a breeze. Together, they power AI that can spot cats in photos or predict your next binge-watch.</p>", "<h2 class='text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3'>Building Your First Neural Network</h2>", "<p class='mb-4 text-sm md:text-base lg:text-lg'>Let's build something real: a neural network to classify handwritten digits (MNIST dataset—classic!). Start with <code>tensorflow.keras.Sequential()</code> to stack layers—think <code>Dense(128, activation='relu')</code> for the brains and <code>softmax</code> for the final guess. Keras makes it stupid simple to add layers like LEGO bricks.</p>", "<h2 class='text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3'>Training and Optimization</h2>", "<p class='mb-4 text-sm md:text-base lg:text-lg'>Training's where the magic happens. Feed your model data with <code>model.fit()</code>, tweak it with epochs (like 5-10), and watch it learn. TensorFlow's handling the math under the hood—gradients, backprop, all that jazz. Use <code>model.evaluate()</code> to check accuracy—aim for 95%+ to flex.</p>", "<h2 class='text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3'>Advanced Deep Learning Techniques</h2>", "<p class='mb-4 text-sm md:text-base lg:text-lg'>Wanna go deeper? Play with CNNs for image recognition (<code>Conv2D</code>) or RNNs for text (<code>LSTM</code>). Overfitting? Toss in <code>Dropout(0.2)</code>. Debug with TensorBoard to visualize your model's vibe. I've used this combo for sentiment analysis and image classifiers—it's legit.</p>", "<h2 class='text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3'>Getting Started with TensorFlow</h2>", "<p class='mb-4 text-sm md:text-base lg:text-lg'>Kick it off with <code>pip install tensorflow</code> and Google Colab if your laptop's not beefy. Try coding a model to guess movie genres from posters—fun and doable. Keep experimenting, and you'll be an AI wizard before you know it.</p>"],
    "is_featured": False,
    "tags": ['TensorFlow', 'Keras', 'AI', 'Deep Learning'],
    "category": "",
    "read_time": 5,
    "views": 0,
    "slug": ""
}
