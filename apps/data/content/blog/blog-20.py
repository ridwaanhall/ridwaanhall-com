"""
Blog Post #20
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import BlogData


blog_data = asdict(BlogData(
    id=20,
    title='Commit Message Style Guide',
    description='A practical guide to writing expressive and consistent commit messages using emojis, types, scopes, and summaries. This format improves readability, collaboration, and branding across projects.',
    author='Ridwan Halim',
    username='ridwaanhall',
    author_image=settings.AUTHOR_IMG,
    images={
        "commit_style.webp": f"{settings.BLOG_BASE_IMG_URL}/commit_style.webp",
    },
    created_at=datetime.strptime("2026-01-23T20:55:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2026-01-23T20:55:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    content=[{'type': 'p', 'class': 'mb-2 text-sm md:text-base lg:text-lg', 'text': 'Commit messages are more than just notes—they are a communication tool. By using emojis and a consistent format, teams can quickly understand the purpose of each commit while keeping the history fun and easy to scan.'}, {'type': 'p', 'class': 'mb-2 text-sm md:text-base lg:text-lg', 'text': 'We follow this pattern for commit messages:'}, {'type': 'code', 'class': 'mb-4 text-sm md:text-base lg:text-lg', 'text': '[emoji][type](scope): summary'}, {'type': 'table', 'class': 'mb-4 text-sm md:text-base lg:text-lg', 'headers': ['Emoji', 'Type', 'Tagline', 'Example'], 'rows': [['✨', 'feat', 'Drop something new and shiny', '✨feat(contact-form): Add auto-reply with HTML + text templates'], ['🐛', 'fix', 'Squash bugs like a boss', '🐛fix(auth): Resolve token expiration issue causing login failures'], ['📝', 'docs', 'Make your docs sparkle', '📝docs(api): Add usage examples for public endpoints'], ['🎨', 'style', 'Keep it pretty—no logic changes', '🎨style(ui): Adjust button spacing and update color palette'], ['🔄', 'refactor', 'Revamp code for max vibes', '🔄refactor(database): Streamline query logic for better readability'], ['🧪', 'test', 'Lock in those tests', '🧪test(user): Add unit tests for profile update flow'], ['⚡', 'perf', 'Speed things up—wow factor', '⚡perf(images): Optimize image loading for faster rendering'], ['🤖', 'ci', 'Keep CI humming', '🤖ci(github-actions): Tweak workflow for parallel jobs'], ['🛠️', 'build', 'Solidify your setup', '🛠️build(config): Update webpack settings for production'], ['🚧', 'chore', 'Handle the grunt work', '🚧chore(deps): Bump dependencies to latest stable versions'], ['⏪', 'revert', 'Hit rewind when needed', '⏪revert(auth): Undo faulty commit causing login errors']]}, {'type': 'p', 'class': 'mb-2 text-sm md:text-base lg:text-lg', 'text': 'This style guide ensures that commit history remains structured and expressive. Each emoji provides instant context, while the type and scope clarify the exact purpose.'}],
    tags=['Commit Style', 'Conventional Commits', 'Developer Experience', 'Team Collaboration'],
    category='Technology & Community',
    slug='commit-message-style-guide',
    is_featured=True,
    read_time=None,
    views=None,
))
