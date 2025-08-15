"""
Management command to test and configure WSRV image optimization settings.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
"""

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from apps.core.image_utils import get_optimized_image_url, get_wsrv_status


class Command(BaseCommand):
    help = 'Test and configure WSRV image optimization settings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--status',
            action='store_true',
            help='Show current WSRV optimization status',
        )
        parser.add_argument(
            '--test-url',
            type=str,
            help='Test URL to optimize with WSRV',
        )
        parser.add_argument(
            '--width',
            type=int,
            help='Width for test optimization',
        )
        parser.add_argument(
            '--height',
            type=int,
            help='Height for test optimization',
        )

    def handle(self, *args, **options):
        if options['status']:
            self.show_status()
        
        if options['test_url']:
            self.test_optimization(
                options['test_url'], 
                options.get('width'), 
                options.get('height')
            )

    def show_status(self):
        """Display current WSRV configuration status."""
        wsrv_enabled = get_wsrv_status()
        
        self.stdout.write(
            self.style.SUCCESS("WSRV Image Optimization Configuration")
        )
        self.stdout.write("-" * 40)
        
        if wsrv_enabled:
            self.stdout.write(
                self.style.SUCCESS("✓ WSRV optimization is ENABLED")
            )
        else:
            self.stdout.write(
                self.style.WARNING("✗ WSRV optimization is DISABLED")
            )
        
        self.stdout.write(f"Setting: WSRV_IMAGE_OPTIMIZATION = {wsrv_enabled}")
        self.stdout.write("")
        self.stdout.write("To toggle WSRV optimization, set WSRV_IMAGE_OPTIMIZATION in your environment:")
        self.stdout.write("  WSRV_IMAGE_OPTIMIZATION=True   # Enable optimization")
        self.stdout.write("  WSRV_IMAGE_OPTIMIZATION=False  # Disable optimization")

    def test_optimization(self, test_url, width=None, height=None):
        """Test WSRV optimization with a given URL."""
        self.stdout.write(
            self.style.SUCCESS(f"Testing WSRV optimization with: {test_url}")
        )
        self.stdout.write("-" * 50)
        
        # Test without dimensions
        optimized_url = get_optimized_image_url(test_url)
        self.stdout.write(f"Original URL: {test_url}")
        self.stdout.write(f"Optimized URL: {optimized_url}")
        
        # Test with dimensions if provided
        if width or height:
            optimized_with_dims = get_optimized_image_url(test_url, width=width, height=height)
            self.stdout.write(f"With dimensions ({width}x{height}): {optimized_with_dims}")
        
        # Show status
        wsrv_enabled = get_wsrv_status()
        if wsrv_enabled:
            self.stdout.write(self.style.SUCCESS("\n✓ WSRV optimization is currently ENABLED"))
        else:
            self.stdout.write(self.style.WARNING("\n✗ WSRV optimization is currently DISABLED"))
            self.stdout.write("  URLs will return unchanged when disabled")
