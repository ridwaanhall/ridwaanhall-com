from datetime import datetime
from django.conf import settings

# Blog data for: How Usage Monitoring Sustains MLBB-Stats and API-PDDIKTI
blog_data = {
    "id": 19,
    "title": "How Usage Monitoring Sustains MLBB-Stats and API-PDDIKTI",
    "description": (
        "Two open APIs remain online through a robust threshold system and manual code-based controls, "
        "ensuring sustainable performance and reliability."
    ),
    "images": {
        "api_threshold.webp": f"{settings.BLOG_BASE_IMG_URL}/api_threshold.webp"
    },
    "created_at": datetime.strptime("2025-07-09T21:27:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-08-01T18:40:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "author": "Ridwan Halim",
    "username": "roneha",
    "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
    "content": [
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": (
                "Following a previous announcement regarding potential API shutdowns, "
                "<strong>mlbb-stats.ridwaanhall.com</strong> and <strong>api-pddikti.ridwaanhall.com</strong> "
                "will be available again on <strong class='text-yellow-600'>28 August 2025</strong>, or sooner if we receive support with a minimum of <strong>25 USD</strong>."
            )
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": (
                "Each API monitors core resource usage—Function Duration, Edge Requests, Image Optimization, and more. "
                "If usage approaches a defined limit (e.g., 85% of quota), the service is flagged for temporary deactivation. "
                "Unlike automated systems, activation and deactivation are <strong>manually managed via backend logic</strong>, "
                "providing flexibility while maintaining stability."
            )
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": (
                "This manual switching process does not disrupt active requests or user experience. "
                "It allows the APIs to remain responsive under heavy load, while administrators monitor usage patterns "
                "and adjust service availability as needed."
            )
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "Below is the current usage snapshot used to monitor thresholds:"
        },
        {
            "type": "table",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "headers": ["Metric", "Open (≤40%)", "Close (85%)", "Max Quota"],
            "rows": [
                ["Function Duration", "≤ 40 GB-Hrs", "85 GB-Hrs", "100 GB-Hrs"],
                ["Edge Requests", "≤ 400K", "850K", "1M"],
                ["Function Invocations", "≤ 400K", "850K", "1M"],
                ["Fast Origin Transfer", "≤ 4 GB", "8.5 GB", "10 GB"],
                ["ISR Reads", "≤ 400K", "850K", "1M"],
                ["Fast Data Transfer", "≤ 40 GB", "85 GB", "100 GB"],
                ["Image Optimization - Transformations", "≤ 2K", "4.25K", "5K"],
                ["Edge Middleware Invocations", "≤ 400K", "850K", "1M"],
                ["Image Optimization - Cache Writes", "≤ 40K", "85K", "100K"],
                ["Image Optimization - Cache Reads", "≤ 120K", "255K", "300K"]
            ]
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": "Explanation of the table columns:"
        },
        {
            "type": "ul",
            "class": "mb-4 pl-6 list-disc",
            "items": [
                {
                    "type": "li",
                    "class": "text-sm md:text-base lg:text-lg",
                    "text": "<strong>Metric</strong>: The specific resource or operation being monitored (e.g., Function Duration, Edge Requests)."
                },
                {
                    "type": "li",
                    "class": "text-sm md:text-base lg:text-lg",
                    "text": (
                        "<strong>Open (≤40%)</strong>: After a metric reaches the Close threshold (85%) and the API is deactivated, "
                        "it will only be reactivated (Open) once usage drops back to 40% or below. This ensures the API remains stable and prevents rapid toggling."
                    )
                },
                {
                    "type": "li",
                    "class": "text-sm md:text-base lg:text-lg",
                    "text": "<strong>Close (85%)</strong>: Usage threshold at which the API is flagged for potential temporary deactivation to prevent overuse."
                },
                {
                    "type": "li",
                    "class": "text-sm md:text-base lg:text-lg",
                    "text": "<strong>Max Quota</strong>: The absolute maximum allowed usage for the metric within the billing period."
                }
            ]
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": (
                "Thresholds are set at 85% of the maximum quota to ensure healthy operation. "
                "As long as usage remains below these limits, the APIs remain online and stable. "
                "APIs are considered fully accessible when usage is at or below 40% of the quota."
            )
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg",
            "text": (
                "If you find these APIs useful and would like to support ongoing development and maintenance, "
                "you can support me via:"
            )
        },
        {
            "type": "ul",
            "class": "mb-4 pl-6 list-disc",
            "items": [
                {
                    "type": "li",
                    "class": "text-sm md:text-base lg:text-lg",
                    "text": "<a href='https://github.com/sponsors/ridwaanhall' class='underline'>GitHub Sponsors</a>"
                },
                {
                    "type": "li",
                    "class": "text-sm md:text-base lg:text-lg",
                    "text": "<a href='https://saweria.co/ridwaanhall' class='underline'>Saweria</a>"
                },
                {
                    "type": "li",
                    "class": "text-sm md:text-base lg:text-lg",
                    "text": "<a href='https://sociabuzz.com/ridwaanhall/support' class='underline'>Sociabuzz</a>"
                }
            ]
        },
        {
            "type": "p",
            "class": "mb-2 text-sm md:text-base lg:text-lg text-yellow-700",
            "text": "<strong>Suggestion:</strong> To save API usage, you can use caching in your application or browser. With caching, reloading the page will not always fetch data directly from the API, which helps reduce your API usage limits."
        },
    ],
    "is_featured": True,
    "tags": ['Threshold System', 'Manual Control', 'API Sustainability', 'Open Data'],
    "category": "Technology & Community",
    "slug": "how-usage-monitoring-sustains-mlbb-stats-and-api-pddikti"
}
