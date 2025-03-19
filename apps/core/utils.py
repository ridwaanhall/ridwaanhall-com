import json
import os
from pathlib import Path

def load_json_data(app_name, filename):
    """Load data from a JSON file in an app's data directory."""
    base_dir = Path(__file__).resolve().parent.parent
    file_path = base_dir / app_name / 'data' / filename
    
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading {file_path}: {e}")
        return {} if filename.endswith('.json') and not filename.startswith('[') else []