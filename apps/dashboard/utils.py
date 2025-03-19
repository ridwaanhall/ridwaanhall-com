from apps.core.utils import load_json_data

def get_skills():
    """Get all skills from the JSON file."""
    return load_json_data('dashboard', 'skills.json')