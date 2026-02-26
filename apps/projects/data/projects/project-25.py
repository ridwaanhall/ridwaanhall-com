"""
Project #25: Election Digit Scanner
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=25,
    title='Election Digit Scanner',
    headline='Nail handwritten digit recognition for 2024 Indonesia vote recaps with HOG and SVM.',
    description=['This project kills data entry errors in the 2024 Indonesian Presidential Election vote recap with cutting-edge pattern recognition.', 'Uses Histogram of Oriented Gradients (HOG) for feature extraction and K-Nearest Neighbors (KNN) plus Support Vector Machine (SVM) for classification, hitting over 97% accuracy.', 'Experiments prove HOG + SVM is the champ, delivering top-tier performance across dataset splits.'],
    features=[
        Feature(title='HOG Feature Magic', description='Extracts edges and gradients for pinpoint digit recognition.'),
        Feature(title='SVM & KNN Power', description='Drops 97%+ accuracy with killer classification algorithms.'),
        Feature(title='Performance Breakdown', description='Compares extraction vs. no-extraction for clear wins.'),
    ],
    images={
        "election_digits_training.webp": f"{settings.PROJECT_BASE_IMG_URL}/election_digits_training.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["hog"],
        SkillsData.tech_stack["svm"],
        SkillsData.tech_stack["knn"],
    ],
    github_url='https://github.com/ridwaanhall/handwritten-digit-recognition-of-the-2024-indonesian-presidential-election-recap',
    demo_url='',
    category='Machine Learning, Pattern Recognition, Election, Computer Vision',
    tags=['Digit Recognition', 'HOG', 'SVM', 'KNN', 'Election Data', 'Pattern Recognition', 'Python', 'Indonesia', 'Handwritten Data', '2024 Election'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2024-06-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2024-06-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
