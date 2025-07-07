"""
Project #47: Neural Network from Scratch
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Neural Network from Scratch
project_data = {
    "id": 47,
    "title": """Neural Network from Scratch""",
    "headline": """A professional implementation of a neural network using only NumPy for MNIST digit classification.""",
    "description": [
        "This project is a deep dive into neural networks built entirely from scratch using NumPy, offering a comprehensive understanding of how neural networks function at a fundamental level. Unlike typical frameworks such as TensorFlow or PyTorch, this implementation directly leverages raw numerical computations, enabling users to grasp the mathematical foundations behind artificial intelligence in a structured and practical way.",
        "It achieves an impressive 98.06% test accuracy on the MNIST dataset, demonstrating its efficiency in classifying handwritten digits. Designed with a clean, object-oriented architecture, it ensures modularity, flexibility, and ease of use for experimenting with different neural network configurations.",
        "The project integrates six activation functions—including ReLU, Sigmoid, Tanh, Softmax, LeakyReLU, and Linear—allowing users to experiment with different activation dynamics and optimize model performance. Additionally, it incorporates five distinct loss functions, including CrossEntropy, MSE, BCE, CategoricalCE, and Huber Loss, enabling precise control over model optimization strategies.",
        "Four weight initialization methods, such as Xavier, He, Random, and Zeros initialization, ensure robust training stability and avoid common pitfalls such as vanishing or exploding gradients.",
        "The training framework is designed with advanced optimization techniques, including Stochastic Gradient Descent (SGD) with momentum, learning rate scheduling, and early stopping mechanisms. These tools provide greater control over model convergence and prevent overfitting.",
        "Beyond traditional numerical computation, this project introduces a fully interactive graphical user interface (GUI) that allows users to draw digits in real time and receive immediate model predictions. This visualization component enhances the educational aspect by demonstrating how neural networks process image inputs dynamically.",
        "Comprehensive visualization tools are embedded within the project, generating organized reports on model performance, including accuracy curves, loss graphs, confusion matrices, and sample misclassifications. This provides users with deeper insights into model behavior and enables data-driven refinement.",
        "Ideal for researchers, students, and AI enthusiasts, this project serves as both a learning tool and a solid foundation for custom neural network experiments. Whether you’re diving into deep learning principles or developing specialized models, this implementation offers a streamlined, intuitive environment for gaining hands-on experience."
    ],
    "images": {
        "neural_network_scratch.webp": f"{settings.PROJECT_BASE_IMG_URL}/neural_network_scratch.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Pure NumPy Implementation', 'description': 'No TensorFlow or PyTorch, just optimized NumPy operations.'}, {'title': 'High Accuracy', 'description': 'Achieves 98.06% test accuracy on MNIST dataset.'}, {'title': 'Comprehensive CLI', 'description': '20+ configurable parameters for training and optimization.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["numpy"],
        SkillsData.tech_stack["matplotlib"]
    ],
    "github_url": "https://github.com/ridwaanhall/Neural-Network-from-Scratch",
    "demo_url": "",
    "status": "completed",
    "created_at": datetime.strptime("2025-06-04T18:57:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-06-06T18:57:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "machine learning",
    "tags": ["neural network", "deep learning", "from scratch", "numpy", "mnist", "classification", "machine learning"],
    "priority": 1,
    "slug": ""
}
