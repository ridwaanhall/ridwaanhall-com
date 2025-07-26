from datetime import datetime
from django.conf import settings

# Blog data for: How Usage Monitoring Sustains MLBB-Stats and API-PDDIKTI
blog_data = {
    "id": 19,
    "title": """How Usage Monitoring Sustains MLBB-Stats and API-PDDIKTI""",
    "description": """Two open APIs now remain online thanks to a threshold system and manual code-based control that ensures sustainable performance.""",
    "images": {
        "api_threshold.webp": f"{settings.BLOG_BASE_IMG_URL}/api_threshold.webp"
    },
    "created_at": datetime.strptime("2025-07-09T21:27:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-07-26T18:56:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "author": "Ridwan Halim",
    "username": "roneha",
    "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
    "content": [
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "Following an earlier announcement about potential API shutdowns, <strong>mlbb-stats.ridwaanhall.com</strong> and <strong>api-pddikti.ridwaanhall.com</strong> will now remain online thanks to a practical threshold-based control system."
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "Each API tracks core resource usage—Function Duration, Edge Requests, Image Optimization, and more. If usage nears a specific limit (e.g. 85% of quota), service is flagged for temporary deactivation. However, unlike automated systems, activation and deactivation remain <strong>manually controlled via backend logic</strong>—giving developers flexibility while preserving stability."
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "This manual switching doesn’t interrupt active requests or user experience. It enables the APIs to remain responsive under heavy load, while administrators oversee usage patterns and toggle service availability when needed."
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "Below is the current usage snapshot used to monitor thresholds:"
        },
        {
            "type": "table",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "headers": ["Metric", "Limit Threshold (85%)", "Maximum Quota"],
            "rows": [
                ["Function Duration", "85 GB-Hrs", "100 GB-Hrs"],
                ["Edge Requests", "850K", "1M"],
                ["Function Invocations", "850K", "1M"],
                ["Fast Origin Transfer", "8.5 GB", "10 GB"],
                ["ISR Reads", "850K", "1M"],
                ["Fast Data Transfer", "85 GB", "100 GB"],
                ["Image Optimization - Transformations", "4.25K", "5K"],
                ["Edge Middleware Invocations", "850K", "1M"],
                ["Image Optimization - Cache Writes", "85K", "100K"],
                ["Image Optimization - Cache Reads", "255K", "300K"]
            ]
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "Thresholds are defined at 85% of the maximum to give room for healthy operation. As long as usage remains under these limits, the APIs stay online and stable."
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "Users and developers are encouraged to continue supporting via <a href='https://saweria.co/ridwaanhall' class='underline'>Saweria</a>, <a href='https://sociabuzz.com/ridwaanhall/support' class='underline'>Sociabuzz</a>, or <a href='https://github.com/sponsors/ridwaanhall' class='underline'>GitHub Sponsors</a>. But thanks to this measured resource model, both APIs remain online—driven by sustainable usage, not shutdown."
        }
    ],
    "is_featured": True,
    "tags": ['Threshold System', 'Manual Control', 'API Sustainability', 'Open Data'],
    "category": "Technology & Community",
    "slug": "how-usage-monitoring-sustains-mlbb-stats-and-api-pddikti"
}
