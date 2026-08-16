"""
Legal documents: privacy policy, terms, and anything similar added later.

Replaces the old ``core.PrivacyPolicy`` singleton, which had ten hard-coded
JSON columns (``data_collected``, ``cookies``, ``legal_basis`` …) carried over
from the pre-database content layer. That shape meant a second document could
not exist without new model fields, a migration, a view, a template and SEO
wiring. Here a document is a row, so adding Terms is an admin task.

Sections are ordered and may nest one level, which is what the migrated privacy
content needs: most of its sections are flat key/value definition lists, but
``data_collected`` and ``cookies`` were two levels deep and ``copyright_credits``
mixed both.
"""

from django.db import models
from django.urls import reverse
from django.utils.text import slugify


class LegalDocument(models.Model):
    PRIVACY = "privacy"
    TERMS = "terms"
    COOKIES = "cookies"
    OTHER = "other"
    DOCUMENT_TYPES = [
        (PRIVACY, "Privacy Policy"),
        (TERMS, "Terms & Conditions"),
        (COOKIES, "Cookie Policy"),
        (OTHER, "Other"),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, default=OTHER)
    summary = models.TextField(
        blank=True, help_text="Short intro shown under the title, and used as the meta description."
    )
    is_published = models.BooleanField(
        default=True, help_text="Unpublished documents 404 and stay out of the sitemap."
    )
    last_updated = models.DateTimeField(auto_now=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "title"]
        indexes = [models.Index(fields=["is_published", "slug"])]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        # The privacy policy keeps its original path: it is in the sitemap, the
        # SEO config, the footer of every page and the search modal, and those
        # references predate this model.
        if self.slug == "privacy-policy":
            return reverse("privacy")
        return reverse("legal_document", kwargs={"slug": self.slug})

    @property
    def top_level_sections(self):
        """Sections with no parent, in order. Children come off each ``.children``."""
        return [s for s in self.sections.all() if s.parent_id is None]


class LegalSection(models.Model):
    document = models.ForeignKey(
        LegalDocument, on_delete=models.CASCADE, related_name="sections"
    )
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children",
        help_text="Leave empty for a top-level section. One level of nesting only.",
    )
    heading = models.CharField(max_length=200)
    body = models.TextField(
        blank=True, help_text="Optional prose shown above the list. Rendered as HTML."
    )
    items = models.JSONField(
        default=dict, blank=True,
        help_text="Definition list: each key is a term, each value its description.",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        indexes = [models.Index(fields=["document", "order"])]

    def __str__(self):
        return f"{self.document.title} — {self.heading}"

    def save(self, *args, **kwargs):
        # One level only: a child of a child re-parents to its grandparent, so
        # the template never has to recurse and the page stays readable.
        if self.parent is not None and self.parent.parent_id is not None:
            self.parent = self.parent.parent
        if self.parent is not None:
            self.document = self.parent.document
        super().save(*args, **kwargs)

    @property
    def ordered_children(self):
        return self.children.all()
