"""
Project #25: Election Digit Scanner
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Election Digit Scanner
project_data = {
    "id": 25,
    "title": """Election Digit Scanner""",
    "headline": """Nail handwritten digit recognition for 2024 Indonesia vote recaps with HOG and SVM.""",
    "description": ['This project kills data entry errors in the 2024 Indonesian Presidential Election vote recap with cutting-edge pattern recognition.', 'Uses Histogram of Oriented Gradients (HOG) for feature extraction and K-Nearest Neighbors (KNN) plus Support Vector Machine (SVM) for classification, hitting over 97% accuracy.', 'Experiments prove HOG + SVM is the champ, delivering top-tier performance across dataset splits.'],
    "images": {
        "default_project_image.webp": f"{settings.PROJECT_BASE_IMG_URL}/default_project_image.webp"
    },
    "is_featured": False,
    "features": [{'title': 'HOG Feature Magic', 'description': 'Extracts edges and gradients for pinpoint digit recognition.'}, {'title': 'SVM & KNN Power', 'description': 'Drops 97%+ accuracy with killer classification algorithms.'}, {'title': 'Performance Breakdown', 'description': 'Compares extraction vs. no-extraction for clear wins.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["hog"],
        SkillsData.tech_stack["svm"],
        SkillsData.tech_stack["knn"]
    ],
    "github_url": "https://github.com/ridwaanhall/handwritten-digit-recognition-of-the-2024-indonesian-presidential-election-recap",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2024-06-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Machine Learning, Pattern Recognition, Election, Computer Vision",
    "tags": [
        "Digit Recognition",
        "HOG",
        "SVM",
        "KNN",
        "Election Data",
        "Pattern Recognition",
        "Python",
        "Indonesia",
        "Handwritten Data",
        "2024 Election"
    ],
    "priority": 1,
    "slug": ""
}
