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
