from django.db import models
from django.utils.text import slugify

from apps.core.choices import EMPLOYMENT_TYPE_CHOICES, LOCATION_TYPE_CHOICES

from apps.core.models import SingletonModel


class Profile(SingletonModel):
    name = models.CharField(max_length=255)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    username = models.CharField(max_length=100)
    aka = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to="profile/", blank=True, null=True)
    personal_website = models.URLField(blank=True)
    cv_main = models.URLField(blank=True)
    cv_latest = models.URLField(blank=True)
    cv_copy = models.URLField(blank=True)
    role = models.CharField(max_length=255)
    is_open_to_work = models.BooleanField(default=False)
    is_hiring = models.BooleanField(default=False)
    is_sick = models.BooleanField(default=False)

    short_description = models.TextField(blank=True)
    short_bio = models.TextField(blank=True)
    short_cta = models.TextField(blank=True)
    long_description = models.TextField(blank=True)

    stories = models.JSONField(default=list, blank=True)
    # Curated subset of the Skill catalogue, surfaced as JSON-LD `knowsAbout`.
    # Uses an explicit `through` model because the order is editorial and must
    # survive: a plain M2M has no order column and would return rows in
    # Skill.Meta.ordering (pk) order instead.
    skills_highlight = models.ManyToManyField(
        "about.Skill",
        through="about.ProfileSkillHighlight",
        related_name="highlighted_by_profiles",
        blank=True,
    )

    location_regency = models.CharField(max_length=100, blank=True)
    location_residency = models.CharField(max_length=100, blank=True)
    location_province = models.CharField(max_length=100, blank=True)
    location_prov = models.CharField(max_length=100, blank=True)
    location_country = models.CharField(max_length=100, blank=True)
    location_flag = models.CharField(max_length=16, blank=True)

    social_email = models.EmailField(blank=True)
    social_github = models.URLField(blank=True)
    social_linkedin = models.URLField(blank=True)
    social_follow_linkedin = models.URLField(blank=True)
    social_instagram = models.URLField(blank=True)
    social_medium = models.URLField(blank=True)
    social_x = models.URLField(blank=True)
    social_website = models.URLField(blank=True)

    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profile"

    def __str__(self):
        return self.name or "Profile"


class ProfileSkillHighlight(models.Model):
    """Ordered join row between Profile and Skill.

    Exists purely to give `Profile.skills_highlight` a stable, editorial order
    (the JSON-LD `knowsAbout` array), which a plain many-to-many cannot express.
    """

    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="skill_highlights"
    )
    skill = models.ForeignKey(
        "about.Skill", on_delete=models.CASCADE, related_name="profile_highlights"
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        verbose_name = "Highlighted Skill"
        verbose_name_plural = "Highlighted Skills"
        constraints = [
            models.UniqueConstraint(
                fields=["profile", "skill"], name="unique_profile_skill_highlight"
            )
        ]

    def __str__(self):
        return self.skill.name


class DonateLink(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="donate_links")
    platform = models.CharField(max_length=100)
    url = models.URLField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.platform


class Organization(models.Model):
    """A company, school or issuing body, shared by everything that references it.

    Experience, Education, Certification and Award each used to carry their own
    name, logo and website. Across 33 rows that was only 19 distinct
    organisations, so one logo change meant editing up to six rows and they
    could silently drift apart.

    Keyed on the name, not the logo: several organisations legitimately share a
    logo file. "LinkedIn" and "LinkedIn Learning" are separate issuers on one
    mark, and three Al-Mukmin schools share theirs.
    """

    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    logo = models.ImageField(upload_to="logo/", blank=True, null=True)
    website = models.URLField(blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Experience(models.Model):
    title = models.CharField(max_length=255)
    organization = models.ForeignKey(
        Organization, on_delete=models.PROTECT, related_name="experiences"
    )

    # Only month and year are meaningful, so the day is pinned to the 1st.
    # Stored as real dates rather than a month name plus an integer year: that
    # pair could not be sorted or compared, and fed a non-ISO string straight
    # into the JSON-LD startDate, which schema.org rejects.
    period_start = models.DateField(help_text="Day is ignored; only month and year are shown.")
    period_end = models.DateField(
        blank=True, null=True, help_text="Leave empty for a role you are still in ('Present')."
    )

    # Free text until now, which is how the same idea could be spelled two ways
    # across rows. Same vocabulary as Application, so the admin filters line up.
    employment_type = models.CharField(max_length=50, choices=EMPLOYMENT_TYPE_CHOICES)
    location_type = models.CharField(max_length=50, choices=LOCATION_TYPE_CHOICES)
    location = models.CharField(max_length=255)
    is_current = models.BooleanField(default=False)
    responsibilities = models.JSONField(default=list, blank=True)

    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        # organization_id is checked first so __str__ still works on an unsaved
        # instance, which the admin does when rendering validation errors.
        return f"{self.title} @ {self.organization.name}" if self.organization_id else self.title


class Education(models.Model):
    degree = models.CharField(max_length=255)
    organization = models.ForeignKey(
        Organization, on_delete=models.PROTECT, related_name="education"
    )
    alias = models.CharField(max_length=100, blank=True, null=True)
    is_last = models.BooleanField(default=False)
    achievements = models.JSONField(default=list, blank=True)

    # `years` is a free-text range ("2018 - 2021") used by the older entries,
    # which never recorded a month. It is kept rather than parsed into dates:
    # storing "2018 - 2021" as January 2018 would claim a precision the data
    # never had. Newer entries fill in the real dates below instead.
    years = models.CharField(max_length=50, blank=True, null=True)
    date_start = models.DateField(blank=True, null=True, help_text="Day is ignored.")
    date_end = models.DateField(blank=True, null=True, help_text="Day is ignored.")

    location_regency = models.CharField(max_length=100, blank=True)
    location_province = models.CharField(max_length=100, blank=True)
    location_prov = models.CharField(max_length=100, blank=True)
    location_country = models.CharField(max_length=100, blank=True)
    location_flag = models.CharField(max_length=16, blank=True)
    location_map_url = models.URLField(blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.degree} @ {self.organization.name}" if self.organization_id else self.degree


class Award(models.Model):
    title = models.CharField(max_length=255)
    credential_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    organization = models.ForeignKey(
        Organization, on_delete=models.PROTECT, related_name="awards"
    )
    issued = models.DateField(help_text="Day is ignored; only month and year are shown.")

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return self.title


class Certification(models.Model):
    title = models.CharField(max_length=255)
    credential_url = models.URLField(blank=True)
    organization = models.ForeignKey(
        Organization, on_delete=models.PROTECT, related_name="certifications"
    )
    is_featured = models.BooleanField(default=False)
    achievements = models.JSONField(default=list, blank=True)
    issued = models.DateField(help_text="Day is ignored; only month and year are shown.")

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return self.title


class Skill(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon_svg = models.CharField(max_length=500, blank=True)
    category = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.name


class Application(models.Model):
    STATUS_CHOICES = [
        ("Applied", "Applied"),
        ("In Progress", "In Progress"),
        ("Withdrawn", "Withdrawn"),
        ("Accepted", "Accepted"),
        ("Rejected", "Rejected"),
        ("Ghosted", "Ghosted"),
    ]
    # Kept as class attributes for the existing references, but the lists
    # themselves live in apps.core.choices so Experience, Position and the
    # open-to-work profile all agree on the same wording.
    EMPLOYMENT_TYPE_CHOICES = EMPLOYMENT_TYPE_CHOICES
    LOCATION_TYPE_CHOICES = LOCATION_TYPE_CHOICES
    APPLIED_VIA_CHOICES = [
        ("LinkedIn", "LinkedIn"),
        ("GitHub", "GitHub"),
        ("MagangHub", "MagangHub"),
        ("Talenta IT", "Talenta IT"),
        ("Dealls", "Dealls"),
        ("Katrecs", "Katrecs"),
        ("Humanis.id", "Humanis.id"),
        ("Other", "Other"),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    company_name = models.CharField(max_length=255)
    position = models.CharField(max_length=255)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES)
    location_type = models.CharField(max_length=20, choices=LOCATION_TYPE_CHOICES)
    location = models.CharField(max_length=255, blank=True)
    applied_via = models.CharField(max_length=20, choices=APPLIED_VIA_CHOICES, blank=True, null=True)
    salary_range = models.CharField(max_length=100, blank=True, null=True)
    lessons_learned = models.TextField(blank=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return f"{self.position} @ {self.company_name}"


class JourneyStep(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="journey_steps")
    timestamp = models.DateTimeField(blank=True, null=True)
    title = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return self.title
