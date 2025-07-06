# 🚀 FlexForge - Advanced Developer Portfolio Platform

[![Django](https://img.shields.io/badge/Django-5.2.4-092E20?style=flat&logo=django&logoColor=white)](https://djangoproject.com/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

![FlexForge Portfolio](public/ridwaanhall_com.png)

> **A cutting-edge personal portfolio template showcasing advanced web development practices, featuring a revolutionary individual file data management system, real-time API integrations, and enterprise-grade performance optimization.**

## 🎯 Project Highlights

**💬 Configurable Interactive Guestbook** • **⚡ Individual File Architecture for Blog Articles and Projects** • **📊 Real-time Analytics**

This portfolio template represents the culmination of modern web development practices, featuring a **groundbreaking individual file system** that revolutionizes content management, coupled with real-time developer metrics, comprehensive performance optimization, and a **configurable interactive guestbook** with chat-like functionality that can be completely disabled when not needed.

### 🌟 Key Innovations

- **🗂️ Individual File System**: Revolutionary modular data architecture for project files and blog files
- **⚡ Performance Excellence**: 97+/100 PageSpeed scores on desktop and mobile
- **🔗 API Integration**: Real-time GitHub and WakaTime analytics dashboard
- **💬 Interactive Guestbook**: Real-time chat-like messaging system with replies and authentication
- **🛡️ Security-First**: Advanced CSP, HSTS, XSS protection, and comprehensive security headers implementation
- **🎨 Modern UI/UX**: Responsive design with interactive animations and micro-interactions

## ✨ Core Features

### 🏠 **Dynamic Homepage**

- **Animated Skills Carousel**: Dual-direction infinite scroll showcasing technical expertise
- **Featured Projects Grid**: Interactive showcase of flagship projects with tech stack tooltips
- **Real-time Status**: Timezone-based work availability indicator
- **Professional Timeline**: Education and experience visualization with interactive elements

### 📊 **Advanced Analytics Dashboard**

- **GitHub Integration**: Live contribution graphs, repository statistics, and commit activity tracking
- **WakaTime Analytics**: Comprehensive coding time tracking with language breakdowns and productivity insights
- **Animated Counters**: Smooth count-up animations for dynamic data visualization
- **Responsive Charts**: Mobile-optimized data visualization with interactive elements

### 💼 **Projects Showcase**

- **Individual File Architecture**: Each project stored in dedicated modular files (`project-1.py` to `project-N.py`)
- **Advanced Filtering**: Search and categorize by technology, status, and featured content
- **Interactive Tech Stack**: Hover tooltips for technology details and descriptions
- **Live Demos & Source Code**: Direct access to deployed applications and GitHub repositories
- **Smart Pagination**: Optimized loading for large project collections

### 📝 **Blog System**

- **Modular Content Management**: Individual file system for each blog post (`blog-1.py` to `blog-N.py`)
- **Featured Articles**: Curated content with advanced carousel functionality
- **Social Sharing**: Integrated sharing for Twitter, LinkedIn, and Facebook
- **SEO Optimization**: Comprehensive meta tags, structured data, and social media optimization

### 👤 **About Section**

- **Professional Profile**: Detailed background and expertise showcase
- **Interactive Timeline**: Education and experience visualization
- **Skills Matrix**: Comprehensive technology and soft skills display
- **Contact Integration**: Multiple communication channels
- **Certifications**: Professional achievement showcase

### 💬 **Interactive Guestbook** (Configurable)

> **Note**: This feature can be completely disabled by setting `GUESTBOOK_PAGE=False` in your environment variables.

- **Real-time Messaging**: Chat-like interface with instant message posting
- **Reply System**: Threaded conversations with contextual reply indicators
- **Multi-Provider Authentication**: Google OAuth and GitHub OAuth for secure user identification
- **Author & Co-Author System**:
  - **Main Author**: Site owner with full privileges (message deletion, user management)
  - **FIFO Management**: Automatic removal of oldest co-author when limit exceeded
- **Advanced User Management**: Django management commands for author/co-author administration
- **Profile Integration**: Dynamic profile images and names from OAuth providers
- **Security Hardened**: XSS protection, input validation, and CSRF protection
- **Modern UI**: Tailwind-based zinc-themed design with hover effects and responsive layout
- **Message Management**: Real-time message count updates and infinite scroll
- **Smart Badges**: Visual indicators for authors (purple) and co-authors (amber) with distinct icons

### 🏗️ **Revolutionary Individual File System**

#### Data Architecture Innovation

**The cornerstone of this project is its groundbreaking individual file system that completely revolutionizes content management:**

- **🗂️ Modular Design**: Each blog post and project exists as an individual Python file
- **📊 Scale**: Unlimited project files + Blog files + intelligent indexing system
- **⚡ Performance**: Lightning-fast loading with intelligent caching
- **🔄 Maintainability**: Easy content updates without touching large centralized files
- **🎯 Flexibility**: Switch between individual and centralized systems seamlessly

#### File Structure

```txt
apps/data/                 # 🗂️ INDIVIDUAL FILE SYSTEM (Revolutionary!)
├── __init__.py
├── about_manager.py       # About section data management
├── apps.py
├── content_manager.py     # 🎛️ Central Data Controller
├── data_service.py        # Data service layer
├── content/               # 📚 Individual Content Files
│   ├── __init__.py
│   ├── blog_index.py      # 🔍 Intelligent Blog File Loader
│   ├── projects_index.py  # 🔍 Smart Project File Loader
│   ├── blog/              # 📚 Individual Blog Files
│   │   ├── blog-1.py      # "Your First Blog Post"
│   │   ├── blog-2.py      # "Advanced Tutorial"
│   │   ├── ...            # Each blog as separate module
│   │   └── blog-N.py      # Latest blog articles
│   ├── projects/          # 💼 Individual Project Files
│   │   ├── project-1.py   # "Your First Project"
│   │   ├── project-2.py   # "Another Cool Project"
│   │   ├── ...            # Each project as separate module
│   │   └── project-N.py   # "Latest Project"
│   └── __pycache__/
├── about/                 # 📄 About section data files
└── privacy/               # 🔐 Privacy policy data
```

### 🔧 **Technical Architecture**

#### Backend Framework

- **Django 5.2.4**: Modern Python web framework with advanced features
- **Individual File System**: Revolutionary modular data architecture in `apps/data/content/`
- **Modular App Structure**: Organized into focused Django applications
  - `core`: Homepage and base functionality with DataService integration
  - `seo`: Advanced SEO management, sitemaps, structured data, and meta tag optimization

#### Frontend Technologies

- **TailwindCSS**: Utility-first CSS framework for rapid UI development
- **Vanilla JavaScript**: Lightweight, performance-optimized interactions
- **Progressive Enhancement**: Graceful degradation for all browsers
- **Mobile-First Design**: Responsive layouts optimized for all devices
- **Interactive Animations**: Micro-interactions and smooth transitions

#### Data Management Innovation

- **ContentManager Class**: Central controller with intelligent switching between data sources
- **Individual File Loading**: Dynamic loading of projects and blogs from separate files
- **Caching Strategy**: Intelligent caching for optimal performance
- **Modular Updates**: Easy content management without system-wide changes

#### Security & Performance

- **Content Security Policy (CSP)**: Advanced XSS protection with `django-csp`
- **Permissions Policy**: Browser feature control with `django-permissions-policy`
- **HSTS Implementation**: Secure HTTPS enforcement
- **Security Headers**: Comprehensive protection against common vulnerabilities
- **WhiteNoise**: Efficient static file serving for production
- **Image Optimization**: WebP format with fallbacks
- **Lazy Loading**: Performance-optimized content loading
- **Environment Configuration**: Secure settings management with `python-decouple`

## 🛠️ Tech Stack

| Component | Technologies | Purpose |
|-----------|-------------|---------|
| **Backend** | ![Python](https://img.shields.io/badge/-Python_3.12-05122A?style=flat&logo=python) ![Django](https://img.shields.io/badge/-Django_5.2.4-05122A?style=flat&logo=django) | Individual file system architecture |
| **Frontend** | ![TailwindCSS](https://img.shields.io/badge/-TailwindCSS-05122A?style=flat&logo=tailwindcss) ![JavaScript](https://img.shields.io/badge/-JavaScript-05122A?style=flat&logo=javascript) | Modern responsive UI/UX |
| **Data Management** | ![Individual Files](https://img.shields.io/badge/-Individual_Files-05122A?style=flat&logo=files) ![Python Modules](https://img.shields.io/badge/-Python_Modules-05122A?style=flat&logo=python) | Revolutionary modular architecture |
| **APIs** | ![GitHub API](https://img.shields.io/badge/-GitHub_API-05122A?style=flat&logo=github) ![WakaTime API](https://img.shields.io/badge/-WakaTime_API-05122A?style=flat&logo=wakatime) | Real-time developer analytics |
| **Security** | ![CSP](https://img.shields.io/badge/-django--csp_4.0-05122A?style=flat&logo=security) ![Permissions Policy](https://img.shields.io/badge/-django--permissions--policy_4.25-05122A?style=flat&logo=security) ![XSS Protection](https://img.shields.io/badge/-XSS_Protection-05122A?style=flat&logo=security) | Enterprise-grade protection with comprehensive vulnerability mitigation |
| **Configuration** | ![python-decouple](https://img.shields.io/badge/-python--decouple_3.8-05122A?style=flat&logo=python) ![WhiteNoise](https://img.shields.io/badge/-WhiteNoise_6.9-05122A?style=flat&logo=python) | Environment & static files |
| **Deployment** | ![Vercel](https://img.shields.io/badge/-Vercel-05122A?style=flat&logo=vercel) ![Serverless](https://img.shields.io/badge/-Serverless-05122A?style=flat&logo=serverless) | Global CDN deployment |
| **Performance** | ![Cloudflare](https://img.shields.io/badge/-Cloudflare-05122A?style=flat&logo=cloudflare) ![GTM](https://img.shields.io/badge/-Google_Tag_Manager-05122A?style=flat&logo=googletagmanager) | High-performance optimization |

### Backend

- **Django 5.2.4** - Modern Python web framework
- **Python 3.12** - Latest Python runtime
- **SQLite/PostgreSQL** - Database options for development and production
- **WhiteNoise** - Static file serving
- **Django Allauth** - Social authentication

### Frontend

- **Tailwind CSS** - Utility-first CSS framework
- **Vanilla JavaScript** - Modern ES6+ JavaScript
- **Responsive Design** - Mobile-first approach

### Security & Performance Features

- **Content Security Policy** - XSS protection
- **HTTPS Enforcement** - SSL/TLS security
- **Permissions Policy** - Browser security headers
- **Caching System** - Django cache framework
- **Rate Limiting** - API protection

### Deployment & DevOps

- **Vercel** - Serverless deployment platform
- **Environment Variables** - Secure configuration management
- **Static File Optimization** - CDN-ready assets

## 📊 Performance Excellence & Metrics

The website demonstrates exceptional performance across all critical metrics, achieving enterprise-grade speeds and optimization standards.

### 🖥️ Desktop Performance Analytics

[![Performance: 97](https://img.shields.io/badge/Performance-97-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=desktop)
[![Accessibility: 95](https://img.shields.io/badge/Accessibility-95-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=desktop)
[![Best Practices: 93](https://img.shields.io/badge/Best_Practices-93-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=desktop)
[![SEO: 100](https://img.shields.io/badge/SEO-100-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=desktop)

### 📱 Mobile Performance Analytics

[![Performance: 91](https://img.shields.io/badge/Performance-91-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=mobile)
[![Accessibility: 95](https://img.shields.io/badge/Accessibility-95-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=mobile)
[![Best Practices: 93](https://img.shields.io/badge/Best_Practices-93-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=mobile)
[![SEO: 100](https://img.shields.io/badge/SEO-100-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/bubxp8v27w?form_factor=mobile)

### Professional PageSpeed Reports

![PageSpeed Desktop Performance](public/pagespeed_desktop.png)

Desktop performance showcasing 97/100 score with sub-second loading times

![PageSpeed Mobile Performance](public/pagespeed_mobile.png)

Mobile performance achieving 91/100 with optimized responsive design

## 📁 Project Structure & Architecture

> **Note**: For detailed documentation about the Individual File System, see [`docs/INDIVIDUAL_FILES.md`](docs/INDIVIDUAL_FILES.md)

```txt
FlexForge/                         # 🏗️ Revolutionary Portfolio Architecture
├── apps/                          # 📦 Django Applications (Modular Design)
│   ├── about/                     # 👤 Personal Information Module
│   │   └── templates/
│   ├── blog/                      # 📝 Blog System with Template Management
│   │   └── templates/
│   ├── core/                      # 🏠 Homepage & Base Functionality
│   │   ├── base_views.py
│   │   └── data_service.py
│   ├── dashboard/                 # 📊 Real-time Analytics Dashboard
│   │   ├── github_api.py          # GitHub API Integration
│   │   ├── wakatime_api.py        # WakaTime API Integration
│   │   └── templates/
│   ├── data/                      # 🗂️ INDIVIDUAL FILE SYSTEM (Revolutionary!)
│   │   ├── __init__.py
│   │   ├── about_manager.py       # About section data management
│   │   ├── apps.py
│   │   ├── content_manager.py     # 🎛️ Central Data Controller
│   │   ├── data_service.py        # Data service layer
│   │   ├── content/               # 📚 Individual Content Files
│   │   │   ├── __init__.py
│   │   │   ├── blog_index.py      # 🔍 Intelligent Blog File Loader
│   │   │   ├── projects_index.py  # 🔍 Smart Project File Loader
│   │   │   ├── blog/              # 📚 Individual Blog Files
│   │   │   │   ├── blog-1.py      # "Your First Blog Post"
│   │   │   │   ├── ...            # Each blog as separate module
│   │   │   │   └── blog-N.py      # Latest blog articles
│   │   │   └── projects/          # 💼 Individual Project Files
│   │   │       ├── project-1.py   # "Your First Project"
│   │   │       ├── ...            # Each project as separate module
│   │   │       └── project-N.py   # "Latest Project"
│   │   ├── about/                 # 📄 About section data files
│   │   └── privacy/               # 🔐 Privacy policy data
│   ├── guestbook/                 # 💬 Interactive Guestbook System
│   │   ├── models.py              # ChatMessage and UserProfile models
│   │   ├── management/            # Custom management commands
│   │   ├── migrations/            # Database migrations
│   │   └── templates/             # Guestbook templates
│   │       └── guestbook/
│   │           └── guestbook.html # Security-hardened chat interface
│   ├── projects/                  # 💼 Portfolio Management System
│   │   └── templates/
│   └── seo/                       # 🚀 Advanced SEO Management & Sitemaps
│       ├── config.py              # SEO configuration settings
│       ├── data.py                # SEO data management
│       ├── manager.py             # SEO manager class
│       ├── mixins.py              # SEO mixins for views
│       ├── schema.py              # Structured data schemas
│       ├── sitemaps.py            # XML sitemap generation
│       ├── updated_at_data.py     # Last modified data tracking
│       ├── management/            # Django management commands
│       ├── templates/             # SEO templates
│       └── templatetags/          # Custom template tags
├── FlexForge/                     # ⚙️ Django Project Configuration
│   ├── asgi.py                    # ASGI configuration
│   ├── context_processors.py     # Makes certain settings available in all templates
│   ├── settings.py                # 🔧 Production-Ready Settings
│   ├── sitemaps.py                # Sitemap configuration
│   ├── urls.py                    # 🌐 URL Routing & Configuration
│   ├── views.py                   # Project-level views
│   └── wsgi.py                    # 🚀 WSGI Application Gateway
├── docs/                          # 🚀 Documentation
│   ├── GUESTBOOK_CONFIGURATION.md # Guestbook feature configuration guide
│   └── INDIVIDUAL_FILES.md        # Individual file system documentation
├── static/                        # 🎨 Development Static Assets
├── staticfiles/                   # 📦 Production Static Files
│   ├── css/                       # Custom CSS files
│   ├── favicon/                   # Favicon files
│   ├── font/                      # Web fonts
│   │   ├── Onest/
│   │   └── Plus_Jakarta_Sans/
│   ├── img/                       # Image assets
│   ├── js/                        # JavaScript files
│   └── tailwind/                  # TailwindCSS files
├── templates/                     # 🎭 HTML Template System
│   ├── base_seo.html              # 🏗️ SEO-optimized base template
│   ├── sidebar.html               # 🧭 Navigation Component
│   └── error.html                 # ❌ Error Handling Pages
├── public/                        # 🌍 Public Assets & Images
├── CODE_OF_CONDUCT.md             # 📋 Project conduct guidelines
├── CONTRIBUTING.md                # 🤝 Contribution guidelines
├── db.sqlite3                     # 🗄️ SQLite database
├── LICENSE                        # 📜 Apache-2.0 license
├── manage.py                      # 🛠️ Django Management Interface
├── README.md                      # 📖 Project documentation
├── requirements.txt               # 📋 Python Dependencies
├── SECURITY.md                    # 🔒 Security policy and guidelines
└── vercel.json                    # 🚀 Vercel Deployment Configuration
```

### 🏆 **Individual File System Innovation**

The `apps/data/content/` directory showcases the **revolutionary individual file architecture**:

- **🗂️ Project Files**: Each project exists as a self-contained Python module in `apps/data/content/projects/`
- **📚 Blog Files**: Individual blog posts with complete content isolation in `apps/data/content/blog/`
- **🎛️ Smart Loading**: Intelligent file discovery and loading mechanisms via `blog_index.py` and `projects_index.py`
- **⚡ Performance**: Optimized loading with caching and lazy evaluation through `content_manager.py`
- **🔧 Maintainability**: Easy content management without touching large files, managed by `data_service.py`

## Installation & Setup

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ridwaanhall/ridwaanhall-com.git
cd ridwaanhall-com

# Create and activate virtual environment
python -m venv venv

# Windows PowerShell
venv\Scripts\Activate.ps1

# Windows Command Prompt (alternative)
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
DEBUG=True

# Feature Toggles
GUESTBOOK_PAGE=True

# API Keys
ACCESS_TOKEN="your-github-personal-access-token"
WAKATIME_API_KEY="your-wakatime-api-key"
WEB3FORM_PAC="your-web3forms-key"

# Google OAuth (Required for Guestbook Authentication when GUESTBOOK_PAGE=True)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth (Required for Guestbook Authentication when GUESTBOOK_PAGE=True)
GH_CLIENT_ID="your-github-client-id"
GH_CLIENT_SECRET="your-github-client-secret"

# PostgreSQL Database (Production)
POSTGRES_DATABASE="your-database"
POSTGRES_HOST="your-host"
POSTGRES_PASSWORD="your-password"
POSTGRES_USER="your-user"
POSTGRES_PORT="5432"

# Image URLs (optional customization)
BLOG_BASE_IMG_URL="https://your-domain.com/static/img/blog"
PROJECT_BASE_IMG_URL="https://your-domain.com/static/img/project"

# Host Configuration (Development only)
ALLOWED_HOSTS="localhost,127.0.0.1"
```

#### Environment Variables Guide

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `BASE_URL` | Production domain URL | Yes | `https://yourdomain.com` |
| `SECRET_KEY` | Django secret key | Yes | Generate with Django |
| `DEBUG` | Development mode | No | `True` (development), `False` (production) |
| `GUESTBOOK_PAGE` | Enable/disable guestbook feature | No | `True` (default), `False` |
| `ACCESS_TOKEN` | GitHub Personal Access Token | Yes | [Generate here](https://github.com/settings/tokens) |
| `WAKATIME_API_KEY` | WakaTime API Secret Key | Yes | [Get from WakaTime](https://wakatime.com/settings/account) |
| `WEB3FORM_PAC` | Web3Forms API key for contact form | No | [Get from Web3Forms](https://web3forms.com/) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | When guestbook enabled | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | When guestbook enabled | [Google Cloud Console](https://console.cloud.google.com/) |
| `GH_CLIENT_ID` | GitHub OAuth Client ID | When guestbook enabled | [GitHub Developer Settings](https://github.com/settings/developers) |
| `GH_CLIENT_SECRET` | GitHub OAuth Client Secret | When guestbook enabled | [GitHub Developer Settings](https://github.com/settings/developers) |
| `POSTGRES_DATABASE` | PostgreSQL database name | Production | `your_portfolio_db` |
| `POSTGRES_HOST` | PostgreSQL host address | Production | `localhost` or cloud host |
| `POSTGRES_USER` | PostgreSQL username | Production | `your_db_user` |
| `POSTGRES_PASSWORD` | PostgreSQL password | Production | Strong password |
| `POSTGRES_PORT` | PostgreSQL port | Production | `5432` (default) |
| `BLOG_BASE_IMG_URL` | Base URL for blog images | No | Auto-generated from BASE_URL |
| `PROJECT_BASE_IMG_URL` | Base URL for project images | No | Auto-generated from BASE_URL |
| `ALLOWED_HOSTS` | Allowed hosts for development | Development only | `localhost,127.0.0.1` |

### Feature Configuration

This portfolio includes configurable features that can be enabled or disabled based on your needs:

#### 🔧 Guestbook Configuration

The interactive guestbook feature can be completely disabled if you don't need chat functionality:

##### Enable Guestbook (Default)

```env
GUESTBOOK_PAGE=True
```

##### Disable Guestbook

```env
GUESTBOOK_PAGE=False
```

#### What happens when `GUESTBOOK_PAGE=False`

**✅ Disabled Components:**

- Interactive guestbook page and functionality
- All authentication systems (Google OAuth, GitHub OAuth)
- Social account providers and middleware
- Authentication-related URLs and redirects
- Guestbook navigation in sidebar and search

**✅ Optional Environment Variables:**

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` become optional
- `GH_CLIENT_ID` and `GH_CLIENT_SECRET` become optional
- `WEB3FORM_PAC` becomes optional (contact form functionality)

**✅ Performance Benefits:**

- Reduced app bundle size (no allauth dependencies)
- Faster startup time (fewer middleware and apps)
- Simplified URL routing
- Lower memory footprint

**✅ Use Cases:**

- Portfolio-only websites without community features
- Corporate profiles that don't require user interaction
- Simple showcase sites focusing on projects and blog content
- Environments where OAuth setup is not feasible

> **Note**: Existing guestbook data remains in the database when disabled and will be restored when re-enabled. No data loss occurs during feature toggling.

For detailed configuration information, see: [`docs/GUESTBOOK_CONFIGURATION.md`](docs/GUESTBOOK_CONFIGURATION.md)

### Generate Django Secret Key

```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Google OAuth Setup (Required when GUESTBOOK_PAGE=True)

The guestbook feature requires Google OAuth for user authentication. Follow these steps:

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Google+ API

2. **Configure OAuth Consent Screen**
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Add your domain to authorized domains

3. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"

4. **Add Credentials to Environment**
   - Copy Client ID to `GOOGLE_CLIENT_ID`
   - Copy Client Secret to `GOOGLE_CLIENT_SECRET`

### GitHub OAuth Setup (Required when GUESTBOOK_PAGE=True)

GitHub OAuth provides a second authentication option alongside Google for the guestbook system:

1. **Create GitHub OAuth App**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)

2. **Configure Authorization Callback URL**
   - Development: `http://localhost:8000/accounts/github/login/callback/`
   - Production: `https://your-domain.com/accounts/github/login/callback/`

3. **Add Credentials to Environment**
   - Copy Client ID to `GH_CLIENT_ID`
   - Copy Client Secret to `GH_CLIENT_SECRET`

**Note**: Both Google and GitHub OAuth are required for full guestbook functionality when `GUESTBOOK_PAGE=True`, allowing users to choose their preferred authentication method. These can be skipped entirely when the guestbook is disabled.

### PostgreSQL Setup (Production Database)

For production deployment, configure PostgreSQL:

1. **Create Database**

2. **Add Database Settings**
   - Set all `POSTGRES_*` environment variables
   - Ensure database is accessible from your application server

## Content Management

### Interactive Guestbook System

The guestbook features a modern, chat-like interface with comprehensive security, user management, and an advanced author/co-author system:

#### 🔐 Security Features

- **XSS Protection**: All user input properly escaped and sanitized
- **CSRF Protection**: Django CSRF tokens for all form submissions
- **Input Validation**: Message length limits and content validation
- **Multi-Provider Authentication**: Google OAuth and GitHub OAuth integration
- **Authorization Controls**: Granular permissions for authors and co-authors
- **Safe HTML Rendering**: User content rendered as text to prevent code injection

#### 👥 Author & Co-Author Management

- **Single Main Author**: One site owner with full administrative privileges
- **Up to 2 Co-Authors**: Special recognition with distinct amber badges
- **FIFO System**: Automatic oldest co-author removal when adding a third
- **Management Commands**: CLI tools for user role administration
- **Dynamic Badges**: Visual indicators (purple for author, amber for co-authors)
- **Profile Integration**: Automatic profile images and names from OAuth providers

#### 💬 Chat Features

- **Real-time Messaging**: AJAX-powered instant message posting
- **Reply System**: Thread-like conversations with contextual reply indicators
- **Multi-Provider Profiles**: Google and GitHub profile integration with avatars
- **Smart User Recognition**: "You replied to", "Replied to you" context awareness
- **Message Management**: Live message count updates and smooth animations
- **Responsive Design**: Mobile-optimized chat interface with zinc color theme

#### 🎨 UI/UX Features

- **Modern Zinc Theme**: Dark design with zinc color palette and smooth transitions
- **Always Visible Actions**: Reply and delete buttons always shown with hover effects
- **Interactive Elements**: Button hover backgrounds, loading states, and micro-animations

### Project Data Management

Projects are stored as individual Python files in `apps/data/content/projects/` for easy management and version control. Each project file contains:

- Project metadata (title, description, tags, status)
- Technology stack information
- Repository and demo links
- Featured status and display order

### Blog Content Management

Blog posts are similarly organized in `apps/data/content/blog/` with structured metadata including:

- Article content and metadata
- Publication dates and author information
- Social sharing optimization
- SEO-friendly URLs and descriptions

### About Information Management

Professional information is centrally managed in `apps/data/about/` including:

- Experience history and career timeline
- Education background and certifications
- Skills matrix and technology proficiency
- Contact information and social links
- Professional achievements and awards

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**

   ```bash
   vercel --prod
   ```

3. **Environment Variables**
   Configure production environment variables in Vercel dashboard with all required values from the Environment Variables Guide above.

### Alternative Deployment Options

#### Heroku Deployment

1. **Install Heroku CLI**
2. **Create Heroku App**
3. **Configure Environment Variables**
4. **Deploy via Git**

#### VPS/Cloud Server Deployment

1. **Server Setup**: Ubuntu/CentOS with Python 3.12+
2. **Web Server**: Nginx + Gunicorn configuration
3. **Database**: PostgreSQL for production
4. **SSL Certificate**: Let's Encrypt or CloudFlare
5. **Process Management**: Supervisor or systemd

### Environment-Specific Settings

The application automatically adjusts security settings based on the `DEBUG` environment variable:

- **Development**: Relaxed security for easier debugging
- **Production**: Full security headers and HTTPS enforcement

### Database Migration

For production deployment:

```bash
# Run database migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

## 📊 Dashboard Integration

### GitHub Integration

- **Real-time Contribution Calendar**: Live contribution graphs with daily activity
- **Repository Statistics**: Public repos, stars, forks, and language breakdown
- **Commit Activity Tracking**: Recent commits and contribution patterns
- **Language Usage Analytics**: Most used programming languages with percentages

### WakaTime Integration

- **Coding Time Tracking**: Daily and weekly coding hours with trend analysis
- **Language Breakdown**: Time spent per programming language
- **Project Time Allocation**: Time distribution across different projects
- **Productivity Statistics**: Daily averages, longest coding sessions, and streaks

## 🔒 Security Features

### Headers & Security Policies

- **Content Security Policy (CSP)**: Advanced XSS protection with strict directives
- **Permissions Policy**: Browser feature control to enhance security
- **HTTP Strict Transport Security (HSTS)**: Enforces secure HTTPS connections
- **X-Content-Type-Options**: Prevents MIME-type sniffing attacks
- **X-Frame-Options**: Clickjacking protection
- **Secure Cookies**: Session and CSRF protection with secure flags

### Authentication & Authorization

- **OAuth 2.0 Integration**: Secure authentication with Google and GitHub
- **Session Management**: Secure session handling with Django's built-in security
- **CSRF Protection**: Cross-Site Request Forgery protection on all forms
- **Rate Limiting**: API endpoint protection against abuse
- **Input Validation**: Comprehensive validation for all user inputs
- **SQL Injection Protection**: Django ORM prevents SQL injection attacks

## 📈 Performance Optimization

### Caching Strategy

- **3-hour Cache**: API data caching for GitHub and WakaTime requests
- **Static File Optimization**: Efficient serving with WhiteNoise
- **Database Optimization**: Efficient queries with select_related/prefetch_related
- **Lazy Loading**: Performance-optimized content loading for images and components

### Image Optimization

- **WebP Format**: Modern image format with better compression
- **Responsive Sizing**: Multiple image sizes for different screen resolutions
- **CDN Integration**: Global content delivery for faster access
- **Compression**: Automatic image compression without quality loss

### Code Optimization

- **Minified Assets**: Compressed CSS and JavaScript files
- **Database Indexing**: Optimized database queries with proper indexing
- **Async Loading**: Non-blocking loading for external resources
- **Efficient Algorithms**: Optimized data processing and rendering

## 🤝 Contributing

We welcome contributions to FlexForge! Here's how you can help:

### Getting Started

1. **Fork the Repository**

   ```bash
   git fork https://github.com/ridwaanhall/ridwaanhall-com.git
   ```

2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Your Changes**
   - Follow the existing code style and conventions
   - Add tests for new functionality
   - Update documentation as needed

4. **Commit Your Changes**

   ```bash
   git commit -m 'Add some amazing feature'
   ```

5. **Push to Your Branch**

   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Include screenshots for UI changes

### Contribution Guidelines

- **Code Style**: Follow PEP 8 for Python code
- **Documentation**: Update README and code comments
- **Testing**: Ensure all tests pass and add new tests
- **Security**: Follow security best practices
- **Performance**: Consider performance impact of changes

### Areas for Contribution

- **New Features**: Additional dashboard integrations, new page templates
- **Bug Fixes**: Report and fix issues you encounter
- **Documentation**: Improve setup guides and API documentation
- **Performance**: Optimize loading times and resource usage
- **Security**: Enhance security measures and best practices
- **UI/UX**: Improve design and user experience

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

### License Summary

- ✅ **Commercial Use**: You can use this project for commercial purposes
- ✅ **Modification**: You can modify the source code
- ✅ **Distribution**: You can distribute the original or modified code
- ✅ **Private Use**: You can use this project privately
- ❗ **License and Copyright Notice**: Include the original license and copyright notice
- ❗ **State Changes**: Document any changes made to the original code

## 👨‍💻 Template Usage

This is a template project designed to help developers create their own portfolio websites. To use this template:

### Customization Steps

1. **Personal Information**: Update personal details in `apps/data/about/`
2. **Projects**: Add your projects in `apps/data/content/projects/`
3. **Blog Posts**: Create your blog content in `apps/data/content/blog/`
4. **Styling**: Customize colors and design in Tailwind CSS files
5. **API Integration**: Set up your GitHub and WakaTime API keys
6. **Domain Configuration**: Update environment variables for your domain

### Support Resources

- **Documentation**: Comprehensive guides in the `docs/` directory
- **Examples**: Sample project and blog files included
- **Community**: Join discussions in GitHub Issues
- **Updates**: Follow the repository for latest improvements

## 📞 Support & Community

### Getting Help

- **GitHub Issues**: [Create an issue](https://github.com/ridwaanhall/ridwaanhall-com/issues) for bugs or feature requests
- **Discussions**: Join [GitHub Discussions](https://github.com/ridwaanhall/ridwaanhall-com/discussions) for questions and ideas
- **Documentation**: Check the comprehensive guides in the `docs/` folder

### Community Guidelines

- Be respectful and inclusive in all interactions
- Provide clear and detailed information when reporting issues
- Search existing issues before creating new ones
- Help others when you can share knowledge

---

## Built with ❤️ using Django and Modern Web Technologies

**FlexForge** - Empowering developers to showcase their skills with a professional, feature-rich portfolio platform.
