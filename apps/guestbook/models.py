from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver

# Create your models here.

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_author = models.BooleanField(default=False, help_text="Designates whether this user is the site author/owner")
    is_co_author = models.BooleanField(default=False, help_text="Designates whether this user is a co-author (max 2)")
    co_author_order = models.PositiveIntegerField(default=0, help_text="Order of co-author assignment (for FIFO removal)")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'userprofile'):
        instance.userprofile.save()
    else:
        UserProfile.objects.create(user=instance)

class ChatMessage(models.Model):
    MAX_PINNED_MESSAGES = 3

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField(max_length=500)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    reply_to = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    is_pinned = models.BooleanField(default=False, help_text="Pinned by an author/co-author (max 3 at a time)")
    pinned_at = models.DateTimeField(null=True, blank=True, help_text="When this message was pinned")

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),  # For recent messages query
            models.Index(fields=['user', '-timestamp']),  # For user's messages
            models.Index(fields=['is_pinned', '-pinned_at'], name='guestbook_pinned_idx'),
        ]

    def __str__(self):
        return f"{self.user.username}: {self.message[:50]}..."