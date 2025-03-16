# ridwaanhall dev

```txt
ridwaanhall_dev/          # Root project
│── manage.py             # Django management script
│── requirements.txt      # Dependencies list
│── db.sqlite3            # Database (if using SQLite)
│── .env                  # Environment variables (optional)
│── ridwaanhall_dev/      # Django project settings
│   │── __init__.py
│   │── settings/         # Settings split into multiple files
│   │   │── __init__.py
│   │   │── base.py       # Common settings
│   │   │── dev.py        # Development settings
│   │   │── prod.py       # Production settings
│   │── urls.py
│   │── wsgi.py
│   │── asgi.py
│── apps/                 # Django apps folder
│   │── core/             # Home, About, Contact
│   │   │── migrations/
│   │   │── templates/core/
│   │   │   │── home.html
│   │   │   │── about.html
│   │   │   │── contact.html
│   │   │── __init__.py
│   │   │── admin.py
│   │   │── apps.py
│   │   │── models.py
│   │   │── views.py
│   │   │── urls.py
│   │── career/           # Career data
│   │── dashboard/        # Dashboard visualization
│   │── projects/         # Projects showcase
│   │── lic_certs/        # Licenses & Certifications
│   │── playground/       # Playground for experiments
│   │── blog/             # Blog app (new)
│   │   │── migrations/
│   │   │── templates/blog/
│   │   │   │── blog_list.html
│   │   │   │── blog_detail.html
│   │   │── __init__.py
│   │   │── admin.py
│   │   │── apps.py
│   │   │── models.py
│   │   │── views.py
│   │   │── urls.py
│── static/               # Static files (CSS, JS)
│── templates/            # Global templates
│   │── base.html         # Main template
```
