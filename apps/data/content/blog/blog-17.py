from datetime import datetime
from django.conf import settings

# Blog data for: Why mlbb-stats.ridwaanhall.com and api-pddikti.ridwaanhall.com Go Offline Soon
blog_data = {
    "id": 17,
    "title": """Why mlbb-stats.ridwaanhall.com and api-pddikti.ridwaanhall.com Go Offline Soon""",
    "description": """Discover the story behind two powerful community-driven APIs at risk of shutting down due to hosting limitations—and how you can help keep them alive.""",
    "images": {
        "api_offline_notice.webp": f"{settings.BLOG_BASE_IMG_URL}/api_offline_notice.webp"
    },
    "created_at": datetime.strptime("2025-07-05T02:53:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-07-05T03:23:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "author": "Ridwan Halim",
    "username": "ridwaanhall",
    "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
    "content": [
        "<p class='mb-2 text-sm md:text-base lg:text-lg'>In the spirit of open data and community innovation, two API services—<strong>mlbb-stats.ridwaanhall.com</strong> and <strong>api-pddikti.ridwaanhall.com</strong>—were created to empower developers, researchers, and educators across Indonesia and beyond.</p>",
        "<p class='mb-2 text-sm md:text-base lg:text-lg'>These platforms have served thousands of requests, from Mobile Legends enthusiasts seeking hero statistics, to students and institutions integrating PDDikti education data into apps and systems. But despite their utility and growing reach, they face an urgent threat: <em>discontinuation due to hosting constraints</em>.</p>",
        "<p class='mb-2 text-sm md:text-base lg:text-lg'>Starting <strong>July 5, 2025</strong>, <code>mlbb-stats.ridwaanhall.com</code> is scheduled to go offline. Just days later, on <strong>July 10, 2025</strong>, <code>api-pddikti.ridwaanhall.com</code> may follow suit. The reason is simple: growing traffic demands higher server costs—and right now, there is no financial support sustaining these services.</p>",
        "<p class='mb-2 text-sm md:text-base lg:text-lg'>To maintain them, just <strong>$50/month</strong> is needed. Small contributions can make a big impact. Even <strong>$1</strong> helps edge closer to keeping these tools active for everyone.</p>",
        "<p class='mb-2 text-sm md:text-base lg:text-lg'>You can support via platforms like <a href='https://saweria.co/ridwaanhall' class='underline'>Saweria</a>, <a href='https://sociabuzz.com/ridwaanhall/support' class='underline'>Sociabuzz</a>, or through <a href='https://github.com/sponsors/ridwaanhall' class='underline'>GitHub Sponsors</a>.</p>",
        "<p class='mb-2 text-sm md:text-base lg:text-lg'>So if you've benefited from these APIs or believe in accessible community data, now is the time to act. Let’s make sure <strong>mlbb-stats.ridwaanhall.com</strong> and <strong>api-pddikti.ridwaanhall.com</strong> continue to serve their purpose—not fade into memory.</p>"
    ],
    "is_featured": True,
    "tags": ['API Shutdown', 'Community Projects', 'Open Data', 'Support Needed'],
    "category": "Technology & Community",
    "read_time": 3,
    "views": 0,
    "slug": "why-mlbb-stats-ridwaanhall-com-and-api-pddikti-ridwaanhall-com-go-offline-soon"
}
