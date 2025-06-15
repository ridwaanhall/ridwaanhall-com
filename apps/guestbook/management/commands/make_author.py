from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.guestbook.models import UserProfile


class Command(BaseCommand):
    help = 'Make a user the site author/owner'

    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            type=str,
            help='Username of the user to make author'
        )
        parser.add_argument(
            '--remove',
            action='store_true',
            help='Remove author status instead of adding it'
        )

    def handle(self, *args, **options):
        username = options['username']
        remove = options['remove']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User "{username}" does not exist.')
            )
            return

        # Get or create user profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        if remove:
            if profile.is_author:
                profile.is_author = False
                profile.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully removed author status from "{username}".')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'User "{username}" is not an author.')
                )
        else:
            # Remove author status from all other users first
            UserProfile.objects.filter(is_author=True).update(is_author=False)
            
            # Make this user the author
            profile.is_author = True
            profile.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully made "{username}" the site author.')
            )