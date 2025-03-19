from apps.core.utils import load_json_data

def get_jobs():
    """Get all jobs from the JSON file."""
    return load_json_data('career', 'jobs.json')