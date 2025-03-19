from apps.core.utils import load_json_data

def get_certifications():
    """Get all certifications from the JSON file."""
    return load_json_data('lic_certs', 'certifications.json')