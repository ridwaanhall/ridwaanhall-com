from django.db import models
from django.utils import timezone


class SingletonModel(models.Model):
    """Abstract base for models that only ever hold a single row (pk=1)."""

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class ContentVersion(models.Model):
    """Shared invalidation stamp for one content namespace.

    Cached payloads live in each instance's own memory, which on Vercel means
    an admin edit handled by one lambda would otherwise leave every other
    lambda serving stale content. Cache keys embed the version read from here,
    so bumping a row orphans every key derived from that namespace across all
    instances at once -- no cross-instance messaging required.

    Kept deliberately tiny: the whole table is read in a single indexed query
    (then memoised locally for a few seconds), which is the only database work
    a fully warm page does. See ``apps.core.cache``.
    """

    namespace = models.CharField(max_length=32, primary_key=True)
    version = models.PositiveBigIntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Content Version"
        verbose_name_plural = "Content Versions"

    def __str__(self):
        return f"{self.namespace} v{self.version}"


class PrivacyPolicy(SingletonModel):
    last_updated = models.DateTimeField(default=timezone.now)
    overview = models.TextField(blank=True)
    policy_updates = models.TextField(blank=True)

    data_collected = models.JSONField(default=dict, blank=True)
    data_usage = models.JSONField(default=dict, blank=True)
    third_party_services = models.JSONField(default=dict, blank=True)
    data_protection = models.JSONField(default=dict, blank=True)
    user_rights = models.JSONField(default=dict, blank=True)
    guestbook_limitations = models.JSONField(default=dict, blank=True)
    email_communications = models.JSONField(default=dict, blank=True)
    legal_basis = models.JSONField(default=dict, blank=True)
    cookies = models.JSONField(default=dict, blank=True)
    copyright_credits = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Privacy Policy"
        verbose_name_plural = "Privacy Policy"

    def __str__(self):
        return "Privacy Policy"
