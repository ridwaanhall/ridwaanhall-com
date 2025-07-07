# 🚀 FlexForge - Advanced Developer Portfolio Platform

[![Django](https://img.shields.io/badge/Django-5.2.4-092E20?style=flat&logo=django&logoColor=white)](https://djangoproject.com/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

![FlexForge Portfolio](https://ridwaanhall.com/static/img/project/ridwaanhall_com_2025070701.webp)

> **A modern portfolio template with individual file data management, real-time API integrations, configurable guestbook, and enterprise-grade security.**

## ✨ Key Features

- **🗂️ Individual File System**: Each project and blog post in separate Python files
- **📊 Real-time Analytics**: GitHub and WakaTime API integration
- **💬 Interactive Guestbook**: Configurable chat-like messaging (can be disabled)
- **🚀 High Performance**: 97+/100 PageSpeed scores
- **🛡️ Security-First**: CSP, HSTS, XSS protection
- **📱 Responsive Design**: Mobile-optimized with Tailwind CSS
- **🖼️ Image Optimization**: wsrv.nl - Image proxy/CDN for automatic resizing

## 🛠️ Tech Stack

- **Backend**: Django 5.2.4, Python 3.12
- **Frontend**: TailwindCSS, Vanilla JavaScript
- **Data**: Individual Python files for content management
- **APIs**: GitHub API, WakaTime API
- **Security**: django-csp, permissions-policy, XSS protection
- **Deployment**: Vercel, WhiteNoise

## 📊 Performance Metrics

### Desktop: 97/100 | Mobile: 91/100 PageSpeed Scores

[![Performance: 97](https://img.shields.io/badge/Performance-97-success?style=for-the-badge)](https://pagespeed.web.dev/)
[![SEO: 100](https://img.shields.io/badge/SEO-100-success?style=for-the-badge)](https://pagespeed.web.dev/)

## 🏗️ Project Structure

```txt
FlexForge/
├── apps/
│   ├── data/                    # Individual File System
│   │   ├── content_manager.py   # Central data controller
│   │   └── content/
│   │       ├── projects/        # Individual project files
│   │       │   ├── project-1.py
│   │       │   └── project-N.py
│   │       └── blog/           # Individual blog files
│   │           ├── blog-1.py
│   │           └── blog-N.py
│   ├── core/                   # Homepage & base functionality
│   ├── dashboard/              # Analytics dashboard
│   ├── guestbook/              # Interactive guestbook (optional)
│   ├── projects/               # Project showcase
│   ├── blog/                   # Blog system
│   └── seo/                    # SEO management
├── templates/                  # HTML templates
├── static/                     # Static assets
└── docs/                      # Documentation
```

## ⚡ Quick Start

```bash
# Clone repository
git clone https://github.com/ridwaanhall/ridwaanhall-com.git
cd ridwaanhall-com

# Setup virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
python manage.py runserver
```

## 🔧 Environment Configuration

Create `.env` file:

```env
# Core Settings
BASE_URL="https://your-domain.com"
SECRET_KEY="your-django-secret-key"
DEBUG=True

# API Keys
ACCESS_TOKEN="your-github-token"
WAKATIME_API_KEY="your-wakatime-key"

# Feature Toggle
GUESTBOOK_PAGE=True  # Set to False to disable guestbook

# OAuth (Required only when GUESTBOOK_PAGE=True)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GH_CLIENT_ID="your-github-client-id"
GH_CLIENT_SECRET="your-github-client-secret"
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BASE_URL` | Yes | Your domain URL |
| `SECRET_KEY` | Yes | Django secret key |
| `ACCESS_TOKEN` | Yes | GitHub personal access token |
| `WAKATIME_API_KEY` | Yes | WakaTime API key |
| `GUESTBOOK_PAGE` | No | Enable/disable guestbook (default: True) |
| `GOOGLE_CLIENT_ID` | If guestbook enabled | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | If guestbook enabled | Google OAuth secret |
| `GH_CLIENT_ID` | If guestbook enabled | GitHub OAuth client ID |
| `GH_CLIENT_SECRET` | If guestbook enabled | GitHub OAuth secret |

### Environment Variables Documentation

This project requires several environment variables for proper functionality. Create a `.env` file in your project root with the following configuration:

#### Core Application Settings

- **BASE_URL**: Your application's domain URL (e.g., <https://yoursite.com>)
- **SECRET_KEY**: Django's secret key for cryptographic signing - generate using `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`
- **DEBUG**: Set to `True` for development, `False` for production

#### API Integration Keys

- **ACCESS_TOKEN**: GitHub Personal Access Token
  - Go to GitHub Settings → Developer settings → Personal access tokens
  - Generate new token with repo and user permissions
- **WAKATIME_API_KEY**: WakaTime API key for coding statistics
  - Visit WakaTime Settings → API Key section
  - Copy your secret API key

#### Feature Configuration

- **GUESTBOOK_PAGE**: Boolean to enable/disable guestbook functionality
  - Set to `True` to enable guestbook with authentication
  - Set to `False` to disable and skip OAuth setup

#### OAuth Configuration (Required only when GUESTBOOK_PAGE=True)

- **GOOGLE_CLIENT_ID** & **GOOGLE_CLIENT_SECRET**: Google OAuth credentials
  - Create project at Google Cloud Console
  - Enable Google+ API
  - Create OAuth 2.0 credentials
- **GH_CLIENT_ID** & **GH_CLIENT_SECRET**: GitHub OAuth credentials
  - Go to GitHub Settings → Developer settings → OAuth Apps
  - Create new OAuth app with your callback URLs

## 🗂️ Individual File System

### Revolutionary Content Management

Each project and blog post exists as a separate Python file:

**Projects**: `apps/data/content/projects/project-1.py`

```python
project_data = {
    "title": "My Amazing Project",
    "description": "Project description",
    "technologies": ["Python", "Django", "React"],
    "github_url": "https://github.com/user/repo",
    "demo_url": "https://demo.com",
    "featured": True
}
```

**Blog Posts**: `apps/data/content/blog/blog-1.py`

```python
blog_data = {
    "id": 1,
    "title": "My First Blog Post",
    "description": "A comprehensive guide to getting started...",
    "images": {
        "main-hero.webp": f"{settings.BLOG_BASE_IMG_URL}/main-hero.webp",
        "gallery-1.webp": f"{settings.BLOG_BASE_IMG_URL}/gallery-1.webp"
    },
    "created_at": datetime.strptime("2024-01-01T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2024-01-01T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "author": "Author Name",
    "username": "author_username",
    "author_image": f"{settings.BASE_URL}/static/img/author.webp",
    "content": [
        {
            "type": "p",
            "class": "mb-4 text-sm md:text-base lg:text-lg",
            "text": "Blog content with structured format..."
        },
        {
            "type": "h2",
            "class": "text-xl md:text-2xl lg:text-3xl font-bold mb-4 mt-8",
            "text": "Section Title"
        },
        {
            "type": "ul",
            "class": "mb-4 pl-6 list-disc",
            "items": [
                {
                    "type": "li",
                    "class": "text-sm md:text-base lg:text-lg",
                    "text": "List item content"
                }
            ]
        },
        {
            "type": "pre",
            "class": "bg-zinc-800 p-3 rounded-lg mb-4 overflow-x-auto",
            "text": "<code class=\"language-python\">print('Hello, World!')</code>"
        }
    ],
    "is_featured": True,
    "tags": ["Python", "Tutorial", "Getting Started"],
    "category": "Programming",
    "read_time": 5,
    "views": 0,
    "slug": "my-first-blog-post"
}
```

### Benefits

- **Easy Management**: Add/edit content without touching large files
- **Version Control**: Each post/project tracked separately
- **Performance**: Intelligent caching and lazy loading
- **Scalability**: Unlimited content with organized structure

## 💬 Guestbook Configuration

### Enable Guestbook (Default)

```env
GUESTBOOK_PAGE=True
```

### Disable Guestbook

```env
GUESTBOOK_PAGE=False
```

When disabled:

- No authentication required
- Smaller bundle size
- Faster loading
- OAuth variables become optional

## 🚀 Deployment

### One-Click Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?demo-description=Advanced%20developer%20portfolio%20platform%20with%20individual%20file%20data%20management%2C%20real-time%20API%20integrations%2C%20and%20enterprise-grade%20security.&demo-image=https%3A%2F%2Fridwaanhall.com%2Fstatic%2Fimg%2Fproject%2Fridwaanhall_com_2025070701.webp&demo-title=FlexForge%20Portfolio&demo-url=https%3A%2F%2Fridwaanhall.com&from=templates&project-name=FlexForge%20Portfolio&repository-name=flexforge-portfolio&repository-url=https%3A%2F%2Fgithub.com%2Fridwaanhall%2Fridwaanhall-com)

### Manual Vercel Setup

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`
3. Set environment variables in Vercel dashboard

### Alternative Platforms

- **Heroku**: Full Django support
- **DigitalOcean**: App Platform
- **Railway**: Simple deployment
- **VPS**: Nginx + Gunicorn setup

## 🔒 Security Features

- **Content Security Policy**: XSS protection
- **HSTS**: HTTPS enforcement
- **Secure Headers**: X-Frame-Options, X-Content-Type-Options
- **CSRF Protection**: All forms protected
- **Input Validation**: User input sanitization
- **OAuth Security**: Secure authentication flow

## 📈 Performance Optimization

- **Caching**: 3-hour API cache
- **Image Optimization**: WebP format, responsive sizing
- **Static Files**: WhiteNoise compression
- **Database**: Optimized queries
- **Lazy Loading**: Non-blocking resources

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push branch: `git push origin feature/name`
5. Open pull request

## 📄 License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

## 👨‍💻 Template Usage

To customize this template:

1. Update personal info in `apps/data/about/`
2. Add projects in `apps/data/content/projects/`
3. Create blog posts in `apps/data/content/blog/`
4. Configure API keys
5. Deploy to your preferred platform

---

**FlexForge** - Professional portfolio platform built with Django and modern web technologies.
