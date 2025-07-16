"""
Management command to bundle static files for better performance.
This command creates bundled CSS and JS files to reduce HTTP requests.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
Created at: July 16, 2025
"""

import os
import hashlib
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Bundle static CSS and JS files to reduce HTTP requests'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force regeneration of bundles even if they exist'
        )

    def handle(self, *args, **options):
        force = options['force']
        
        # Define file bundles
        css_bundles = {
            'core.css': [
                'css/global.css',
                'css/clickRipple.css',
                'css/skillSlider.css',
                'css/hideScroll.css',
                'css/sidebarSearch.css',
                'font/Onest/Onest.css',
            ],
        }
        
        js_bundles = {
            'core.js': [
                'js/progressBar.js',
                'js/sidebar.js',
                'js/pageTransition.js',
                'js/createRipple.js',
                'js/sidebarSearch.js',
            ],
            'dashboard.js': [
                'js/countUp.js',
                'js/githubContributions.js',
            ],
            'projects.js': [
                'js/searchEnable.js',
                'js/backScroll.js',
                'js/projectImageSlider.js',
            ],
        }
        
        static_root = Path(settings.STATIC_ROOT) if hasattr(settings, 'STATIC_ROOT') else Path(settings.BASE_DIR) / 'staticfiles'
        
        # Create bundles directory
        bundles_dir = static_root / 'bundles'
        bundles_dir.mkdir(exist_ok=True)
        
        # Bundle CSS files
        for bundle_name, files in css_bundles.items():
            self.create_bundle(static_root, bundles_dir, bundle_name, files, 'css', force)
        
        # Bundle JS files
        for bundle_name, files in js_bundles.items():
            self.create_bundle(static_root, bundles_dir, bundle_name, files, 'js', force)
        
        self.stdout.write(
            self.style.SUCCESS('Successfully bundled static files!')
        )

    def create_bundle(self, static_root, bundles_dir, bundle_name, files, file_type, force):
        """Create a bundle file from a list of source files."""
        bundle_path = bundles_dir / bundle_name
        
        # Check if bundle exists and force is not used
        if bundle_path.exists() and not force:
            self.stdout.write(f'Bundle {bundle_name} already exists, skipping...')
            return
        
        content = []
        missing_files = []
        
        for file_path in files:
            full_path = static_root / file_path
            if full_path.exists():
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        file_content = f.read()
                        content.append(f'/* {file_path} */')
                        content.append(file_content)
                        content.append('')  # Add empty line between files
                except Exception as e:
                    self.stderr.write(f'Error reading {file_path}: {e}')
                    missing_files.append(file_path)
            else:
                missing_files.append(file_path)
        
        if missing_files:
            self.stdout.write(
                self.style.WARNING(
                    f'Missing files for {bundle_name}: {", ".join(missing_files)}'
                )
            )
        
        if content:
            # Generate content hash for cache busting
            bundle_content = '\n'.join(content)
            content_hash = hashlib.md5(bundle_content.encode()).hexdigest()[:8]
            
            # Write bundle file
            with open(bundle_path, 'w', encoding='utf-8') as f:
                f.write(bundle_content)
            
            # Create versioned file for cache busting
            versioned_name = f"{bundle_name.rsplit('.', 1)[0]}.{content_hash}.{file_type}"
            versioned_path = bundles_dir / versioned_name
            
            with open(versioned_path, 'w', encoding='utf-8') as f:
                f.write(bundle_content)
            
            # Create a manifest file to track versions
            manifest_path = bundles_dir / 'manifest.json'
            manifest = {}
            
            if manifest_path.exists():
                try:
                    import json
                    with open(manifest_path, 'r') as f:
                        manifest = json.load(f)
                except:
                    manifest = {}
            
            manifest[bundle_name] = {
                'versioned': versioned_name,
                'hash': content_hash,
                'files': files
            }
            
            import json
            with open(manifest_path, 'w') as f:
                json.dump(manifest, f, indent=2)
            
            self.stdout.write(
                self.style.SUCCESS(f'Created bundle: {bundle_name} ({len(files)} files)')
            )
        else:
            self.stderr.write(f'No valid files found for bundle: {bundle_name}')
