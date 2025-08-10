# Contributing to ridwaanhall.com

Thank you for your interest in contributing to this Django portfolio project! This document provides guidelines and information for contributors to ensure a smooth and effective collaboration process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Contributing Guidelines](#contributing-guidelines)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Documentation](#documentation)
- [Testing](#testing)
- [Security](#security)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.12+**: [Download Python](https://python.org/downloads/)
- **Git**: [Download Git](https://git-scm.com/downloads)
- **Code Editor**: VS Code, PyCharm, or your preferred editor
- **Virtual Environment**: `venv` or `virtualenv`

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```powershell
   git clone https://github.com/ridwaanhall/ridwaanhall-com.git
   cd ridwaanhall-com
   ```

3. **Add upstream remote**:

   ```powershell
   git remote add upstream https://github.com/ridwaanhall/ridwaanhall-com.git
   ```

## Development Setup

### 1. Create Virtual Environment

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate
```

### 2. Install Dependencies

```powershell
# Install Python dependencies
pip install -r requirements.txt

# Verify installation
python manage.py check
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
# Development Settings
DEBUG=True
SECRET_KEY="your-development-secret-key"
BASE_URL="http://localhost:8000"

# API Keys (optional for development)
ACCESS_TOKEN="your-github-token"
WAKATIME_API_KEY="your-wakatime-key"

# Image URLs
BLOG_BASE_IMG_URL="http://localhost:8000/static/img/blog"
PROJECT_BASE_IMG_URL="http://localhost:8000/static/img/project"
```

### 4. Run Development Server

```powershell
python manage.py runserver
```

Visit `http://localhost:8000` to view the application.

## Project Structure

Understanding the project architecture:

```txt
ridwaanhall_com/
├── apps/                          # Django applications
│   ├── about/                     # Personal information & bio
│   ├── blog/                      # Blog system with SEO
│   ├── core/                      # Homepage & base views
│   ├── dashboard/                 # GitHub/WakaTime analytics
│   ├── data/                      # Individual file data management system
│   ├── seo/                       # SEO, sitemaps, robots.txt
│   └── projects/                  # Portfolio management
├── FlexForge/                     # Django project configuration
├── static/                        # Development static files
├── staticfiles/                   # Production static files (auto-generated)
├── templates/                     # HTML templates
│   ├── base.html                  # Base template with navigation
│   ├── sidebar.html               # Navigation sidebar
│   └── partials/                  # Reusable template components
└── public/                        # Public assets (images, etc.)
```

### Key Applications

| App | Purpose | Key Features |
|-----|---------|--------------|
| `core` | Homepage & base functionality | Landing page, navigation, base views |
| `about` | Personal information | Bio, skills, experience, education |
| `projects` | Portfolio showcase | Project listings, detailed views, tech stack |
| `blog` | Content management | Articles, featured posts, SEO optimization |
| `dashboard` | Analytics integration | GitHub stats, WakaTime metrics, charts |
| `data` | Individual file system | Revolutionary modular data architecture |
| `seo` | SEO & indexing | Sitemaps, robots.txt, meta tags |

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes**: Fix existing issues or bugs
- ✨ **New features**: Add new functionality or components
- 📚 **Documentation**: Improve docs, README, or code comments
- 🎨 **UI/UX improvements**: Design enhancements or accessibility
- ⚡ **Performance**: Optimize code, queries, or loading times
- 🔒 **Security**: Security improvements or vulnerability fixes
- 🧪 **Testing**: Add or improve test coverage

### Contribution Workflow

1. **Check existing issues** before starting work
2. **Create an issue** for significant changes
3. **Fork and create a feature branch**
4. **Make your changes** following coding standards
5. **Test your changes** thoroughly
6. **Update documentation** if needed
7. **Submit a pull request**

## Coding Standards

### Python/Django Standards

Follow these coding conventions:

#### Code Style

- **PEP 8**: Follow Python Enhancement Proposal 8
- **Line Length**: Maximum 88 characters (Black formatter standard)
- **Imports**: Group imports (standard library, third-party, local)
- **Naming**: Use descriptive names for variables and functions

#### Django Best Practices

- **Views**: Use class-based views when appropriate
- **Models**: Include docstrings and proper field definitions
- **URLs**: Use meaningful URL patterns with names
- **Templates**: Follow Django template conventions
- **Settings**: Use environment variables for configuration

#### Example Code Structure

```python
# apps/projects/views.py
from django.views.generic import TemplateView
from django.shortcuts import render
from django.http import JsonResponse

from apps.data.projects_data import ProjectsData
from .base import BaseProjectsView


class ProjectsView(BaseProjectsView):
    """
    Display all projects with pagination and SEO metadata.
    
    This view handles the main projects listing page, including
    filtering, pagination, and comprehensive SEO optimization.
    """
    template_name = 'projects/projects.html'
    projects_per_page = 6

    def get_context_data(self, **kwargs):
        """Add projects data to template context."""
        context = super().get_context_data(**kwargs)
        
        # Get and paginate projects
        all_projects = ProjectsData.projects
        # ... pagination logic
        
        return context
```

### Frontend Standards

#### HTML/Templates

- **Semantic HTML**: Use appropriate HTML5 semantic elements
- **Accessibility**: Include ARIA labels and alt text
- **Performance**: Optimize images and use lazy loading
- **SEO**: Include proper meta tags and structured data

#### CSS/TailwindCSS

- **Utility Classes**: Use TailwindCSS utility classes
- **Responsive Design**: Mobile-first approach
- **Consistency**: Follow established design patterns
- **Performance**: Minimize custom CSS

#### JavaScript

- **Vanilla JS**: Prefer vanilla JavaScript over frameworks
- **ES6+**: Use modern JavaScript features
- **Performance**: Minimize DOM manipulation
- **Accessibility**: Ensure keyboard navigation support

## Commit Message Guidelines

Use conventional commit format:

```txt
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(dashboard): add GitHub contribution graph integration

- Implement GitHub API client for fetching contribution data
- Add interactive contribution graph component
- Include responsive design for mobile devices

Closes #45
```

```bash
fix(blog): resolve pagination issue on mobile devices

- Fix pagination component overflow on small screens
- Improve touch interactions for pagination buttons
- Add proper spacing for mobile navigation

Fixes #123
```

## Pull Request Process

### Before Submitting

1. **Sync with upstream**:

   ```powershell
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create feature branch**:

   ```powershell
   git checkout -b feature/your-feature-name
   ```

3. **Test your changes**:

   ```powershell
   python manage.py check
   python manage.py test
   ```

### Pull Request Template

When creating a pull request, include:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Other (please describe)

## Testing
- [ ] Local testing completed
- [ ] All existing tests pass
- [ ] New tests added (if applicable)

## Screenshots (if applicable)
Include screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly described)
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** and merge by maintainers

## Issue Reporting

### Bug Reports

Include the following information:

```markdown
**Bug Description**
Clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 91]
- Python Version: [e.g. 3.12]
- Django Version: [e.g. 5.2.5]
```

### Feature Requests

```markdown
**Feature Description**
Clear description of the proposed feature.

**Use Case**
Explain the problem this feature would solve.

**Proposed Solution**
Describe your proposed implementation.

**Additional Context**
Any other context or screenshots.
```

## Documentation

### Code Documentation

- **Docstrings**: Include docstrings for all classes and functions
- **Comments**: Add comments for complex logic
- **Type Hints**: Use Python type hints where appropriate
- **README Updates**: Update README.md for significant changes

### Example Documentation

```python
def calculate_reading_time(content: list[str]) -> int:
    """
    Calculate estimated reading time for blog content.
    
    Args:
        content: List of paragraphs/content blocks
        
    Returns:
        Estimated reading time in minutes
        
    Example:
        >>> content = ["Paragraph 1", "Paragraph 2"]
        >>> calculate_reading_time(content)
        3
    """
    total_words = sum(len(paragraph.split()) for paragraph in content)
    words_per_minute = 200
    return max(1, round(total_words / words_per_minute))
```

## Testing

### Running Tests

```powershell
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.blog

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Writing Tests

Create test files following Django conventions:

```python
# apps/blog/tests.py
from django.test import TestCase, Client
from django.urls import reverse
from apps.data.blog_data import BlogData


class BlogViewTests(TestCase):
    """Test cases for blog views."""
    
    def setUp(self):
        """Set up test client and data."""
        self.client = Client()
        
    def test_blog_list_view(self):
        """Test blog list page loads correctly."""
        response = self.client.get(reverse('blog'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Blog')
        
    def test_blog_detail_view(self):
        """Test blog detail page loads correctly."""
        # Test with first blog post
        if BlogData.blogs:
            blog_slug = BlogData.blogs[0]['title'].lower().replace(' ', '-')
            response = self.client.get(reverse('blog_detail', args=[blog_slug]))
            self.assertEqual(response.status_code, 200)
```

## Security

### Security Guidelines

- **Never commit sensitive data** (API keys, passwords)
- **Use environment variables** for configuration
- **Validate user input** properly
- **Follow Django security best practices**
- **Report security issues** privately to [hi@ridwaanhall.com](mailto:hi@ridwaanhall.com)

### Security Checklist

- [ ] No hardcoded secrets in code
- [ ] Proper input validation
- [ ] CSRF protection enabled
- [ ] Secure HTTP headers configured
- [ ] Dependencies are up to date

## Getting Help

### Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **Email**: [hi@ridwaanhall.com](mailto:hi@ridwaanhall.com) for private communications
- **LinkedIn**: [in/ridwaanhall](https://linkedin.com/in/ridwaanhall) for professional inquiries

### Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Python Style Guide (PEP 8)](https://pep8.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

## Recognition

Contributors will be recognized in the following ways:

- **GitHub Contributors**: Automatic recognition via GitHub
- **Changelog**: Major contributions mentioned in release notes
- **Documentation**: Contributor acknowledgments in README.md

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to ridwaanhall.com! Your efforts help make this project better for everyone. 🚀

**Questions?** Feel free to reach out via [email](mailto:hi@ridwaanhall.com) or create an issue for clarification.
