from django.db import models

from apps.core.choices import EMPLOYMENT_TYPE_CHOICES
from apps.core.models import SingletonModel


class HiringProfile(SingletonModel):
    company_name = models.CharField(max_length=255, blank=True)
    company_description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    hiring_status = models.CharField(max_length=100, blank=True)

    application_process = models.JSONField(default=list, blank=True)
    company_culture = models.JSONField(default=list, blank=True)

    requirements_general = models.JSONField(default=list, blank=True)
    requirements_technical = models.JSONField(default=list, blank=True)

    contact_email = models.EmailField(blank=True)
    contact_application_email = models.EmailField(blank=True)
    contact_response_time = models.CharField(max_length=255, blank=True)
    contact_interview_process = models.TextField(blank=True)

    additional_notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Hiring Profile"
        verbose_name_plural = "Hiring Profile"

    def __str__(self):
        return self.company_name or "Hiring Profile"


class Position(models.Model):
    hiring_profile = models.ForeignKey(HiringProfile, on_delete=models.CASCADE, related_name="positions")
    title = models.CharField(max_length=255)
    # Same vocabulary as Experience and Application.
    type = models.CharField(max_length=100, blank=True, choices=EMPLOYMENT_TYPE_CHOICES)
    location = models.CharField(max_length=255, blank=True)
    salary_range = models.CharField(max_length=100, blank=True)
    experience_required = models.CharField(max_length=255, blank=True)
    skills_required = models.JSONField(default=list, blank=True)
    responsibilities = models.JSONField(default=list, blank=True)
    benefits = models.JSONField(default=list, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class OpenToWorkProfile(SingletonModel):
    status = models.CharField(max_length=100, blank=True)
    availability = models.CharField(max_length=100, blank=True)
    remote = models.BooleanField(default=False)
    relocation = models.BooleanField(default=False)
    show_all_tools_skills = models.BooleanField(default=False)

    type = models.JSONField(default=list, blank=True)
    preferred_roles = models.JSONField(default=list, blank=True)
    skills_highlight = models.JSONField(default=list, blank=True)
    languages = models.JSONField(default=list, blank=True)
    preferred_locations = models.JSONField(default=list, blank=True)
    location_types = models.JSONField(default=list, blank=True)
    remote_locations = models.JSONField(default=list, blank=True)

    experience_level = models.CharField(max_length=100, blank=True)
    salary_expectation = models.CharField(max_length=100, blank=True)
    notice_period = models.CharField(max_length=100, blank=True)
    work_authorization = models.CharField(max_length=100, blank=True)
    contact_preference = models.CharField(max_length=100, blank=True)
    interview_availability = models.CharField(max_length=255, blank=True)
    additional_notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Open To Work Profile"
        verbose_name_plural = "Open To Work Profile"

    def __str__(self):
        return "Open To Work Profile"


class PortfolioHighlight(models.Model):
    open_to_work_profile = models.ForeignKey(
        OpenToWorkProfile, on_delete=models.CASCADE, related_name="portfolio_highlights"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title
