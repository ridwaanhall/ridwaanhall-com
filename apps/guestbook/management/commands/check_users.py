from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from allauth.socialaccount.models import SocialAccount
from apps.guestbook.models import UserProfile
from rich.console import Console
from rich.table import Table
from rich import box


class Command(BaseCommand):
    help = 'Check all users with their OAuth provider, email, and author status'

    def add_arguments(self, parser):
        parser.add_argument(
            '--format',
            type=str,
            choices=['table', 'json', 'simple'],
            default='table',
            help='Output format (default: table)'
        )
        parser.add_argument(
            '--filter-provider',
            type=str,
            choices=['google', 'github'],
            help='Filter by OAuth provider'
        )
        parser.add_argument(
            '--authors-only',
            action='store_true',
            help='Show only authors'
        )

    def handle(self, *args, **options):
        console = Console()
        
        # Get all users
        users = User.objects.all().order_by('date_joined')
        
        if not users.exists():
            self.stdout.write(self.style.WARNING('No users found.'))
            return        # Prepare user data
        user_data = []

        for user in users:            # Get or create user profile
            try:
                user_profile = UserProfile.objects.get(user=user)
                is_author = user_profile.is_author
                is_co_author = user_profile.is_co_author
                co_author_order = user_profile.co_author_order if user_profile.is_co_author else 0
            except UserProfile.DoesNotExist:
                # Create profile if it doesn't exist (shouldn't happen due to signals)
                user_profile = UserProfile.objects.create(user=user, is_author=False, is_co_author=False)
                is_author = False
                is_co_author = False
                co_author_order = 0
            
            # Get social accounts for this user
            social_accounts = SocialAccount.objects.filter(user=user)
            
            # Determine OAuth provider
            providers = []
            profile_image = None
            for account in social_accounts:
                providers.append(account.provider)
                if not profile_image:
                    extra_data = account.extra_data or {}
                    if account.provider == 'google':
                        profile_image = extra_data.get('picture')
                    elif account.provider == 'github':
                        profile_image = extra_data.get('avatar_url')

            provider_str = ', '.join(providers) if providers else 'Local'
            
            # Get full name
            full_name = user.get_full_name() or user.username
            if not full_name or full_name == user.username:
                # Try to get name from social account
                for account in social_accounts:
                    extra_data = account.extra_data or {}
                    if account.provider == 'google':
                        full_name = extra_data.get('name', user.username)
                        break
                    elif account.provider == 'github':
                        full_name = extra_data.get('name') or extra_data.get('login', user.username)
                        break

            user_info = {
                'id': user.id,
                'username': user.username,
                'full_name': full_name,
                'email': user.email,
                'provider': provider_str,
                'is_author': is_author,
                'is_co_author': is_co_author,
                'co_author_order': co_author_order,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M'),
                'last_login': user.last_login.strftime('%Y-%m-%d %H:%M') if user.last_login else 'Never',
                'profile_image': profile_image,
                'social_accounts_count': social_accounts.count()
            }
            
            # Apply filters
            if options['filter_provider']:
                if options['filter_provider'] not in provider_str.lower():
                    continue
            
            if options['authors_only'] and not is_author:
                continue
                
            user_data.append(user_info)

        if not user_data:
            self.stdout.write(self.style.WARNING('No users match the specified filters.'))
            return

        # Display data based on format
        if options['format'] == 'json':
            import json
            self.stdout.write(json.dumps(user_data, indent=2, default=str))
        
        elif options['format'] == 'simple':
            for user_info in user_data:
                self.stdout.write(
                    f"ID: {user_info['id']} | "
                    f"Username: {user_info['username']} | "
                    f"Full Name: {user_info['full_name']} | "
                    f"Email: {user_info['email']} | "
                    f"Provider: {user_info['provider']} | "
                    f"Author: {'Yes' if user_info['is_author'] else 'No'} | "
                    f"Active: {'Yes' if user_info['is_active'] else 'No'}"
                )
        
        else:  # table format (default)
            table = Table(
                title=f"[bold blue]User Information[/bold blue] ({len(user_data)} users)",
                box=box.ROUNDED,
                show_header=True,
                header_style="bold magenta"            )
            
            table.add_column("ID", style="cyan", width=4)
            table.add_column("Username", style="green", width=15)
            table.add_column("Full Name", style="yellow", width=20)
            table.add_column("Email", style="blue", width=25)
            table.add_column("Provider", style="magenta", width=12)
            table.add_column("Author", style="red", width=8)
            table.add_column("Co-Author", style="yellow", width=10)
            table.add_column("Active", style="green", width=8)
            table.add_column("Staff", style="cyan", width=7)
            table.add_column("Super", style="red", width=7)
            table.add_column("Joined", style="dim", width=12)
            table.add_column("Last Login", style="dim", width=12)
            table.add_column("Social", style="bright_black", width=7)
            
            for user_info in user_data:
                # Truncate long text
                full_name = user_info['full_name'][:18] + '...' if len(user_info['full_name']) > 20 else user_info['full_name']
                email = user_info['email'][:23] + '...' if len(user_info['email']) > 25 else user_info['email']
                  # Style for author and co-author
                author_style = "[bold red]✓[/bold red]" if user_info['is_author'] else "✗"
                co_author_style = f"[bold yellow]✓({user_info['co_author_order']})[/bold yellow]" if user_info['is_co_author'] else "✗"
                active_style = "[bold green]✓[/bold green]" if user_info['is_active'] else "[dim]✗[/dim]"
                staff_style = "[bold cyan]✓[/bold cyan]" if user_info['is_staff'] else "✗"
                super_style = "[bold red]✓[/bold red]" if user_info['is_superuser'] else "✗"
                
                table.add_row(
                    str(user_info['id']),
                    user_info['username'],
                    full_name,
                    email,
                    user_info['provider'],
                    author_style,
                    co_author_style,
                    active_style,
                    staff_style,
                    super_style,
                    user_info['date_joined'].split()[0],  # Just date
                    user_info['last_login'].split()[0] if user_info['last_login'] != 'Never' else 'Never',
                    str(user_info['social_accounts_count'])
                )
            
            console.print(table)
              # Summary
            total_users = len(user_data)
            google_users = len([u for u in user_data if 'google' in u['provider'].lower()])
            github_users = len([u for u in user_data if 'github' in u['provider'].lower()])
            local_users = len([u for u in user_data if u['provider'] == 'Local'])
            authors = len([u for u in user_data if u['is_author']])
            co_authors = len([u for u in user_data if u['is_co_author']])
            active_users = len([u for u in user_data if u['is_active']])
            
            console.print(f"\n[bold]Summary:[/bold]")
            console.print(f"Total Users: [cyan]{total_users}[/cyan]")
            console.print(f"Google Users: [green]{google_users}[/green]")
            console.print(f"GitHub Users: [blue]{github_users}[/blue]")
            console.print(f"Local Users: [yellow]{local_users}[/yellow]")
            console.print(f"Authors: [red]{authors}[/red]")
            console.print(f"Co-Authors: [yellow]{co_authors}[/yellow]/2")
            console.print(f"Active Users: [green]{active_users}[/green]")

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully checked {len(user_data)} users.'
            )
        )
