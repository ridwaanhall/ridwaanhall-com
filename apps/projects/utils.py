from apps.core.utils import load_json_data

def get_projects():
    """Get all projects from the JSON file."""
    return load_json_data('projects', 'projects.json')

def get_featured_projects():
    """Get only featured projects."""
    projects = get_projects()
    return [project for project in projects if project.get('featured', False)]

def get_project_by_id(project_id):
    """Get a specific project by its ID."""
    projects = get_projects()
    for project in projects:
        if project['id'] == project_id:
            return project
    return None