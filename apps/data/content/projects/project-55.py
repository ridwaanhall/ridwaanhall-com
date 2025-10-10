from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Face Recognition using OpenCV
project_data = {
    # Identity
    "id": 55,
    "title": "Face Recognition using OpenCV",
    "headline": "A real-time face recognition system using Haar Cascade for detection and LBPH for recognition, built with Python and OpenCV.",

    # Core Content
    "description": [
        "This project implements a complete face recognition pipeline using OpenCV, from data collection to real-time recognition.",
        "It uses Haar Cascade Classifiers for accurate face and eye detection, and LBPH (Local Binary Pattern Histogram) for face recognition.",
        "The system supports multiple users with unique IDs and provides a simple training interface.",
        "Real-time recognition is achieved through live camera feed processing, with optimized grayscale image handling.",
        "Configuration options include camera index selection, image count per user, and cascade file customization."
    ],
    "features": [
        {
            "title": "Face Detection",
            "description": "Uses Haar Cascade Classifiers for accurate face and eye detection."
        },
        {
            "title": "Face Recognition",
            "description": "Implements LBPH algorithm for robust face recognition."
        },
        {
            "title": "Real-time Processing",
            "description": "Processes live camera feed for instant face recognition."
        },
        {
            "title": "Multi-user Support",
            "description": "Supports multiple users with unique IDs and training data."
        },
        {
            "title": "Easy Training Interface",
            "description": "Simple scripts for collecting and training face images."
        }
    ],
    "images": {
        "default_image.webp": f"{settings.PROJECT_BASE_IMG_URL}/default_project_image.webp",
    },

    # Tech & Resources
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["opencv"],
        SkillsData.tech_stack["numpy"],
        # SkillsData.tech_stack["pillow"],
    ],
    "github_url": "https://github.com/ridwaanhall/face-recognition-using-OpenCV",
    "demo_url": "",

    # Classification
    "category": "computer-vision",
    "tags": [
        "opencv",
        "face-recognition",
        "lbph",
        "haar-cascade",
        "real-time",
        "python",
        "image-processing",
        "camera-feed",
        "multi-user",
        "training-data"
    ],

    # Status & Meta
    "is_featured": False,
    "featured_priority": None,
    "status": "Completed",
    "created_at": datetime.strptime("2024-03-05T13:14:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-10-08T18:28:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
}
