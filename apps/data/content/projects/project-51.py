"""
Project #51: RPS Classifier
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Rock-Paper-Scissors Classifier
project_data = {
    # Identity
    "id": 51,
    "title": "Rock-Paper-Scissors Classifier",
    "headline": "A deep learning image classifier that identifies hand gestures for Rock, Paper, and Scissors with over 99% validation accuracy.",

    # Core Content
    "description": [
        "Built using TensorFlow and Keras, this CNN-based model classifies images of hand gestures into rock, paper, or scissors.",
        "The dataset is sourced from a public GitHub repository and processed using custom data generators with augmentation.",
        "Model architecture includes multiple Conv2D and MaxPooling layers, followed by dropout and dense layers for classification.",
        "Training achieves 99.22% validation accuracy with visualized training history for performance tracking.",
        "Includes an image prediction module for real-time gesture recognition using uploaded images."
    ],
    "features": [
        {
            "title": "Dataset Processor",
            "description": "Downloads and prepares the Rock-Paper-Scissors dataset with validation split and augmentation."
        },
        {
            "title": "Model Builder",
            "description": "Defines and trains a CNN model with dropout and softmax output for gesture classification."
        },
        {
            "title": "Training History Plot",
            "description": "Visualizes accuracy and loss trends across 75 epochs."
        },
        {
            "title": "Image Predictor",
            "description": "Predicts uploaded image class using the trained model and displays results with matplotlib."
        },
        {
            "title": "Performance Metrics",
            "description": "Achieves 99.22% validation accuracy with low loss, ensuring robust classification."
        }
    ],
    "images": {
        "rps_demo.webp": f"{settings.PROJECT_BASE_IMG_URL}/rps_demo.webp",
        "rps_train_val.webp": f"{settings.PROJECT_BASE_IMG_URL}/rps_train_val.webp"
    },

    # Tech & Resources
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["tensorflow"],
        SkillsData.tech_stack["keras"],
    ],
    "github_url": "https://github.com/ridwaanhall/Dicoding_Proyek-Akhir_Klasifikasi-Gambar_Belajar-Machine-Learning-untuk-Pemula",
    "demo_url": "",

    # Classification
    "category": "computer-vision",
    "tags": [
        "cnn",
        "dicoding",
        "tensorflow",
        "keras",
        "image-classification",
        "rock-paper-scissors",
        "colab",
        "deep-learning",
        "python",
        "gesture-recognition"
    ],

    # Status & Meta
    "is_featured": False,
    "featured_priority": None,
    "status": "completed",
    "created_at": datetime.strptime("2024-05-24T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2024-05-25T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
}
