from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import models
from apps.guestbook.models import UserProfile
from rich.console import Console
from rich.table import Table
from rich import box


class Command(BaseCommand):
    help = 'Manage authors and co-authors'

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            type=str,
            choices=['list', 'set-author', 'add-co-author', 'remove-co-author', 'clear-all'],
            help='Action to perform'
        )
        parser.add_argument(
            '--user',
            type=str,
            help='Username or user ID for the action'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force action without confirmation'
        )

    def handle(self, *args, **options):
        console = Console()
        action = options['action']

        if action == 'list':
            self.list_authors(console)
        elif action == 'set-author':
            if not options['user']:
                self.stdout.write(self.style.ERROR('--user is required for set-author'))
                return
            self.set_author(console, options['user'], options['force'])
        elif action == 'add-co-author':
            if not options['user']:
                self.stdout.write(self.style.ERROR('--user is required for add-co-author'))
                return
            self.add_co_author(console, options['user'], options['force'])
        elif action == 'remove-co-author':
            if not options['user']:
                self.stdout.write(self.style.ERROR('--user is required for remove-co-author'))
                return
            self.remove_co_author(console, options['user'], options['force'])
        elif action == 'clear-all':
            self.clear_all_authors(console, options['force'])

    def get_user(self, user_input):
        """Get user by username or ID"""
        try:
            # Try to get by ID first
            if user_input.isdigit():
                return User.objects.get(id=int(user_input))
        except User.DoesNotExist:
            pass
        
        try:
            # Try to get by username
            return User.objects.get(username=user_input)
        except User.DoesNotExist:
            return None

    def list_authors(self, console):
        """List current authors and co-authors"""
        author_profiles = UserProfile.objects.filter(is_author=True)
        co_author_profiles = UserProfile.objects.filter(is_co_author=True).order_by('co_author_order')

        table = Table(
            title="[bold blue]Authors and Co-Authors[/bold blue]",
            box=box.ROUNDED,
            show_header=True,
            header_style="bold magenta"
        )
        
        table.add_column("Role", style="cyan", width=12)
        table.add_column("Username", style="green", width=15)
        table.add_column("Full Name", style="yellow", width=20)
        table.add_column("Email", style="blue", width=25)
        table.add_column("Order", style="magenta", width=8)
        table.add_column("Created", style="dim", width=12)

        # Add author
        for profile in author_profiles:
            user = profile.user
            full_name = user.get_full_name() or user.username
            table.add_row(
                "[bold red]Author[/bold red]",
                user.username,
                full_name,
                user.email,
                "-",
                profile.created_at.strftime('%Y-%m-%d')
            )

        # Add co-authors
        for profile in co_author_profiles:
            user = profile.user
            full_name = user.get_full_name() or user.username
            table.add_row(
                "[bold yellow]Co-Author[/bold yellow]",
                user.username,
                full_name,
                user.email,
                str(profile.co_author_order),
                profile.created_at.strftime('%Y-%m-%d')
            )

        if not author_profiles.exists() and not co_author_profiles.exists():
            console.print("[yellow]No authors or co-authors found.[/yellow]")
        else:
            console.print(table)
            console.print(f"\n[bold]Summary:[/bold]")
            console.print(f"Authors: [red]{author_profiles.count()}[/red]")
            console.print(f"Co-Authors: [yellow]{co_author_profiles.count()}[/yellow]/2")

    def set_author(self, console, user_input, force=False):
        """Set a user as the main author (removes current author)"""
        user = self.get_user(user_input)
        if not user:
            self.stdout.write(self.style.ERROR(f'User "{user_input}" not found'))
            return

        current_author = UserProfile.objects.filter(is_author=True).first()
        
        if current_author:
            if not force:
                console.print(f"[yellow]Warning: User '{current_author.user.username}' is currently the author.[/yellow]")
                console.print(f"Setting '{user.username}' as author will remove '{current_author.user.username}' as author.")
                confirm = input("Continue? (y/N): ").lower().strip()
                if confirm != 'y':
                    console.print("[red]Cancelled.[/red]")
                    return
            
            # Remove current author status
            current_author.is_author = False
            current_author.save()
            console.print(f"[dim]Removed author status from '{current_author.user.username}'[/dim]")

        # Set new author
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # If user was a co-author, remove co-author status
        if profile.is_co_author:
            profile.is_co_author = False
            profile.co_author_order = 0
            console.print(f"[dim]Removed co-author status from '{user.username}'[/dim]")
        
        profile.is_author = True
        profile.save()
        
        console.print(f"[green]✓ Successfully set '{user.username}' as the main author![/green]")

    def add_co_author(self, console, user_input, force=False):
        """Add a user as co-author (max 2, FIFO removal)"""
        user = self.get_user(user_input)
        if not user:
            self.stdout.write(self.style.ERROR(f'User "{user_input}" not found'))
            return

        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Check if user is already author or co-author
        if profile.is_author:
            console.print(f"[red]Error: '{user.username}' is already the main author![/red]")
            return
        
        if profile.is_co_author:
            console.print(f"[yellow]'{user.username}' is already a co-author.[/yellow]")
            return

        # Check current co-author count
        current_co_authors = UserProfile.objects.filter(is_co_author=True).order_by('co_author_order')
        
        if current_co_authors.count() >= 2:
            oldest_co_author = current_co_authors.first()
            if not force:
                console.print(f"[yellow]Warning: Maximum 2 co-authors allowed.[/yellow]")
                console.print(f"Adding '{user.username}' will remove '{oldest_co_author.user.username}' as co-author.")
                confirm = input("Continue? (y/N): ").lower().strip()
                if confirm != 'y':
                    console.print("[red]Cancelled.[/red]")
                    return
            
            # Remove oldest co-author
            oldest_co_author.is_co_author = False
            oldest_co_author.co_author_order = 0
            oldest_co_author.save()
            console.print(f"[dim]Removed co-author status from '{oldest_co_author.user.username}'[/dim]")

        # Add new co-author with next order number
        max_order = UserProfile.objects.filter(is_co_author=True).aggregate(
            models.Max('co_author_order')
        )['co_author_order__max'] or 0
        
        profile.is_co_author = True
        profile.co_author_order = max_order + 1
        profile.save()
        
        console.print(f"[green]✓ Successfully added '{user.username}' as co-author![/green]")

    def remove_co_author(self, console, user_input, force=False):
        """Remove co-author status from a user"""
        user = self.get_user(user_input)
        if not user:
            self.stdout.write(self.style.ERROR(f'User "{user_input}" not found'))
            return

        try:
            profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            console.print(f"[red]User '{user.username}' has no profile.[/red]")
            return

        if not profile.is_co_author:
            console.print(f"[yellow]'{user.username}' is not a co-author.[/yellow]")
            return

        if not force:
            confirm = input(f"Remove co-author status from '{user.username}'? (y/N): ").lower().strip()
            if confirm != 'y':
                console.print("[red]Cancelled.[/red]")
                return

        profile.is_co_author = False
        profile.co_author_order = 0
        profile.save()
        
        console.print(f"[green]✓ Removed co-author status from '{user.username}'![/green]")

    def clear_all_authors(self, console, force=False):
        """Clear all author and co-author statuses"""
        author_profiles = UserProfile.objects.filter(is_author=True)
        co_author_profiles = UserProfile.objects.filter(is_co_author=True)
        
        total_count = author_profiles.count() + co_author_profiles.count()
        
        if total_count == 0:
            console.print("[yellow]No authors or co-authors to clear.[/yellow]")
            return

        if not force:
            console.print(f"[red]Warning: This will remove all author/co-author statuses![/red]")
            console.print(f"Affected users: {total_count}")
            confirm = input("Continue? (y/N): ").lower().strip()
            if confirm != 'y':
                console.print("[red]Cancelled.[/red]")
                return

        # Clear all
        UserProfile.objects.filter(is_author=True).update(is_author=False)
        UserProfile.objects.filter(is_co_author=True).update(is_co_author=False, co_author_order=0)
        
        console.print(f"[green]✓ Cleared all author/co-author statuses ({total_count} users affected)![/green]")
