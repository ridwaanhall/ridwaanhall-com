# 🚀 ridwaanhall-com

[![Django](https://img.shields.io/badge/Django-5.2.2-092E20?style=flat&logo=django&logoColor=white)](https://djangoproject.com/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![wakatime](https://wakatime.com/badge/user/018b799e-de53-4f7a-bb65-edc2df9f26d8/project/cc5b6b55-ece5-47ae-b643-512d9d86e93b.svg)](https://wakatime.com/badge/user/018b799e-de53-4f7a-bb65-edc2df9f26d8/project/cc5b6b55-ece5-47ae-b643-512d9d86e93b)

![ridwaanhall.com](https://ridwaanhall.com/static/img/project/ridwaanhall_com_20250607.webp)

> **A cutting-edge personal portfolio showcasing advanced web development practices, featuring a revolutionary individual file data management system, real-time API integrations, and enterprise-grade performance optimization.**

## 🎯 Project Highlights

**🏆 47 Technical Projects** • **📝 14 Blog Articles** • **💬 Configurable Interactive Guestbook** • **⚡ Individual File Architecture** • **📊 Real-time Analytics**

This portfolio represents the culmination of modern web development practices, featuring a **groundbreaking individual file system** that revolutionizes content management, coupled with real-time developer metrics, comprehensive performance optimization, and a **configurable interactive guestbook** with chat-like functionality that can be completely disabled when not needed.

### 🌟 Key Innovations

- **🗂️ Individual File System**: Revolutionary modular data architecture with 47 project files and 14 blog files
- **⚡ Performance Excellence**: 100/100 PageSpeed scores on desktop and mobile
- **🔗 API Integration**: Real-time GitHub and WakaTime analytics dashboard
- **� Interactive Guestbook**: Real-time chat-like messaging system with replies and authentication
- **�🛡️ Security-First**: Advanced CSP, HSTS, XSS protection, and comprehensive security headers implementation
- **🎨 Modern UI/UX**: Responsive design with interactive animations and micro-interactions

## ✨ Core Features

### 🏠 **Dynamic Homepage**

- **Animated Skills Carousel**: Dual-direction infinite scroll showcasing technical expertise
- **Featured Projects Grid**: Interactive showcase of 6 flagship projects with tech stack tooltips
- **Real-time Status**: Timezone-based work availability indicator
- **Professional Timeline**: Education and experience visualization with interactive elements

### 📊 **Advanced Analytics Dashboard**

- **GitHub Integration**: Live contribution graphs, repository statistics, and commit activity tracking
- **WakaTime Analytics**: Comprehensive coding time tracking with language breakdowns and productivity insights
- **Animated Counters**: Smooth count-up animations for dynamic data visualization
- **Responsive Charts**: Mobile-optimized data visualization with interactive elements

### 💼 **Projects Showcase (47 Projects)**

- **Individual File Architecture**: Each project stored in dedicated modular files (`project-1.py` to `project-47.py`)
- **Advanced Filtering**: Search and categorize by technology, status, and featured content
- **Interactive Tech Stack**: Hover tooltips for technology details and descriptions
- **Live Demos & Source Code**: Direct access to deployed applications and GitHub repositories
- **Smart Pagination**: Optimized loading for large project collections

### 📝 **Blog System (14 Articles)**

- **Modular Content Management**: Individual file system for each blog post (`blog-1.py` to `blog-14.py`)
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
  - **Co-Authors**: Up to 2 co-authors with special badges and recognition
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
- **📊 Scale**: 47 project files + 14 blog files + intelligent indexing system
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
│   ├── blog/              # 📚 14 Individual Blog Files
│   │   ├── blog-1.py      # "Python 101: Your Chill Guide"
│   │   ├── blog-2.py      # "Whipping Up Web Apps with Django's Magic"
│   │   ├── ...            # Each blog as separate module
│   │   └── blog-14.py     # Latest blog articles
│   ├── projects/          # 💼 47 Individual Project Files
│   │   ├── project-1.py   # "MLBB Username Finder"
│   │   ├── project-2.py   # "TikTok Profile Scraper"
│   │   ├── ...            # Each project as separate module
│   │   └── project-47.py  # "Neural Network from Scratch"
│   └── __pycache__/
├── about/                 # 📄 About section data files
└── privacy/               # 🔐 Privacy policy data
```

#### Featured Projects Showcase

| Project | Description | Tech Stack | Status |
|---------|-------------|------------|--------|
| **🚴 Bike Rental Insights Dashboard** | ML-powered analytics with Streamlit UI | Python, Streamlit, TensorFlow | ✅ Live |
| **⚔️ MLBB API Stats Hub** | Real-time Mobile Legends statistics | Python, Flask, APIs | ✅ Live |
| **🎓 PDDikti Data Vault** | Indonesian higher education data hub | Python, Django, JavaScript | ✅ Live |
| **🍯 BeliMadu.com** | E-commerce platform for honey products | Django, Bootstrap, Vercel | ✅ Live |
| **🌐 ridwaanhall.com** | This very portfolio you're reading! | Django, TailwindCSS, Individual Files | ✅ Live |
| **🧠 Neural Network from Scratch** | Pure NumPy implementation, 98.06% accuracy | Python, NumPy, Matplotlib | ✅ Complete |

### 🔧 **Technical Architecture**

#### Backend Framework

- **Django 5.2.2**: Modern Python web framework with advanced features
- **Individual File System**: Revolutionary modular data architecture in `apps/data/content/`
- **Modular App Structure**: Organized into focused Django applications
  - `core`: Homepage and base functionality with DataService integration
  - `about`: Personal information and background management  - `projects`: Portfolio management with individual file loading system
  - `blog`: Content management system with modular posts
  - `dashboard`: Analytics and metrics with real-time GitHub and WakaTime API integration
  - `guestbook`: Interactive messaging system with real-time chat, author/co-author management, and multi-provider OAuth
  - `data`: Revolutionary individual file data management system with content controller
  - `seo`: Advanced SEO management, sitemaps, structured data, and meta tag optimization

#### Frontend Technologies

- **TailwindCSS**: Utility-first CSS framework for rapid UI development
- **Vanilla JavaScript**: Lightweight, performance-optimized interactions
- **Progressive Enhancement**: Graceful degradation for all browsers
- **Mobile-First Design**: Responsive layouts optimized for all devices
- **Interactive Animations**: Micro-interactions and smooth transitions

#### Data Management Innovation

- **ContentManager Class**: Central controller with intelligent switching between data sources
- **Individual File Loading**: Dynamic loading of 47 projects and 14 blogs from separate files
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
| **Backend** | ![Python](https://img.shields.io/badge/-Python_3.12-05122A?style=flat&logo=python) ![Django](https://img.shields.io/badge/-Django_5.2.2-05122A?style=flat&logo=django) | Individual file system architecture |
| **Frontend** | ![TailwindCSS](https://img.shields.io/badge/-TailwindCSS-05122A?style=flat&logo=tailwindcss) ![JavaScript](https://img.shields.io/badge/-JavaScript-05122A?style=flat&logo=javascript) | Modern responsive UI/UX |
| **Data Management** | ![Individual Files](https://img.shields.io/badge/-Individual_Files-05122A?style=flat&logo=files) ![Python Modules](https://img.shields.io/badge/-Python_Modules-05122A?style=flat&logo=python) | Revolutionary modular architecture |
| **APIs** | ![GitHub API](https://img.shields.io/badge/-GitHub_API-05122A?style=flat&logo=github) ![WakaTime API](https://img.shields.io/badge/-WakaTime_API-05122A?style=flat&logo=wakatime) | Real-time developer analytics |
| **Security** | ![CSP](https://img.shields.io/badge/-django--csp_4.0-05122A?style=flat&logo=security) ![Permissions Policy](https://img.shields.io/badge/-django--permissions--policy_4.25-05122A?style=flat&logo=security) ![XSS Protection](https://img.shields.io/badge/-XSS_Protection-05122A?style=flat&logo=security) | Enterprise-grade protection with comprehensive vulnerability mitigation |
| **Configuration** | ![python-decouple](https://img.shields.io/badge/-python--decouple_3.8-05122A?style=flat&logo=python) ![WhiteNoise](https://img.shields.io/badge/-WhiteNoise_6.9-05122A?style=flat&logo=python) | Environment & static files |
| **Deployment** | ![Vercel](https://img.shields.io/badge/-Vercel-05122A?style=flat&logo=vercel) ![Serverless](https://img.shields.io/badge/-Serverless-05122A?style=flat&logo=serverless) | Global CDN deployment |
| **Performance** | ![Cloudflare](https://img.shields.io/badge/-Cloudflare-05122A?style=flat&logo=cloudflare) ![GTM](https://img.shields.io/badge/-Google_Tag_Manager-05122A?style=flat&logo=googletagmanager) | 100/100 PageSpeed scores |

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
DEBUG=False

# Feature Toggles
GUESTBOOK_PAGE=True

# API Keys
ACCESS_TOKEN="your-github-personal-access-token"
WAKATIME_API_KEY="your-wakatime-api-key"

# Google OAuth (Required for Guestbook Authentication when GUESTBOOK_PAGE=True)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth (Required for Guestbook Authentication when GUESTBOOK_PAGE=True)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# PostgreSQL Database (Production)
POSTGRES_DATABASE="your-database"
POSTGRES_HOST="your-host"
POSTGRES_PASSWORD="your-password"
POSTGRES_USER="your-user"

# Image URLs (optional customization)
BLOG_BASE_IMG_URL="https://your-domain.com/static/img/blog"
PROJECT_BASE_IMG_URL="https://your-domain.com/static/img/project"
```

#### Environment Variables Guide

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `BASE_URL` | Production domain URL | Yes | `https://ridwaanhall.com` |
| `SECRET_KEY` | Django secret key | Yes | Generate with Django |
| `GUESTBOOK_PAGE` | Enable/disable guestbook feature | No | `True` (default), `False` |
| `ACCESS_TOKEN` | GitHub Personal Access Token | Yes | [Generate here](https://github.com/settings/tokens) |
| `WAKATIME_API_KEY` | WakaTime API Secret Key | Yes | [Get from WakaTime](https://wakatime.com/settings/account) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | When guestbook enabled | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | When guestbook enabled | [Google Cloud Console](https://console.cloud.google.com/) |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | When guestbook enabled | [GitHub Developer Settings](https://github.com/settings/developers) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | When guestbook enabled | [GitHub Developer Settings](https://github.com/settings/developers) |
| `POSTGRES_DATABASE` | PostgreSQL database name | Production | `your_portfolio_db` |
| `POSTGRES_HOST` | PostgreSQL host address | Production | `localhost` or cloud host |
| `POSTGRES_USER` | PostgreSQL username | Production | `your_db_user` |
| `POSTGRES_PASSWORD` | PostgreSQL password | Production | Strong password |
| `DEBUG` | Development mode | No | `False` (production) |

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
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` become optional

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
   - Create a new project or select existing one
   - Enable the Google+ API

2. **Configure OAuth Consent Screen**
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in required application information
   - Add your domain to authorized domains

3. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:8000/accounts/google/login/callback/` (development)
     - `https://your-domain.com/accounts/google/login/callback/` (production)

4. **Add Credentials to Environment**
   - Copy Client ID to `GOOGLE_CLIENT_ID`
   - Copy Client Secret to `GOOGLE_CLIENT_SECRET`

### GitHub OAuth Setup (Required when GUESTBOOK_PAGE=True)

GitHub OAuth provides a second authentication option alongside Google for the guestbook system:

1. **Create GitHub OAuth App**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "New OAuth App"
   - Fill in application details:
     - Application name: "Your Portfolio Guestbook"
     - Homepage URL: `https://your-domain.com`
     - Application description: "Portfolio guestbook authentication"

2. **Configure Authorization Callback URL**
   - Development: `http://localhost:8000/accounts/github/login/callback/`
   - Production: `https://your-domain.com/accounts/github/login/callback/`

3. **Add Credentials to Environment**
   - Copy Client ID to `GITHUB_CLIENT_ID`
   - Copy Client Secret to `GITHUB_CLIENT_SECRET`

**Note**: Both Google and GitHub OAuth are required for full guestbook functionality when `GUESTBOOK_PAGE=True`, allowing users to choose their preferred authentication method. These can be skipped entirely when the guestbook is disabled.

### PostgreSQL Setup (Production Database)

For production deployment, configure PostgreSQL:

1. **Create Database**

   ```sql
   CREATE DATABASE your_portfolio_db;
   CREATE USER your_db_user WITH PASSWORD 'strong_password';
   GRANT ALL PRIVILEGES ON DATABASE your_portfolio_db TO your_db_user;
   ```

2. **Add Database Settings**
   - Set all `POSTGRES_*` environment variables
   - Ensure database is accessible from your application server

## 📁 Project Structure & Architecture

> **Note**: For detailed documentation about the Individual File System, see [`INDIVIDUAL_FILES_DOCS.md`](docs/GUESTBOOK_CONFIGURATION.md)

```txt
ridwaanhall-com/                   # 🏗️ Revolutionary Portfolio Architecture
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
│   │   │   ├── blog/              # 📚 14 Individual Blog Files
│   │   │   │   ├── blog-1.py      # "Python 101: Your Chill Guide"
│   │   │   │   ├── ...            # Each blog as separate module
│   │   │   │   └── blog-14.py     # Latest blog articles
│   │   │   └── projects/          # 💼 47 Individual Project Files
│   │   │       ├── project-1.py   # "MLBB Username Finder"
│   │   │       ├── ...            # Each project as separate module
│   │   │       └── project-47.py  # "Neural Network from Scratch"
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
│   ├── content_processors.py      # Makes certain settings available in all templates
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
│   ├── pagespeed_desktop.png      # Performance reports
│   ├── pagespeed_mobile.png
│   └── ridwaanhall_com.png
├── CODE_OF_CONDUCT.md             # 📋 Project conduct guidelines
├── CONTRIBUTING.md                # 🤝 Contribution guidelines
├── db.sqlite3                     # 🗄️ SQLite database
├── INDIVIDUAL_FILES_DOCS.md       # 📖 Individual files system documentation
├── LICENSE                        # 📜 Apache-2.0 license
├── manage.py                      # 🛠️ Django Management Interface
├── README.md                      # 📖 Project documentation (this file)
├── requirements.txt               # 📋 Python Dependencies
├── SECURITY.md                    # 🔒 Security policy and guidelines
└── vercel.json                    # 🚀 Vercel Deployment Configuration
```

### 🏆 **Individual File System Innovation**

The `apps/data/content/` directory showcases the **revolutionary individual file architecture**:

- **🗂️ 47 Project Files**: Each project exists as a self-contained Python module in `apps/data/content/projects/`
- **📚 14 Blog Files**: Individual blog posts with complete content isolation in `apps/data/content/blog/`
- **🎛️ Smart Loading**: Intelligent file discovery and loading mechanisms via `blog_index.py` and `projects_index.py`
- **⚡ Performance**: Optimized loading with caching and lazy evaluation through `content_manager.py`
- **🔧 Maintainability**: Easy content management without touching large files, managed by `data_service.py`

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
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Infinite Scroll**: Smooth scrolling message container with proper boundaries
- **Status Indicators**: Clear visual feedback for all user actions

### Adding New Projects

Create a new individual project file `apps/data/content/projects/project-48.py`:

```python
"""
Project #48: Your Project Name
Individual file architecture implementation
"""

from datetime import datetime
from django.conf import settings

project_data = {
    "id": 48,
    "title": "Your Project Name",
    "headline": "Short project description",
    "description": [
        "Detailed project description paragraph 1",
        "Detailed project description paragraph 2"
    ],
    "github_url": "https://github.com/username/repo",
    "demo_url": "https://your-demo.com",
    "image_url": f"{settings.PROJECT_BASE_IMG_URL}/your-project.webp",
    "img_name": "your-project.webp",
    "is_featured": True,
    "features": [
        {
            "title": "Feature Name",
            "description": "Feature description"
        }
    ],
    "tech_stack": [
        {
            "name": "Python",
            "description": "Core development language",
            "icon_svg": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg"
        },
        {
            "name": "Django",
            "description": "Web framework",
            "icon_svg": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg"
        }
    ],    "status": "completed",
    "created_at": datetime.strptime("2025-06-09T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-06-09T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Web Development",
    "tags": ["Python", "Django", "Web"],
    "priority": 1,
    "slug": "your-project-name"
}
```

### Adding Blog Posts

Create a new individual blog file `apps/data/content/blog/blog-15.py`:

```python
"""
Blog Post #15: Your Blog Post Title
Individual file architecture implementation
"""

from datetime import datetime
from django.conf import settings

blog_data = {
    "id": 15,
    "title": "Your Blog Post Title",
    "description": "Brief post description",
    "content": [
        "Article paragraph 1",
        "Article paragraph 2",
        "<h2 class='text-xl lg:text-2xl text-medium mt-4 md:mt-5 mb-2 md:mb-3'>Subheading</h2>",
        "<p class='mb-4 text-sm md:text-base lg:text-lg'>More content...</p>"
    ],
    "image_url": f"{settings.BLOG_BASE_IMG_URL}/your-post.webp",
    "img_name": "your-post.webp",
    "author": "Ridwan Halim",
    "username": "ridwaanhall",
    "author_image": f"{settings.BASE_URL}/static/img/ridwaanhall.webp",
    "tags": ["tag1", "tag2"],    "is_featured": True,
    "created_at": datetime.strptime("2025-06-09T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-06-09T10:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Technology",
    "read_time": 5,
    "views": 0,
    "slug": "your-blog-post-title"
}
```

## Deployment

### Vercel Deployment (Recommended)

Vercel provides seamless deployment for Django applications with automatic HTTPS, global CDN, and instant deployments.

#### Prerequisites

- Vercel account ([Sign up here](https://vercel.com))
- Git repository (GitHub, GitLab, or Bitbucket)
- All environment variables configured

#### Step 1: Prepare Your Repository

1. **Fork or Clone the Repository**

   ```bash
   git clone https://github.com/ridwaanhall/ridwaanhall-com.git
   cd ridwaanhall-com
   ```

2. **Update vercel.json Configuration**

   Ensure your `vercel.json` is configured correctly:

   ```json
   {
     "builds": [
       {
         "src": "FlexForge/wsgi.py",
         "use": "@vercel/python",
         "config": {
           "maxLambdaSize": "15mb",
           "runtime": "python3.12.0"
         }
       }
     ],
     "routes": [
       {
         "src": "static/(.*)",
         "dest": "staticfiles/$1"
       },
       {
         "src": "/(.*)",
         "dest": "FlexForge/wsgi.py"
       }
     ]
   }
   ```

#### Step 2: Deploy to Vercel

1. **Connect Repository**
   - Visit [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect it as a Python project

2. **Configure Build Settings** (Auto-detected)
   - **Framework Preset**: Other
   - **Build Command**: `pip install -r requirements.txt`
   - **Output Directory**: Leave empty
   - **Install Command**: Auto-detected

#### Step 3: Environment Variables Configuration

Add these environment variables in Vercel Project Settings → Environment Variables:

**🔧 Required Variables:**

```env
BASE_URL=https://your-project.vercel.app
SECRET_KEY=your-django-secret-key-here
ACCESS_TOKEN=ghp_your_github_personal_access_token
WAKATIME_API_KEY=waka_your_wakatime_api_key
DEBUG=False
```

**💬 Guestbook Variables (when GUESTBOOK_PAGE=True):**

```env
GUESTBOOK_PAGE=True
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GH_CLIENT_ID=your-github-oauth-client-id
GH_CLIENT_SECRET=your-github-oauth-client-secret
```

**🗄️ Database Variables (Production with PostgreSQL):**

```env
POSTGRES_DATABASE=your_database_name
POSTGRES_HOST=your.database.host.com
POSTGRES_USER=your_db_username
POSTGRES_PASSWORD=your_secure_password
POSTGRES_PORT=5432
```

#### Step 4: Custom Domain Setup (Optional)

1. **Add Custom Domain**
   - Go to Project Settings → Domains
   - Add your custom domain (e.g., `yourdomain.com`)
   - Configure DNS records as instructed

2. **Update Environment Variables**

   ```env
   BASE_URL=https://yourdomain.com
   ```

3. **Update OAuth Redirect URIs**
   - Google OAuth: `https://yourdomain.com/guestbook/accounts/google/login/callback/`
   - GitHub OAuth: `https://yourdomain.com/guestbook/accounts/github/login/callback/`

#### Step 5: Database Setup Options

A. Option A: SQLite (Development/Small Scale)

- Default configuration, no additional setup required
- Suitable for portfolios with minimal user interaction

B. Option B: PostgreSQL (Recommended for Production)

1. **Choose a Provider:**
   - [Neon](https://neon.tech/) - Serverless PostgreSQL (Free tier available)
   - [Supabase](https://supabase.com/) - Open source Firebase alternative
   - [PlanetScale](https://planetscale.com/) - Serverless MySQL (also compatible)
   - [Railway](https://railway.app/) - PostgreSQL hosting

2. **Configure Connection:**

   ```env
   POSTGRES_DATABASE=your_database
   POSTGRES_HOST=your.provider.host
   POSTGRES_USER=your_username
   POSTGRES_PASSWORD=your_password
   POSTGRES_PORT=5432
   ```

#### Step 6: Deployment and Verification

1. **Deploy**
   - Push changes to your repository
   - Vercel automatically triggers deployment
   - Monitor build logs in Vercel dashboard

2. **Verify Deployment**
   - Check your deployment URL
   - Test all pages and functionality
   - Verify environment variables are working
   - Test guestbook authentication (if enabled)

#### Deployment Checklist

- ✅ Repository connected to Vercel
- ✅ All environment variables configured
- ✅ vercel.json updated with correct paths
- ✅ Database configured (if using PostgreSQL)
- ✅ OAuth providers configured (if guestbook enabled)
- ✅ Custom domain setup (optional)
- ✅ SSL certificate automatically provisioned
- ✅ All functionality tested

#### Troubleshooting Common Issues

**Build Errors:**

- Check Python version compatibility (3.12+)
- Verify all dependencies in requirements.txt
- Check build logs for specific error messages

**Environment Variables:**

- Ensure no trailing spaces in variable values
- Verify all required variables are set
- Check variable names match exactly

**Database Connections:**

- Test database connectivity
- Verify PostgreSQL credentials
- Check firewall settings

**OAuth Issues:**

- Verify redirect URIs match exactly
- Check OAuth app configuration
- Ensure environment variables are correct

#### Performance Optimization

- **Static Files**: Automatically served via Vercel's global CDN
- **Caching**: Configure appropriate cache headers
- **Image Optimization**: Use WebP format where possible
- **Database**: Consider connection pooling for PostgreSQL

#### Monitoring and Analytics

- **Vercel Analytics**: Built-in performance monitoring
- **Error Tracking**: Monitor function errors in dashboard
- **Usage Statistics**: Track bandwidth and function invocations

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

### WakaTime API Integration

- Daily coding time tracking
- Weekly statistics
- Productivity metrics

## 🛠️ Management Commands

The project includes powerful Django management commands for administration and monitoring:

### User Management

#### Check Users

Monitor all users with their OAuth provider, email, and roles:

```bash
# Display all users in a beautiful table
python manage.py check_users

# Filter by provider
python manage.py check_users --filter-provider google
python manage.py check_users --filter-provider github

# Show only authors
python manage.py check_users --authors-only

# Output formats
python manage.py check_users --format table    # Default: Rich table
python manage.py check_users --format json     # JSON output
python manage.py check_users --format simple   # Simple text
```

#### Author & Co-Author Management

Manage the site's author and co-author system:

```bash
# List current authors and co-authors
python manage.py manage_authors list

# Set main author (removes current author)
python manage.py manage_authors set-author --user username
python manage.py manage_authors set-author --user "user@email.com" --force

# Add co-author (max 2, FIFO removal)
python manage.py manage_authors add-co-author --user username
python manage.py manage_authors add-co-author --user userid --force

# Remove co-author
python manage.py manage_authors remove-co-author --user username

# Clear all author/co-author roles
python manage.py manage_authors clear-all --force
```

### Features

- **Rich Table Output**: Beautiful colored tables with user statistics
- **FIFO Co-Author Management**: Automatically removes oldest co-author when adding a third
- **Multi-Provider Support**: Displays OAuth provider information (Google/GitHub)
- **Safe Operations**: Confirmation prompts for destructive actions (bypass with --force)
- **Flexible User Selection**: Target users by username, email, or user ID
- **Comprehensive Summaries**: User counts, provider breakdowns, and role statistics

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Clone**

   ```bash
   git clone https://github.com/ridwaanhall/ridwaanhall-com.git
   cd ridwaanhall-com
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Development Setup**

   ```bash
   python -m venv venv
   venv\Scripts\Activate.ps1  # PowerShell
   # or venv\Scripts\activate for Command Prompt
   # or source venv/bin/activate for macOS/Linux
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

This project is licensed under the Apache-2.0 license - see the [LICENSE](LICENSE) file for details.

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

- Django community for the excellent framework and continuous innovation
- TailwindCSS team for the utility-first CSS framework and exceptional developer experience
- Vercel for the seamless deployment platform and global CDN infrastructure
- GitHub and WakaTime for comprehensive API access and developer analytics
- Cloudflare for enterprise-grade CDN and security services
- The open-source community for inspiration and collaborative development

---

## 🏆 Revolutionary Achievement Summary

This portfolio represents more than just a personal website—it's a **technological showcase** that demonstrates advanced web development practices and innovative architecture solutions:

### 🎯 **Technical Achievements**

- ✅ **Individual File System**: Revolutionary modular architecture managing 47 projects + 14 blogs
- ✅ **Performance Excellence**: 97/100 desktop, 91/100 mobile PageSpeed scores
- ✅ **Enterprise Security**: Advanced CSP, HSTS, XSS protection, and comprehensive security headers
- ✅ **API Integration**: Real-time GitHub and WakaTime analytics with live data visualization
- ✅ **Interactive Guestbook**: Secure chat-like messaging with author/co-author system, multi-provider OAuth, and management commands
- ✅ **Scalable Architecture**: Production-ready system supporting unlimited content growth

### 📊 **Portfolio Statistics**

| Component | Count | Achievement |
|-----------|-------|-------------|
| **Technical Projects** | **47** | Individual file architecture |
| **Blog Articles** | **14** | Modular content management |
| **Guestbook Messages** | **Live** | Real-time chat system |
| **Performance Score** | **97/100** | Desktop PageSpeed excellence |
| **Security Headers** | **A+** | Enterprise-grade protection |
| **API Integrations** | **2+** | Real-time data analytics |

### 🚀 **Innovation Highlights**

- **🗂️ Individual File System**: Each project and blog exists as a separate Python file, revolutionizing content management
- **⚡ Performance Optimization**: Sub-second loading times with intelligent caching and lazy loading
- **🔒 Security Excellence**: Comprehensive security implementation with A+ ratings and XSS protection
- **📊 Real-time Analytics**: Live GitHub contributions and WakaTime coding statistics
- **💬 Interactive Guestbook**: Advanced messaging system with author/co-author roles, multi-provider OAuth (Google/GitHub), FIFO management, and CLI administration tools
- **🎨 Modern UI/UX**: Responsive design with interactive animations and micro-interactions

This project showcases the perfect blend of **technical innovation**, **professional execution**, and **scalable architecture**—representing the pinnacle of modern web development practices.

**Built with ❤️ by [Ridwan Halim](https://ridwaanhall.com) - Pushing the boundaries of web development excellence**
