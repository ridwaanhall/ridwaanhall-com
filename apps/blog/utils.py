from apps.core.utils import load_json_data
import datetime

def get_blog_posts():
    """Get all blog posts from the JSON file, sorted by date."""
    posts = load_json_data('blog', 'blog_posts.json')
    posts.sort(key=lambda x: datetime.datetime.strptime(x['date_published'], '%Y-%m-%d'), reverse=True)
    return posts

def get_post_by_slug(slug):
    """Get a specific blog post by its slug."""
    posts = get_blog_posts()
    for post in posts:
        if post['slug'] == slug:
            return post
    return None