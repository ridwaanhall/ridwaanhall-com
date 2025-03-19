from django.shortcuts import render
from .utils import get_blog_posts, get_post_by_slug

def blog_list(request):
    posts = get_blog_posts()
    context = {
        'posts': posts
    }
    return render(request, 'blog/blog_list.html', context)

def blog_detail(request, slug):
    post = get_post_by_slug(slug)
    if not post:
        from django.http import Http404
        raise Http404("Blog post does not exist")
        
    context = {
        'post': post
    }
    return render(request, 'blog/blog_detail.html', context)