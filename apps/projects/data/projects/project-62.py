from dataclasses import asdict
from datetime import datetime
from django.conf import settings
from apps.projects.types import Feature, ProjectData, ProjectStatus
from apps.about.data.skills_data import SkillsData

# SEO-Optimized Project Data
project_data = asdict(ProjectData(
    # Core Identity
    id=62,
    title="IHSG AlgoTrader",
    headline="Automated trading system for IHSG stocks with overnight and swing trading strategies.",

    # Detailed Description
    description=[
        "IHSG AlgoTrader is an advanced automated trading platform designed for the Indonesian capital market, built to help traders achieve monthly profits exceeding 50% by leveraging overnight and swing trading strategies through multiple approaches. The system combines short-term price movement analysis with medium-term market trend detection, offering a balanced framework for consistent profitability.",
        "Developed with Python and Django, it integrates seamlessly with broker APIs to enable real-time execution and portfolio management, while Pandas and NumPy power its data analysis capabilities. TA-Lib enriches the platform with a wide range of technical indicators, including moving averages, RSI, MACD, and Bollinger Bands, ensuring robust signal generation.",
        "A built-in backtesting engine allows users to simulate strategies against historical IHSG data, providing insights into profitability, drawdowns, and risk-adjusted returns before live deployment. Risk management is central to the system, with configurable stop-loss, take-profit, and dynamic position sizing features that promote disciplined trading and capital preservation.",
        "Its modular architecture supports extensibility, making it easy to add new strategies, integrate additional brokers, or experiment with custom indicators without disrupting the system. Designed for scalability, IHSG AlgoTrader can run locally for personal use or be deployed to cloud environments for continuous automated trading.",
        "This makes it an ideal solution not only for traders seeking automation in overnight and swing trading but also for fintech developers exploring algorithmic trading innovations in Indonesia’s capital market.",
    ],

    # Key Features
    features=[
        Feature(
            title="Overnight & Swing Strategies",
            description="Implements overnight and swing trading strategies tailored for IHSG stocks."
        ),
        Feature(
            title="Broker Integration",
            description="Supports broker API connections for live trading execution and portfolio management."
        ),
        Feature(
            title="Risk Management",
            description="Configurable stop-loss, take-profit, and position sizing for disciplined trading."
        ),
        Feature(
            title="Backtesting Engine",
            description="Simulate strategies using historical IHSG data to validate performance before deployment."
        ),
        Feature(
            title="Extensible Architecture",
            description="Easily add new strategies, brokers, or indicators with modular design."
        ),
    ],

    # Media
    images={
        "ihsg_algotrader_overview.webp": f"{settings.PROJECT_BASE_IMG_URL}/ihsg_algotrader_overview.webp",
    },

    # Tech Stack
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["pandas"],
        SkillsData.tech_stack["numpy"],
    ],

    # Links
    github_url=None,
    demo_url=None,

    # SEO & Categorization
    category="fintech",
    tags=[
        "python", "django", "ihsg", "trading",
        "overnight-trading", "swing-trading",
        "algorithmic-trading", "backtesting",
    ],

    # Status
    is_featured=False,
    featured_priority=None,
    status=ProjectStatus.DESIGN,

    # Timestamps
    created_at=datetime.strptime("2026-03-13T15:28:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2026-04-21T15:28:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
