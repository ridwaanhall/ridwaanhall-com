"""
Blog Post #8: Nail Your Git Game with Conventional Commits
Generated from centralized blog data
"""

from datetime import datetime
from django.conf import settings

# Blog data for: Nail Your Git Game with Conventional Commits
blog_data = {
    "id": 8,
    "title": """Nail Your Git Game with Conventional Commits""",
    "description": """Make your commit messages pop with style and clarity—tell your code's story like a pro!""",
    "images": {
        "conventional_commits_guide.webp": f"{settings.BLOG_BASE_IMG_URL}/conventional_commits_guide.webp"
    },
    "created_at": datetime.strptime("2025-04-04T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-07-22T14:29:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "author": "Ridwan Halim",
    "username": "roneha",
    "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
    "content": [
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "Version control is the backbone of modern software development, and well-structured commit messages are essential for maintaining clean, understandable project histories. Conventional Commits provide a standardized format that enhances collaboration, automates versioning, and makes codebases more maintainable for teams of all sizes."
        },
        {
            "type": "h2",
            "class": "text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3",
            "text": "Understanding Conventional Commits"
        },
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "Commits aren't just logs—they're your code's epic saga. Conventional Commits keep it clean and fun. Here's the playbook to slay it:"
        },
        {
            "type": "h3",
            "class": "text-lg md:text-xl  mt-3 md:mt-4 mb-2",
            "text": "Core Commit Types and Their Usage"
        },
        {
            "type": "ul",
            "class": "list-disc pl-5",
            "items": [
                {
                    "type": "li",
                    "text": "<span class=' text-blue-500'>✨ feat:</span> Drop something new and shiny! Like: <span class='font-mono text-blue-500'>feat: add user login flow</span>"
                },
                {
                    "type": "li",
                    "text": "<span class=' text-red-500'>🛠️ fix:</span> Squash bugs like a boss. Like: <span class='font-mono text-red-500'>fix: patch login glitch</span>"
                },
                {
                    "type": "li",
                    "text": "<span class=' text-yellow-500'>📝 docs:</span> Make your docs sparkle. Like: <span class='font-mono text-yellow-500'>docs: beef up API guide</span>"
                },
                {
                    "type": "li",
                    "text": "<span class=' text-purple-500'>🎨 style:</span> Keep it pretty—no logic changes. Like: <span class='font-mono text-purple-500'>style: tidy up CSS</span>"
                },
                {
                    "type": "li",
                    "text": "<span class=' text-orange-500'>🔄 refactor:</span> Revamp code for max vibes. Like: <span class='font-mono text-orange-500'>refactor: streamline DB calls</span>"
                },
                {
                    "type": "li",
                    "text": "<span class=' text-pink-500'>🧪 test:</span> Lock in those tests. Like: <span class='font-mono text-pink-500'>test: add auth unit tests</span>"
                },
                {
                    "type": "li",
                    "text": "<span class=' text-green-500'>⚡ perf:</span> Speed things up—wow factor! Like: <span class='font-mono text-green-500'>perf: optimize image load</span>"
                },
                {
                    "type": "li",
                    "text": "<span class=' text-indigo-500'>🤖 ci:</span> Keep CI humming. Like: <span class='font-mono text-indigo-500'>ci: tweak GitHub Actions</span>"
                },
                {
                    "type": "li",
                    "text": "<span class=' text-zinc-500'>🛠️ build:</span> Solidify your setup. Like: <span class='font-mono text-zinc-500'>build: update webpack</span>"
                },
                {
                    "type": "li",
                    "text": "<span class=' text-teal-500'>🚧 chore:</span> Handle the grunt work. Like: <span class='font-mono text-teal-500'>chore: bump dependencies</span>"
                },
                {
                    "type": "li",
                    "text": "<span class=' text-rose-500'>⏪ revert:</span> Hit rewind when needed. Like: <span class='font-mono text-rose-500'>revert: undo buggy commit</span>"
                }
            ]
        },
        {
            "type": "h2",
            "class": "text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3",
            "text": "Benefits of Conventional Commits"
        },
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "Adopting Conventional Commits offers numerous advantages for development teams. The standardized format enables automatic changelog generation, simplifies semantic versioning decisions, and provides clear context for code changes. This approach makes repository histories more navigable and helps new team members understand project evolution more quickly."
        },
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "In the rapidly evolving field of artificial intelligence and deep learning, two frameworks have emerged as frontrunners: PyTorch and TensorFlow. These powerful tools have become essential for researchers, developers, and companies building cutting-edge AI solutions. Understanding their differences and strengths is crucial for selecting the right framework for your specific needs."
        },
        {
            "type": "h2",
            "class": "text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3",
            "text": "Core Philosophy and Development Approach"
        },
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "PyTorch and TensorFlow are the heavyweights of deep learning, but they've got different vibes. TensorFlow's Google-backed, with a static graph setup that's a beast for scaling and deploying to production—think TensorFlow Serving for servers or Lite for mobiles."
        },
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "PyTorch, from Meta, is the chill coder's choice—dynamic graphs make debugging a breeze, and its Python-y flow feels like home for research nerds. Tools like TorchServe are catching up for production, too."
        },
        {
            "type": "h2",
            "class": "text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3",
            "text": "Ecosystem and Tooling Comparison"
        },
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "TensorFlow's got a massive toolbox: TensorBoard for slick visuals, TensorFlow.js for web apps, and optimizations that scream speed on specific hardware. PyTorch counters with fastai for quick models and GPU-friendly coding that's a joy to tweak."
        },
        {
            "type": "h2",
            "class": "text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3",
            "text": "Performance and Deployment Considerations"
        },
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "Both handle GPUs and TPUs like champs, but TensorFlow's got a slight edge in raw performance. Pick TensorFlow for bulletproof production apps, or PyTorch if you're tinkering and iterating like a mad scientist."
        },
        {
            "type": "h2",
            "class": "text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3",
            "text": "Making Your Framework Decision"
        },
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "Your choice between PyTorch and TensorFlow should align with your specific project requirements, team expertise, and deployment needs. For production-ready applications with enterprise support, TensorFlow offers robust solutions. For research projects and rapid experimentation, PyTorch's intuitive design may be more suitable. Many organizations maintain expertise in both frameworks to leverage their respective strengths."
        }
    ],
    "is_featured": False,
    "tags": ['PyTorch', 'TensorFlow', 'AI', 'Deep Learning', 'ML'],
    "category": "",
    "read_time": 5,
    "views": 0,
    "slug": ""
}
