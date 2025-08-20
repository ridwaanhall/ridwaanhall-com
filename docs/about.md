# About App Documentation

## Overview

The About app is a comprehensive portfolio information system that displays detailed information about the developer, including experiences, education, certifications, applications, and awards. It leverages the Individual File System to manage personal data through separate Python files.

## Table of Contents

- [App Structure](#app-structure)
- [File Organization](#file-organization)
- [Models and Views](#models-and-views)
- [URL Patterns](#url-patterns)
- [Templates](#templates)
- [Data Management](#data-management)
- [Configuration](#configuration)
- [Customization Examples](#customization-examples)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## App Structure

```txt
apps/about/
├── __init__.py
├── admin.py
├── apps.py
├── models.py           # Empty - uses Individual File System
├── views.py            # AboutView class
├── urls.py             # URL routing
├── tests.py
├── migrations/
└── templates/
    └── about/
        ├── about.html
        ├── applications.html
        ├── awards.html
        ├── certifications.html
        ├── education.html
        ├── experiences.html
        ├── intro.html
        ├── sponsor-me.html
        └── work-together.html
```

## File Organization

### Views Structure

The About app uses a single main view class:

```python
class AboutView(AboutSEOMixin, BaseView):
    """
    About page view displaying comprehensive portfolio information.
    Shows experiences, education, certifications, applications, and awards.
    """
    template_name = 'about/about.html'
```

### Data Sources

The About app integrates with the Individual File System through:

- **AboutManager**: Manages about-specific data loading
- **DataService**: Provides centralized data access
- **Individual Files**: Each data type stored in separate Python files

## Models and Views

### Models
The About app doesn't use traditional Django models. Instead, it uses the Individual File System where data is stored in Python files under `apps/data/about/`.

### Views

#### AboutView
- **Purpose**: Displays comprehensive about information
- **Template**: `about/about.html`
- **SEO**: Integrates with `AboutSEOMixin` for metadata
- **Error Handling**: Uses base class exception handling

```python
def _get(self, request, *args, **kwargs):
    about = self.get_about_data()
    
    context = {
        'about': about,
        'view_certs': 'true',
        'view': False,
        'experiences': DataService.get_experiences(),
        'education': DataService.get_education(),
        'certifications': DataService.get_certifications(),
        'applications': DataService.get_applications(),
        'awards': DataService.get_awards(),
    }
    
    context.update(self.get_context_data(**context))
    return self.render_to_response(context)
```

## URL Patterns

```python
# apps/about/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.AboutView.as_view(), name='about'),
]
```

**Accessible at**: `https://your-domain.com/about/`

## Templates

### Template Structure

The about templates are organized into modular components:

- **about.html**: Main about page layout
- **intro.html**: Personal introduction section
- **experiences.html**: Work experience timeline
- **education.html**: Educational background
- **certifications.html**: Professional certifications
- **applications.html**: Created applications showcase
- **awards.html**: Awards and recognitions
- **sponsor-me.html**: Sponsorship information
- **work-together.html**: Collaboration section

### Template Usage Example

```html
<!-- In about/about.html -->
{% include 'about/intro.html' %}
{% include 'about/experiences.html' %}
{% include 'about/education.html' %}
{% include 'about/certifications.html' %}
```

## Data Management

### Individual File System Integration

The About app uses the Individual File System where each data category is stored in separate Python files:

```txt
apps/data/about/
├── about_data.py           # Basic personal information
├── experiences_data.py     # Work experience data
├── education_data.py       # Educational background
├── certifications_data.py  # Professional certifications
├── skills_data.py          # Technical skills
├── awards_data.py          # Awards and recognitions
└── applications_data.py    # Created applications
```

### Data Structure Examples

#### About Data
```python
# apps/data/about/about_data.py
class AboutData:
    @staticmethod
    def get_about_data():
        return {
            "name": "Your Name",
            "title": "Your Professional Title",
            "description": "Your professional description",
            "email": "your.email@domain.com",
            "location": "Your Location",
            "cv": "https://drive.google.com/file/d/your-cv-id",
            # ... more fields
        }
```

#### Experience Data
```python
# apps/data/about/experiences_data.py
class ExperiencesData:
    experiences = [
        {
            "id": 1,
            "title": "Senior Developer",
            "company": "Tech Company",
            "location": "Location",
            "start_date": "2023-01",
            "end_date": None,  # Current position
            "is_current": True,
            "description": "Job responsibilities and achievements",
        }
    ]
```

### Data Access Methods

The `AboutManager` provides methods to access different data types:

```python
# Get all data
about_data = AboutManager.get_about_data()
experiences = AboutManager.get_experiences()
education = AboutManager.get_education()
certifications = AboutManager.get_certifications()
skills = AboutManager.get_skills()
awards = AboutManager.get_awards()

# Get filtered data
current_experiences = AboutManager.get_current_experiences()
latest_education = AboutManager.get_latest_education()
sorted_awards = AboutManager.get_sorted_awards()
```

## Configuration

### Environment Variables

No specific environment variables are required for the About app. It uses the core Django settings.

### Settings Integration

The About app integrates with global settings through:
- `BASE_URL`: Used for image URLs and links
- SEO settings for metadata generation
- Static file configurations for images and assets

## Customization Examples

### Adding New Experience

1. **Edit the experiences data file**:
```python
# apps/data/about/experiences_data.py
class ExperiencesData:
    experiences = [
        # ... existing experiences
        {
            "id": 5,
            "title": "New Position",
            "company": "New Company",
            "location": "New Location",
            "start_date": "2024-01",
            "end_date": None,
            "is_current": True,
            "description": "New role description",
            "technologies": ["Python", "Django", "React"],
        }
    ]
```

2. **No database migration needed** - data is immediately available

### Adding New Award

```python
# apps/data/about/awards_data.py
class AwardsData:
    awards = [
        # ... existing awards
        {
            "id": 10,
            "title": "Excellence in Development Award",
            "issuer": "Tech Organization",
            "date": "2024-03",
            "description": "Recognition for outstanding contributions",
            "certificate_url": "https://certificates.example.com/cert-id",
        }
    ]
```

### Customizing About Information

The AboutData class provides a comprehensive data structure for personal information with timezone-aware features:

```python
# apps/data/about/about_data.py
from django.conf import settings
from datetime import datetime
import pytz

class AboutData:
    @staticmethod
    def is_working_hours():
        """Check if current time is within working hours (timezone-aware)"""
        jakarta_tz = pytz.timezone("Asia/Jakarta")
        now = datetime.now(jakarta_tz)
        
        is_weekday = now.weekday() < 5  # Monday to Friday
        is_work_hour = 15 <= now.hour < 20  # 3 PM to 8 PM Jakarta time
        
        return is_weekday and is_work_hour

    @classmethod
    def get_about_data(cls):
        return {
            # Basic Information
            "name": "Your Full Name",
            "first_name": "Your",
            "last_name": "Name", 
            "username": "yourusername",  # GitHub username
            "aka": "nickname",
            
            # Profile & Assets
            "image_url": f"{settings.BASE_URL}/static/img/profile.webp",
            "personal_website": "https://yoursite.com",
            "cv": "https://drive.google.com/file/d/your-cv-id/view",
            "cv_latest": "https://drive.google.com/file/d/latest-cv-id/view", 
            "cv_copy": "https://docs.google.com/document/d/cv-copy-id/copy",
            
            # Professional Status
            "role": "Python Developer", 
            "is_active": cls.is_working_hours(),  # Real-time status
            "is_open_to_work": True,
            "is_hiring": False,
            
            # Descriptions (Multiple Formats)
            "short_description": "Brief tagline for your work",
            "short_bio": "A concise professional bio highlighting your expertise and approach",
            "short_cta": "Call-to-action message for visitors",
            "long_description": "Extended description covering your background, experience, and achievements",
            
            # Personal Stories
            "stories": [
                "Your background story - who you are and what drives you",
                "Your educational and spiritual journey", 
                "Professional experience and mentoring accomplishments",
                "Academic background and specializations",
                "Future vision and goals",
                "Invitation to collaborate and connect"
            ],
            
            # Location (Detailed Geographic Info)
            "location": {
                "regency": "Your City/Regency",
                "residency": "Your Residency/Region", 
                "province": "Your Province/State",
                "prov": "Province Abbreviation",
                "country": "Your Country",
                "flag": "🇮🇩"  # Country flag emoji
            },
            
            # Social Media & Contact (Comprehensive Links)
            "social_media": {
                "email": "contact@yoursite.com",
                "github": "https://github.com/yourusername", 
                "linkedin": "https://linkedin.com/in/yourusername",
                "follow_linkedin": "https://linkedin.com/comm/mynetwork/discovery-see-all?usecase=PEOPLE_FOLLOWS&followMember=yourusername",
                "instagram": "https://instagram.com/yourusername",
                "medium": "https://medium.com/@yourusername", 
                "x": "https://x.com/yourusername",
                "website": "https://yoursite.dev",
            },
            
            # Donation/Support Platforms
            "donate": [
                {
                    "github_sponsor": "https://github.com/sponsors/yourusername",
                    "donate_text": "Support me on GitHub Sponsors"
                },
                {
                    "sociabuzz": "https://sociabuzz.com/yourusername/support", 
                    "donate_text": "Become a patron through Sociabuzz"
                },
                {
                    "buy_me_a_coffee": "https://www.buymeacoffee.com/yourusername",
                    "donate_text": "Buy me a coffee" 
                },
                {
                    "saweria": "https://saweria.co/yourusername",
                    "donate_text": "Support via Saweria"
                }
            ],
            
            # Skills/Technologies
            "skills": [
                "Python",
                "Django", 
                "Machine Learning",
                "TensorFlow",
                "PyTorch",
                "Flask",
                "AI Development"
            ]
        }
```

#### Key Features:

**Dynamic Status**: The `is_working_hours()` method provides real-time availability status based on your timezone and schedule.

**Multiple Bio Formats**: Different length descriptions for various contexts:
- `short_description`: Tagline for headers
- `short_bio`: Professional summary
- `long_description`: Detailed background
- `stories`: Array of narrative segments

**Comprehensive Social Presence**: Complete social media and professional links including specialized LinkedIn follow links.

**Support Integration**: Multiple donation/support platforms for community funding.

**Geographic Detail**: Structured location information from local to country level.

**Professional Assets**: Direct links to CV, portfolio, and downloadable resources.

## Troubleshooting

### Common Issues

#### Data Not Displaying
**Problem**: About data not showing on the page
**Solution**: 
1. Check that data files exist in `apps/data/about/`
2. Verify Python syntax in data files
3. Check import statements in `AboutManager`

```bash
# Test data loading
python manage.py shell
>>> from apps.data.about_manager import AboutManager
>>> about = AboutManager.get_about_data()
>>> print(about)
```

#### Template Errors
**Problem**: Template rendering issues
**Solution**:
1. Verify template files exist in `apps/about/templates/about/`
2. Check template syntax and variable names
3. Ensure context data is passed correctly

#### SEO Metadata Missing
**Problem**: Missing meta tags or SEO data
**Solution**:
1. Verify `AboutSEOMixin` is properly imported
2. Check SEO configuration in settings
3. Ensure about data includes required fields for SEO

### Debug Commands

```bash
# Test about data access
python manage.py shell
>>> from apps.data.data_service import DataService
>>> print(DataService.get_about_data())
>>> print(DataService.get_experiences())

# Check data source info
>>> from apps.data.about_manager import AboutManager
>>> print(AboutManager.get_data_source_info())
```

## Best Practices

### Data Organization
1. **Keep data files focused**: Each file should handle one data type
2. **Use consistent naming**: Follow the established naming patterns
3. **Maintain data integrity**: Validate data structure before adding
4. **Document data changes**: Comment significant data updates

### Performance Considerations
1. **Use caching**: The DataService provides caching for frequently accessed data
2. **Optimize queries**: Load only necessary data for each view
3. **Image optimization**: Use optimized images for better performance

### Content Management
1. **Regular updates**: Keep experience and education data current
2. **Professional language**: Maintain professional tone in descriptions
3. **Consistent formatting**: Use consistent date formats and styling
4. **Backup data**: Regular backups of data files

### SEO Optimization
1. **Complete profiles**: Fill all relevant fields for better SEO
2. **Keyword usage**: Include relevant keywords in descriptions
3. **Meta descriptions**: Ensure descriptions are SEO-friendly
4. **Schema markup**: The app automatically generates structured data

### Security Considerations
1. **Personal information**: Be mindful of sensitive personal data
2. **Contact information**: Consider using contact forms instead of direct email
3. **Professional images**: Use appropriate professional photos
4. **Privacy**: Respect privacy in work experience descriptions

## Integration Points

### With Other Apps
- **Core App**: Shares about data for homepage display
- **SEO App**: Provides metadata for search engines
- **Dashboard App**: May display about statistics
- **Guestbook App**: Uses about data for author information

### External Services
- **Google Drive**: CV and document links
- **LinkedIn**: Professional profile integration
- **GitHub**: Developer profile connection
- **Email Services**: Contact information display

This documentation provides a comprehensive guide to understanding, customizing, and maintaining the About app within the FlexForge portfolio platform.