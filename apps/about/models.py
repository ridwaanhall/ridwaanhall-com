from django.db import models

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


class Experience(models.Model):
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    logo = models.ImageField(upload_to="logo/", blank=True, null=True)
    website = models.URLField(blank=True)

    period_start_month = models.CharField(max_length=10)
    period_start_year = models.IntegerField()
    period_end_month = models.CharField(max_length=10, blank=True, null=True)
    period_end_year = models.IntegerField(blank=True, null=True)

    employment_type = models.CharField(max_length=50)
    location_type = models.CharField(max_length=50)
    location = models.CharField(max_length=255)
    is_current = models.BooleanField(default=False)
    responsibilities = models.JSONField(default=list, blank=True)

    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.title} @ {self.company}"


class Education(models.Model):
    degree = models.CharField(max_length=255)
    institution = models.CharField(max_length=255)
    logo = models.ImageField(upload_to="logo/", blank=True, null=True)
    alias = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    is_last = models.BooleanField(default=False)
    achievements = models.JSONField(default=list, blank=True)

    years = models.CharField(max_length=50, blank=True, null=True)
    date_start_month = models.CharField(max_length=10, blank=True, null=True)
    date_start_year = models.IntegerField(blank=True, null=True)
    date_end_month = models.CharField(max_length=10, blank=True, null=True)
    date_end_year = models.IntegerField(blank=True, null=True)

    location_regency = models.CharField(max_length=100, blank=True)
    location_province = models.CharField(max_length=100, blank=True)
    location_prov = models.CharField(max_length=100, blank=True)
    location_country = models.CharField(max_length=100, blank=True)
    location_flag = models.CharField(max_length=16, blank=True)
    location_map_url = models.URLField(blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.degree} @ {self.institution}"


class Award(models.Model):
    title = models.CharField(max_length=255)
    credential_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    institution = models.CharField(max_length=255)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to="logo/", blank=True, null=True)
    issued_month = models.CharField(max_length=10)
    issued_year = models.IntegerField()

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return self.title


class Certification(models.Model):
    title = models.CharField(max_length=255)
    credential_url = models.URLField(blank=True)
    institution = models.CharField(max_length=255)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to="logo/", blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    achievements = models.JSONField(default=list, blank=True)
    issued_month = models.CharField(max_length=10)
    issued_year = models.IntegerField()

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
    EMPLOYMENT_TYPE_CHOICES = [
        ("Full-time", "Full-time"),
        ("Part-time", "Part-time"),
        ("Self-employed", "Self-employed"),
        ("Freelance", "Freelance"),
        ("Contract", "Contract"),
        ("Internship", "Internship"),
        ("Apprenticeship", "Apprenticeship"),
        ("Seasonal", "Seasonal"),
        ("Scholarship", "Scholarship"),
    ]
    LOCATION_TYPE_CHOICES = [
        ("On-site", "On-site"),
        ("Hybrid", "Hybrid"),
        ("Remote", "Remote"),
    ]
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
