from datetime import datetime
from django.conf import settings

# Blog data for: Why mlbb-stats.ridwaanhall.com and api-pddikti.ridwaanhall.com Remain Online with Memory Usage Threshold
blog_data = {
    "id": 17,
    "title": """mlbb-stats.ridwaanhall.com and api-pddikti.ridwaanhall.com Remain Online with Memory Usage Threshold""",
    "description": """The planned shutdown is canceled. Both APIs remain accessible, but now operate under a memory usage threshold. Learn more about the changes.""",
    "images": {
        "api_offline_notice.webp": f"{settings.BLOG_BASE_IMG_URL}/api_offline_notice.webp"
    },
    "created_at": datetime.strptime("2025-07-05T02:53:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-07-22T14:29:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "author": "Ridwan Halim",
    "username": "roneha",
    "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
    "content": [
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "Good news for the community! The planned shutdown of <strong>mlbb-stats.ridwaanhall.com</strong> and <strong>api-pddikti.ridwaanhall.com</strong> has been canceled. Both API services will remain accessible to developers, researchers, and educators."
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "However, to ensure sustainability, both platforms now operate under a memory usage threshold. This means that while you can still access the APIs, heavy or excessive usage may be limited to prevent server overload."
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "These changes help keep the services running for everyone, balancing resource constraints with community needs. Please be mindful of your usage and consider optimizing your requests."
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "Support is still appreciated to help cover hosting costs and improve service reliability. You can contribute via <a href='https://saweria.co/ridwaanhall' class='underline'>Saweria</a>, <a href='https://sociabuzz.com/ridwaanhall/support' class='underline'>Sociabuzz</a>, or <a href='https://github.com/sponsors/ridwaanhall' class='underline'>GitHub Sponsors</a>."
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "Thank you for your continued support and understanding. Let's keep <strong>mlbb-stats.ridwaanhall.com</strong> and <strong>api-pddikti.ridwaanhall.com</strong> available for the community!"
        }
    ],
    "is_featured": False,
    "tags": ['API Update', 'Community Projects', 'Open Data', 'Support Needed'],
    "category": "Technology & Community",
    "read_time": 3,
    "views": 0,
    "slug": "mlbb-stats-ridwaanhall-com-and-api-pddikti-ridwaanhall-com-remain-online-with-memory-threshold"
}
