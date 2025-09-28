"""
Project #53: n8n Shopping Data Bot
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: n8n Shopping Data Bot
project_data = {
    # Identity
    "id": 53,
    "title": "n8n Shopping Data Bot",
    "headline": "A personal finance tracking bot powered by n8n and AI, with automated input via Telegram and receipt OCR, then stored in Google Sheets.",

    # Core Content
    "description": [
        "This project offers an automated personal finance tracking solution using n8n as a visual automation platform. Users can send shopping receipts via Telegram, and the bot extracts text using OCR (Gemini AI) and stores the data in Google Sheets.",
        "It’s ideal for beginners who want to manage their expenses without writing complex code. Daily, weekly, and monthly reports are available directly from Google Sheets.",
        "The integration includes Gemini AI API setup, Telegram bot configuration, and Google Sheets credentials. The workflow can be imported into n8n and customized as needed.",
        "The project is open to contributions, with potential extensions such as WhatsApp, Notion, or Firebase integration.",
        "Its core mission is to empower the Indonesian community to build smart and impactful automation solutions."
    ],
    "features": [
        {
            "title": "Receipt Upload",
            "description": "The bot reads text from images using OCR (Gemini AI) and logs the details into Google Sheets."
        },
        {
            "title": "Telegram Input",
            "description": "Send expense entries directly via Telegram chat—simple and fast."
        },
        {
            "title": "Automated Reports",
            "description": "Receive daily, weekly, and monthly expense summaries."
        },
        {
            "title": "Modular Workflow",
            "description": "n8n workflows are customizable and optimized for various use cases."
        },
        {
            "title": "No-Code Integration",
            "description": "Uses n8n as a visual automation platform without manual coding."
        }
    ],
    "images": {
        "n8n_shopping_node.webp": f"{settings.PROJECT_BASE_IMG_URL}/n8n_shopping_node.webp",
        "n8n_image_input.webp": f"{settings.PROJECT_BASE_IMG_URL}/n8n_image_input.webp",
        "n8n_text_input.webp": f"{settings.PROJECT_BASE_IMG_URL}/n8n_text_input.webp",
    },

    # Tech & Resources
    "tech_stack": [
        SkillsData.tech_stack["n8n"],
        SkillsData.tech_stack["telegram"],
        SkillsData.tech_stack["sheets"],
        SkillsData.tech_stack["gemini"],
    ],
    "github_url": "https://github.com/ridwaanhall/n8n-pendataan-shopping",
    "demo_url": "",

    # Classification
    "category": "automation",
    "tags": [
        "n8n",
        "finance-automation",
        "telegram",
        "ocr",
        "gemini-ai",
        "google-sheets",
        "no-code",
        "workflow",
        "personal-finance",
        "bot"
    ],

    # Status & Meta
    "is_featured": False,
    "featured_priority": None,
    "status": "completed",
    "created_at": datetime.strptime("2025-09-25T14:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-09-25T16:05:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
}
