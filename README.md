# 🚀 FlexForge - Advanced Developer Portfolio Platform

[![Django](https://img.shields.io/badge/Django-5.2.5-092E20?style=flat&logo=django&logoColor=white)](https://djangoproject.com/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

![FlexForge Portfolio](https://ridwaanhall.com/static/img/project/ridwaanhall_com_2025070701.webp)

> **A modern portfolio template with individual file data management, real-time API integrations, configurable guestbook, and enterprise-grade security.**

## ✨ Key Features

- **🗂️ Individual File System**: Each project and blog post in separate Python files
- **📊 Real-time Analytics**: GitHub and WakaTime API integration
- **💬 Interactive Guestbook**: Configurable chat-like messaging (can be disabled)
- **🚀 High Performance**: 99+/100 PageSpeed scores
- **🛡️ Security-First**: CSP, HSTS, XSS protection
- **📱 Responsive Design**: Mobile-optimized with Tailwind CSS
- **🖼️ Image Optimization**: wsrv.nl - Image proxy/CDN for automatic resizing

## 🛠️ Tech Stack

- **Backend**: Django 5.2.5, Python 3.12
- **Frontend**: TailwindCSS, Vanilla JavaScript
- **Data**: Individual Python files for content management
- **APIs**: GitHub API, WakaTime API
- **Security**: django-csp, permissions-policy, XSS protection
- **Deployment**: Vercel, WhiteNoise

## 📊 PageSpeed Insights

[![Desktop: 99.5](https://img.shields.io/badge/Desktop-99.5-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/rstqtcxhc0?form_factor=desktop)
[![Mobile: 99](https://img.shields.io/badge/Mobile-99-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/rstqtcxhc0?form_factor=mobile)

| Platform | Performance | Accessibility | Best Practices | SEO | Average |
|----------|-------------|---------------|----------------|-----|---------|
| **Desktop** | 98 | 100 | 100 | 100 | **99.5** |
| **Mobile** | 96 | 100 | 100 | 100 | **99** |
| **Average** | **97** | **100** | **100** | **100** | **99.25** |

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
ALLOWED_HOSTS=""

# Feature Toggles
GUESTBOOK_PAGE=True  # Set to False to disable guestbook
WSRV_IMAGE_OPTIMIZATION=True

# API Keys
ACCESS_TOKEN="your-github-token"
WAKATIME_API_KEY="your-wakatime-key"
WEB3FORM_PAC=""

# OAuth (Required only when GUESTBOOK_PAGE=True)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GH_CLIENT_ID=""
GH_CLIENT_SECRET=""

# PostgreSQL Database (Production only)
POSTGRES_DATABASE="your-database"
POSTGRES_HOST="your-host"
POSTGRES_PASSWORD="your-password"
POSTGRES_USER="your-user"
POSTGRES_PORT="5432"

# Image URLs (Optional)
BLOG_BASE_IMG_URL=""
PROJECT_BASE_IMG_URL=""
```

| Variable | Required | Description |
|----------|----------|-------------|
| `BASE_URL` | Yes | Your domain URL |
| `SECRET_KEY` | Yes | Django secret key |
| `DEBUG` | No | Enable debug mode (default: False) |
| `ALLOWED_HOSTS` | No | Comma-separated allowed hosts for development |
| `ACCESS_TOKEN` | Yes | GitHub personal access token |
| `WAKATIME_API_KEY` | Yes | WakaTime API key |
| `WEB3FORM_PAC` | No | Web3Forms access key for contact forms |
| `GUESTBOOK_PAGE` | No | Enable/disable guestbook (default: True) |
| `WSRV_IMAGE_OPTIMIZATION` | No | Enable wsrv.nl image optimization (default: True) |
| `GOOGLE_CLIENT_ID` | If guestbook enabled | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | If guestbook enabled | Google OAuth secret |
| `GH_CLIENT_ID` | If guestbook enabled | GitHub OAuth client ID |
| `GH_CLIENT_SECRET` | If guestbook enabled | GitHub OAuth secret |
| `POSTGRES_DATABASE` | Production only | PostgreSQL database name |
| `POSTGRES_HOST` | Production only | PostgreSQL host |
| `POSTGRES_PASSWORD` | Production only | PostgreSQL password |
| `POSTGRES_USER` | Production only | PostgreSQL username |
| `POSTGRES_PORT` | Production only | PostgreSQL port (default: 5432) |
| `BLOG_BASE_IMG_URL` | No | Base URL for blog images (defaults to BASE_URL/static/img/blog) |
| `PROJECT_BASE_IMG_URL` | No | Base URL for project images (defaults to BASE_URL/static/img/project) |

### Environment Variables Documentation

This project requires several environment variables for proper functionality. Create a `.env` file in your project root with the following configuration:

#### Core Application Settings

- **BASE_URL**: Your application's domain URL (e.g., <https://ridwaanhall.com>)
- **SECRET_KEY**: Django's secret key for cryptographic signing - generate using `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`
- **DEBUG**: Set to `True` for development, `False` for production
- **ALLOWED_HOSTS**: Comma-separated list of allowed hosts for development (only used when DEBUG=True)

#### API Integration Keys

- **ACCESS_TOKEN**: GitHub Personal Access Token
  - Go to GitHub Settings → Developer settings → Personal access tokens
  - Generate new token with repo and user permissions
- **WAKATIME_API_KEY**: WakaTime API key for coding statistics
  - Visit WakaTime Settings → API Key section
  - Copy your secret API key
- **WEB3FORM_PAC**: Web3Forms access key for contact forms (optional)
  - Visit Web3Forms dashboard
  - Get your access key for form submissions

#### Feature Configuration

- **GUESTBOOK_PAGE**: Boolean to enable/disable guestbook functionality
  - Set to `True` to enable guestbook with authentication
  - Set to `False` to disable and skip OAuth setup
- **WSRV_IMAGE_OPTIMIZATION**: Enable wsrv.nl image optimization proxy
  - Set to `True` for optimized images (recommended)
  - Set to `False` to use original images

#### OAuth Configuration (Required only when GUESTBOOK_PAGE=True)

- **GOOGLE_CLIENT_ID** & **GOOGLE_CLIENT_SECRET**: Google OAuth credentials
  - Create project at Google Cloud Console
  - Enable Google+ API
  - Create OAuth 2.0 credentials
- **GH_CLIENT_ID** & **GH_CLIENT_SECRET**: GitHub OAuth credentials
  - Go to GitHub Settings → Developer settings → OAuth Apps
  - Create new OAuth app with your callback URLs

#### Database Configuration (Production Only)

- **POSTGRES_DATABASE**: PostgreSQL database name
- **POSTGRES_HOST**: PostgreSQL host address
- **POSTGRES_PASSWORD**: PostgreSQL password
- **POSTGRES_USER**: PostgreSQL username
- **POSTGRES_PORT**: PostgreSQL port (default: 5432)

*Note: SQLite is used automatically in development mode (DEBUG=True)*

#### Image URL Configuration (Optional)

- **BLOG_BASE_IMG_URL**: Base URL for blog images
  - Defaults to `{BASE_URL}/static/img/blog` if not set
- **PROJECT_BASE_IMG_URL**: Base URL for project images
  - Defaults to `{BASE_URL}/static/img/project` if not set

## 📚 Documentation

Comprehensive documentation for each application component:

- **[About App Documentation](docs/about.md)** - Personal information management and display
- **[Blog System Documentation](docs/blog.md)** - Individual File System blog with content creation
- **[Core Application Documentation](docs/core.md)** - Base functionality, templates, and utilities
- **[Dashboard & Analytics Documentation](docs/dashboard.md)** - GitHub/WakaTime API integration and visualization
- **[Individual File System Documentation](docs/data.md)** - Revolutionary content management system
- **[Guestbook Documentation](docs/guestbook.md)** - OAuth authentication and interactive messaging
- **[Projects Showcase Documentation](docs/projects.md)** - Portfolio gallery with advanced features
- **[SEO Management Documentation](docs/seo.md)** - Search engine optimization and meta tag management

## 🚀 Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?demo-description=Advanced%20developer%20portfolio%20platform%20with%20individual%20file%20data%20management%2C%20real-time%20API%20integrations%2C%20and%20enterprise-grade%20security.&demo-image=https%3A%2F%2Fridwaanhall.com%2Fstatic%2Fimg%2Fproject%2Fridwaanhall_com_2025070701.webp&demo-title=FlexForge%20Portfolio&demo-url=https%3A%2F%2Fridwaanhall.com&from=templates&project-name=FlexForge%20Portfolio&repository-name=flexforge-portfolio&repository-url=https%3A%2F%2Fgithub.com%2Fridwaanhall%2Fridwaanhall-com)

### Manual Setup

1. Fork this repository
2. Install Vercel CLI: `npm i -g vercel`
3. Deploy: `vercel --prod`
4. Configure environment variables in Vercel dashboard

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push branch: `git push origin feature/name`
5. Open pull request

## 📄 License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

---

**FlexForge** - Professional portfolio platform built with Django and modern web technologies.
