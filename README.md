# ridwaanhall dev

```txt
ridwaanhall_dev/              # Root project
│── manage.py                 # Django management script
│── requirements.txt          # Dependencies list
│── db.sqlite3                # Database (if using SQLite)
│── .env                      # Environment variables (optional)
│── ridwaanhall_dev/          # Django project settings
│   │── __init__.py
│   │── settings/             # Settings split into multiple files
│   │   │── __init__.py
│   │   │── base.py           # Common settings
│   │   │── dev.py            # Development settings
│   │   │── prod.py           # Production settings
│   │── urls.py
│   │── wsgi.py
│   │── asgi.py
│── apps/                     # Django apps folder
│   │── core/                 # Home, About, Contact
│   │   │── migrations/
│   │   │── templates/core/
│   │   │   │── home.html
│   │   │   │── about.html
│   │   │   │── contact.html
│   │   │── static/core/css/  # Tailwind Compiled CSS
│   │   │   │── styles.css    # Tailwind CSS output
│   │   │── __init__.py
│   │   │── admin.py
│   │   │── apps.py
│   │   │── models.py
│   │   │── views.py
│   │   │── urls.py
│   │── career/               # Career data
│   │── dashboard/            # Dashboard visualization
│   │── projects/             # Projects showcase
│   │── lic_certs/            # Licenses & Certifications
│   │── playground/           # Playground for experiments
│   │── blog/                 # Blog app
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
│── static/                   # Global static files (Tailwind source)
│   │── css/
│   │   │── input.css         # Tailwind source file
│   │   │── output.css        # Tailwind compiled file
│   │── js/
│── templates/
│   │── base.html
│── tailwind.config.js         # Tailwind config
│── postcss.config.js          # PostCSS config
│── package.json               # Node dependencies
│── package-lock.json          # Lock file
│── node_modules/              # Tailwind dependencies
```
