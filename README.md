# ridwaanhall.com

A modern, high-performance personal portfolio website built with Django and TailwindCSS. This project showcases a complete developer portfolio with interactive features, real-time data integration, and comprehensive SEO optimization.

![ridwaanhall.com](https://ridwaanhall.com/static/img/project/ridwaanhall_com_20250607.webp)

[![wakatime](https://wakatime.com/badge/user/018b799e-de53-4f7a-bb65-edc2df9f26d8/project/cc5b6b55-ece5-47ae-b643-512d9d86e93b.svg)](https://wakatime.com/badge/user/018b799e-de53-4f7a-bb65-edc2df9f26d8/project/cc5b6b55-ece5-47ae-b643-512d9d86e93b)

## Overview

This is a comprehensive personal portfolio website featuring a modern design system, dynamic content management, and real-time developer metrics integration. Built with Django's robust backend architecture and TailwindCSS for responsive, utility-first styling, the site demonstrates advanced web development practices including serverless deployment, performance optimization, and comprehensive SEO implementation.

## Features

### 🏠 **Homepage**

- Dynamic personal introduction with animated skills carousel
- Featured projects showcase with interactive tech stack tooltips
- Latest blog posts slider with auto-advance functionality
- Real-time work status indicator based on timezone
- Professional education and experience timeline

### 📊 **Interactive Dashboard**

- **GitHub Integration**: Real-time contribution graphs, repository statistics, and commit activity
- **WakaTime Analytics**: Coding time tracking, language statistics, and productivity metrics
- **Animated Counters**: Dynamic data visualization with smooth count-up animations
- **Responsive Charts**: Mobile-optimized data visualization components

### 💼 **Projects Portfolio**

- **Detailed Project Pages**: Comprehensive project descriptions with technical specifications
- **Tech Stack Visualization**: Interactive technology badges with hover tooltips
- **Live Demo Links**: Direct access to deployed applications
- **Source Code Access**: GitHub repository integration
- **Advanced Filtering**: Search and categorize projects by technology
- **Pagination**: Optimized loading for large project collections

### 📝 **Blog System**

- **Article Management**: Full-featured blog with rich content support
- **Featured Posts**: Highlighted articles with carousel display
- **Social Sharing**: Integrated sharing for Twitter, LinkedIn, and Facebook
- **SEO Optimization**: Comprehensive meta tags and structured data
- **Responsive Images**: Optimized image loading with lazy loading

### 👤 **About Section**

- **Professional Profile**: Detailed background and expertise showcase
- **Interactive Timeline**: Education and experience visualization
- **Skills Matrix**: Comprehensive technology and soft skills display
- **Contact Integration**: Multiple communication channels
- **Certifications**: Professional achievement showcase

### 🔧 **Technical Architecture**

#### Backend Framework

- **Django 5.2.2**: Modern Python web framework with advanced features
- **Modular App Structure**: Organized into focused Django applications
  - `core`: Homepage and base functionality
  - `about`: Personal information and background
  - `projects`: Portfolio management
  - `blog`: Content management system
  - `dashboard`: Analytics and metrics
  - `data`: Content data management
  - `pageindex`: SEO and sitemap generation

#### Frontend Technologies

- **TailwindCSS**: Utility-first CSS framework for rapid UI development
- **Vanilla JavaScript**: Lightweight, performance-optimized interactions
- **Progressive Enhancement**: Graceful degradation for all browsers
- **Mobile-First Design**: Responsive layouts optimized for all devices

#### Security & Performance

- **Content Security Policy (CSP)**: Advanced XSS protection
- **HSTS Implementation**: Secure HTTPS enforcement
- **Security Headers**: Comprehensive protection against common vulnerabilities
- **WhiteNoise**: Efficient static file serving
- **Image Optimization**: WebP format with fallbacks
- **Lazy Loading**: Performance-optimized content loading

## Tech Stack

| Component | Technologies |
|-----------|-------------|
| **Backend** | ![Python](https://img.shields.io/badge/-Python_3.12-05122A?style=flat&logo=python) ![Django](https://img.shields.io/badge/-Django_5.2-05122A?style=flat&logo=django) |
| **Frontend** | ![TailwindCSS](https://img.shields.io/badge/-TailwindCSS-05122A?style=flat&logo=tailwindcss) ![JavaScript](https://img.shields.io/badge/-JavaScript-05122A?style=flat&logo=javascript) |
| **APIs** | ![GitHub API](https://img.shields.io/badge/-GitHub_API-05122A?style=flat&logo=github) ![WakaTime API](https://img.shields.io/badge/-WakaTime_API-05122A?style=flat&logo=wakatime) |
| **Security** | ![CSP](https://img.shields.io/badge/-Content_Security_Policy-05122A?style=flat&logo=security) ![HSTS](https://img.shields.io/badge/-HSTS-05122A?style=flat&logo=security) |
| **Deployment** | ![Vercel](https://img.shields.io/badge/-Vercel-05122A?style=flat&logo=vercel) ![Serverless](https://img.shields.io/badge/-Serverless-05122A?style=flat&logo=serverless) |
| **CDN & Analytics** | ![Cloudflare](https://img.shields.io/badge/-Cloudflare-05122A?style=flat&logo=cloudflare) ![GTM](https://img.shields.io/badge/-Google_Tag_Manager-05122A?style=flat&logo=googletagmanager) |
| **Fonts** | ![Onest](https://img.shields.io/badge/-Onest-05122A?style=flat&logo=googlefonts) ![Plus Jakarta Sans](https://img.shields.io/badge/-Plus_Jakarta_Sans-05122A?style=flat&logo=googlefonts) |

## Performance Metrics

The website achieves exceptional performance scores across all major metrics:

### Desktop Performance

[![Performance: 97](https://img.shields.io/badge/Performance-97-success)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=desktop)
[![Accessibility: 95](https://img.shields.io/badge/Accessibility-95-success)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=desktop)
[![Best Practices: 93](https://img.shields.io/badge/Best_Practices-93-success)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=desktop)
[![SEO: 100](https://img.shields.io/badge/SEO-100-success)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=desktop)

![PageSpeed Desktop](public/pagespeed_desktop.png)

### Mobile Performance

[![Performance: 91](https://img.shields.io/badge/Performance-91-success)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=mobile)
[![Accessibility: 95](https://img.shields.io/badge/Accessibility-95-success)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=mobile)
[![Best Practices: 93](https://img.shields.io/badge/Best_Practices-93-success)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=mobile)
[![SEO: 100](https://img.shields.io/badge/SEO-100-success)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=mobile)

![PageSpeed Mobile](public/pagespeed_mobile.png)

## Installation & Setup

### Prerequisites

- Python 3.12 or higher
- Git
- Virtual environment (recommended)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ridwaanhall/ridwaanhall-com.git
cd ridwaanhall-com

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the development server
python manage.py runserver
```

### Environment Configuration

Create a `.env` file in the project root:

```bash
# Core Settings
BASE_URL="https://your-domain.com"
SECRET_KEY="your-django-secret-key"
DEBUG=False

# API Keys
ACCESS_TOKEN="your-github-personal-access-token"
WAKATIME_API_KEY="your-wakatime-api-key"

# Image URLs (optional customization)
BLOG_BASE_IMG_URL="https://your-domain.com/static/img/blog"
PROJECT_BASE_IMG_URL="https://your-domain.com/static/img/project"
```

#### Environment Variables Guide

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `BASE_URL` | Production domain URL | Yes | `https://ridwaanhall.com` |
| `SECRET_KEY` | Django secret key | Yes | Generate with Django |
| `ACCESS_TOKEN` | GitHub Personal Access Token | Yes | [Generate here](https://github.com/settings/tokens) |
| `WAKATIME_API_KEY` | WakaTime API Secret Key | Yes | [Get from WakaTime](https://wakatime.com/settings/account) |
| `DEBUG` | Development mode | No | `False` (production) |

### Generate Django Secret Key

```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Project Structure

```txt
ridwaanhall-com/
├── apps/                          # Django applications
│   ├── about/                     # Personal information
│   ├── blog/                      # Blog system
│   ├── core/                      # Homepage & base functionality
│   ├── dashboard/                 # Analytics dashboard
│   ├── data/                      # Content management
│   ├── pageindex/                 # SEO & sitemaps
│   └── projects/                  # Portfolio management
├── ridwaanhall-com/               # Django project settings
│   ├── settings.py                # Configuration
│   ├── urls.py                    # URL routing
│   └── wsgi.py                    # WSGI application
├── static/                        # Development static files
├── staticfiles/                   # Production static files
├── templates/                     # HTML templates
│   ├── base.html                  # Base template
│   ├── sidebar.html               # Navigation
│   └── error.html                 # Error page
├── public/                        # Public assets
├── requirements.txt               # Python dependencies
├── manage.py                      # Django management
└── vercel.json                    # Deployment configuration
```

## Content Management

### Adding New Projects

Edit `apps/data/projects_data.py`:

```python
{
    "id": 45,
    "title": "Your Project Name",
    "headline": "Short project description",
    "description": [
        "Detailed project description paragraph 1",
        "Detailed project description paragraph 2"
    ],
    "github_url": "https://github.com/username/repo",
    "demo_url": "https://your-demo.com",
    "image_url": f"{settings.PROJECT_BASE_IMG_URL}/your-project.webp",
    "is_featured": True,
    "features": [
        {
            "title": "Feature Name",
            "description": "Feature description"
        }
    ],
    "tech_stack": [
        tech_stack["python"],
        tech_stack["django"]
    ],
    "updated_at": datetime.strptime("2025-06-07T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
}
```

### Adding Blog Posts

Edit `apps/data/blog_data.py`:

```python
{
    "id": 10,
    "title": "Your Blog Post Title",
    "description": "Brief post description",
    "content": [
        "Article paragraph 1",
        "Article paragraph 2",
        "<h2>Subheading</h2>",
        "More content..."
    ],
    "image_url": f"{settings.BLOG_BASE_IMG_URL}/your-post.webp",
    "author_image": "author-image-url",
    "tags": ["tag1", "tag2"],
    "is_featured": True,
    "created_at": datetime.strptime("2025-06-07T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-06-07T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z")
}
```

## Deployment

### Vercel Deployment (Recommended)

1. **Fork the Repository**

   ```bash
   # Fork this repository to your GitHub account
   ```

2. **Create Vercel Project**
   - Sign up at [Vercel](https://vercel.com)
   - Import your forked repository
   - Configure build settings (auto-detected)

3. **Environment Variables**
   Add the following environment variables in Vercel dashboard:

   ```txt
   BASE_URL=https://your-domain.vercel.app
   SECRET_KEY=your-django-secret-key
   ACCESS_TOKEN=your-github-token
   WAKATIME_API_KEY=your-wakatime-key
   ```

4. **Deploy**
   - Push changes to trigger automatic deployment
   - Custom domain configuration available in Vercel settings

### Alternative Deployment Options

- **Railway**: Python-friendly with PostgreSQL support
- **Heroku**: Classic PaaS with extensive add-on ecosystem
- **DigitalOcean App Platform**: Managed platform with automatic scaling
- **AWS Lambda**: Serverless deployment with Zappa

## SEO & Performance Features

### Search Engine Optimization

- **Structured Data**: JSON-LD markup for rich snippets
- **Open Graph Tags**: Optimized social media sharing
- **Twitter Cards**: Enhanced Twitter link previews
- **Canonical URLs**: Prevent duplicate content issues
- **XML Sitemaps**: Automated sitemap generation
- **Robots.txt**: Search engine crawling guidelines

### Performance Optimizations

- **Image Optimization**: WebP format with lazy loading
- **Static File Compression**: Gzip compression enabled
- **Browser Caching**: Optimized cache headers
- **Code Splitting**: Minimal JavaScript bundles
- **CSS Purging**: Unused CSS removal in production
- **Preloading**: Critical resource preloading

## API Integrations

### GitHub API Integration

- Repository statistics and information
- Contribution activity and graphs
- Latest commit information
- Repository language statistics
- Star and fork counts

### WakaTime API Integration

- Daily coding time tracking
- Programming language usage
- Project time allocation
- Weekly and monthly statistics
- Productivity metrics and insights

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork & Clone**

   ```bash
   git clone https://github.com/your-username/ridwaanhall-com.git
   cd ridwaanhall-com
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Development Setup**

   ```bash
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

4. **Make Changes**
   - Follow PEP 8 style guidelines
   - Add tests for new functionality
   - Update documentation as needed

5. **Commit & Push**

   ```bash
   git add .
   git commit -m "feat: descriptive commit message"
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Provide clear description of changes
   - Include screenshots for UI changes
   - Reference related issues if applicable

### Code Style Guidelines

- Follow Django best practices
- Use meaningful variable and function names
- Add docstrings for complex functions
- Maintain consistent indentation (4 spaces)
- Keep line length under 88 characters

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact & Support

| Platform | Link |
|----------|------|
| **Website** | [ridwaanhall.com](https://ridwaanhall.com) |
| **Email** | [hi@ridwaanhall.com](mailto:hi@ridwaanhall.com) |
| **GitHub** | [@ridwaanhall](https://github.com/ridwaanhall) |
| **LinkedIn** | [in/ridwaanhall](https://linkedin.com/in/ridwaanhall) |
| **Twitter** | [@ridwaanhall](https://twitter.com/ridwaanhall) |

---

### Acknowledgments

- Django community for the excellent framework
- TailwindCSS team for the utility-first CSS framework
- Vercel for seamless deployment platform
- GitHub and WakaTime for API access
- Cloudflare for CDN and security services

**Built with ❤️ by [Ridwan Halim](https://ridwaanhall.com)**
