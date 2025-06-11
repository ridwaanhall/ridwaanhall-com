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
                if spec is None or spec.loader is None:
                    continue
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Get the project data
                if hasattr(module, 'project_data'):
                    project_data = module.project_data.copy()
                    
                    # Resolve tech_stack keys to full objects
                    if 'tech_stack' in project_data:
                        from apps.data.about.skills_data import SkillsData
                        # Extract the key references and resolve them
                        tech_keys = []
                        for tech in project_data['tech_stack']:
                            # Check if tech is already a dict (backward compatibility)
                            if isinstance(tech, dict) and 'name' in tech:
                                # Already resolved object, keep as is
                                continue
                            else:
                                # This should be a reference like SkillsData.tech_stack["python"]
                                # We need to extract the actual object
                                tech_keys.append(tech)
                        
                        # If we have key references, resolve them
                        if tech_keys:
                            project_data['tech_stack'] = tech_keys
                    
                    projects.append(project_data)
                    
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
