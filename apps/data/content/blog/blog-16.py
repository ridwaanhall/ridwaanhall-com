"""
Blog Post #16: What Is an Exoplanet? – A Tale from Beyond Our Sky
Generated from centralized blog data
"""

from datetime import datetime
from django.conf import settings

# Blog data for: What Is an Exoplanet? – A Tale from Beyond Our Sky
blog_data = {
    "id": 16,
    "title": """What Is an Exoplanet? – A Tale from Beyond Our Sky""",
    "description": """Venture into distant star systems as we uncover what exoplanets are and how they fuel our cosmic curiosity.""",
    "images": {
        "exoplanet_tale.webp": f"{settings.BLOG_BASE_IMG_URL}/exoplanet_tale.webp"
    },
    "created_at": datetime.strptime("2025-06-30T08:10:55+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-07-05T03:02:55+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "author": "Ridwan Halim",
    "username": "roneha",
    "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
    "content": [
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "Once upon a time, in a corner of the universe lit by a humble yellow star, Earth's astronomers gazed up at the sky—and wondered: are we truly alone? As telescopes swept through the vast cosmic ocean, they uncovered whispers of other worlds. Not within our Solar System, but far beyond it, orbiting stars that also shine in the expanse of the cosmos. These distant and mysterious realms came to be known as <strong>exoplanets</strong>—planets that exist beyond our solar neighborhood."
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "Some exoplanets are giant gas worlds, larger than Jupiter, shrouded in thick atmospheres and raging storms. Others are small and rocky, like Earth, resting in what's known as the <strong>habitable zone</strong>—where liquid water might flow across the surface. A few even drift through the galaxy alone, without a star to orbit—solitary wanderers adrift in the dark."
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "Scientists became <em>cosmic detectives</em>. By analyzing the faint flicker of starlight and subtle wobbles in stellar motion, they began to catalogue these alien worlds—each discovery a fresh clue, each orbit a puzzle. Over <strong>5,000 exoplanets</strong> have now been confirmed—and that number keeps growing."
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "And yet, beyond the numbers and diagrams, every exoplanet lights a spark that endures through time: <em>human imagination</em>. Could there be life out there? Strange sunrises? Civilizations gazing at their own stars, pondering the same questions?"
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "So, the next time night falls and you look up at the stars, remember—those glimmering dots may cradle their own spinning worlds, filled with stories we've yet to read."
        }
    ],
    "is_featured": False,
    "tags": ['Astronomy', 'Exoplanets', 'Space Exploration', 'Science Storytelling'],
    "category": "Science & Space",
    "read_time": 4,
    "views": 0,
    "slug": "what-is-an-exoplanet-tale-from-beyond-our-sky"
}
