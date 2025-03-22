from django.views.generic import TemplateView

class BlogView(TemplateView):
    template_name = 'blog/blog_list.html'
    
class BlogDetailView(TemplateView):
    template_name = 'blog/blog_detail.html'