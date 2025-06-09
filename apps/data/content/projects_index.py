"""
Projects data index - imports all individual project files
"""

from pathlib import Path
import importlib.util
import os

class ProjectsDataIndex:
    """Dynamic loader for individual project files."""
    
    @classmethod
    def load_all_projects(cls):
        """Load all project data from individual files."""
        projects = []
        projects_dir = Path(__file__).parent / "projects"
        
        if not projects_dir.exists():
            return []
        
        # Get all project files and sort them
        project_files = sorted([f for f in projects_dir.glob("project-*.py")])
        
        for project_file in project_files:
            try:
                # Import the module
                spec = importlib.util.spec_from_file_location(
                    f"project_{project_file.stem}", project_file
                )
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Get the project data
                if hasattr(module, 'project_data'):
                    projects.append(module.project_data)
                    
            except Exception as e:
                print(f"Error loading {project_file}: {e}")
                continue
        
        return projects
    
    @classmethod
    def get_projects(cls):
        """Get all project data."""
        return cls.load_all_projects()

# For backward compatibility
projects = ProjectsDataIndex.load_all_projects()
