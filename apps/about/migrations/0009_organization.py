"""Collapse the repeated name/logo/website columns into a shared Organization.

Experience, Education, Certification and Award each stored their own company or
institution name, logo and website. Across 33 rows that was only 19 distinct
organisations -- "Coding Camp powered by DBS Foundation" alone appeared six
times and in two different models -- so changing a logo meant editing every row
that used it, and they could drift apart without anyone noticing.

Organisations are keyed on the **name**, not the logo. Several share a logo
file legitimately: "LinkedIn" and "LinkedIn Learning" are different issuers on
one mark, and three Al-Mukmin schools share theirs. Merging on the logo would
have fused them into one.

One conflict existed in the data: "LinkedIn Learning" carried two different
websites across its rows. The more specific one wins (see PREFERRED_WEBSITES),
and it is editable in the admin afterwards.

Operation order is load-bearing, for the same reason as 0008: reversing replays
operations backwards, so the old columns are relaxed to nullable *before* the
copy. That way the undo re-adds them empty, backwards() fills them in from the
FK, and only then is NOT NULL restored.
"""

import django.db.models.deletion
from django.db import migrations, models
from django.utils.text import slugify

#: model -> the name column it used
NAME_COLUMNS = {
    "Experience": "company",
    "Education": "institution",
    "Certification": "institution",
    "Award": "institution",
}

#: Resolves the single disagreement in the data. Without this the winner would
#: depend on row order, which is not a decision to leave to chance.
PREFERRED_WEBSITES = {
    "LinkedIn Learning": "https://www.linkedin.com/learning",
}


def forwards(apps, schema_editor):
    Organization = apps.get_model("about", "Organization")

    # 1. Gather every distinct organisation, preferring the first non-empty
    #    logo and website seen for each name.
    collected = {}
    for model_name, name_column in NAME_COLUMNS.items():
        for row in apps.get_model("about", model_name).objects.all():
            name = (getattr(row, name_column) or "").strip()
            if not name:
                continue
            entry = collected.setdefault(name, {"logo": "", "website": ""})
            if not entry["logo"] and getattr(row, "logo", None):
                entry["logo"] = row.logo.name
            if not entry["website"] and getattr(row, "website", None):
                entry["website"] = row.website

    # 2. Create them. The logo is assigned by *name* rather than re-uploaded, so
    #    the stored files are untouched and keep their existing paths.
    used_slugs = set()
    organizations = {}
    for name, entry in sorted(collected.items()):
        slug = slugify(name)[:255] or "organization"
        candidate, suffix = slug, 2
        while candidate in used_slugs:
            candidate, suffix = f"{slug}-{suffix}", suffix + 1
        used_slugs.add(candidate)
        organizations[name] = Organization.objects.create(
            name=name,
            slug=candidate,
            logo=entry["logo"] or None,
            website=PREFERRED_WEBSITES.get(name, entry["website"]),
        )

    # 3. Point every row at its organisation.
    for model_name, name_column in NAME_COLUMNS.items():
        model = apps.get_model("about", model_name)
        rows = []
        for row in model.objects.all():
            name = (getattr(row, name_column) or "").strip()
            row.organization = organizations.get(name)
            rows.append(row)
        if rows:
            model.objects.bulk_update(rows, ["organization"])


def backwards(apps, schema_editor):
    """Copy each organisation's fields back onto the rows that reference it."""
    for model_name, name_column in NAME_COLUMNS.items():
        model = apps.get_model("about", model_name)
        rows = []
        for row in model.objects.select_related("organization"):
            organization = row.organization
            setattr(row, name_column, organization.name if organization else "")
            if organization is not None:
                row.logo = organization.logo.name if organization.logo else None
                row.website = organization.website
            rows.append(row)
        if rows:
            model.objects.bulk_update(rows, [name_column, "logo", "website"])


class Migration(migrations.Migration):
    dependencies = [("about", "0008_real_dates")]

    operations = [
        migrations.CreateModel(
            name="Organization",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255, unique=True)),
                ("slug", models.SlugField(blank=True, max_length=255, unique=True)),
                ("logo", models.ImageField(blank=True, null=True, upload_to="logo/")),
                ("website", models.URLField(blank=True)),
            ],
            options={
                "verbose_name": "Organization",
                "verbose_name_plural": "Organizations",
                "ordering": ["name"],
            },
        ),

        # FK on every model, nullable until the copy has run.
        migrations.AddField(
            model_name="experience", name="organization",
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT,
                                    related_name="experiences", to="about.organization"),
        ),
        migrations.AddField(
            model_name="education", name="organization",
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT,
                                    related_name="education", to="about.organization"),
        ),
        migrations.AddField(
            model_name="certification", name="organization",
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT,
                                    related_name="certifications", to="about.organization"),
        ),
        migrations.AddField(
            model_name="award", name="organization",
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT,
                                    related_name="awards", to="about.organization"),
        ),

        # Relax the old NOT NULL columns so the reverse can re-add them empty.
        migrations.AlterField(model_name="experience", name="company",
                              field=models.CharField(max_length=255, null=True)),
        migrations.AlterField(model_name="experience", name="website",
                              field=models.URLField(blank=True, null=True)),
        migrations.AlterField(model_name="education", name="institution",
                              field=models.CharField(max_length=255, null=True)),
        migrations.AlterField(model_name="certification", name="institution",
                              field=models.CharField(max_length=255, null=True)),
        migrations.AlterField(model_name="certification", name="website",
                              field=models.URLField(blank=True, null=True)),
        migrations.AlterField(model_name="award", name="institution",
                              field=models.CharField(max_length=255, null=True)),
        migrations.AlterField(model_name="award", name="website",
                              field=models.URLField(blank=True, null=True)),

        migrations.RunPython(forwards, backwards),

        migrations.RemoveField(model_name="experience", name="company"),
        migrations.RemoveField(model_name="experience", name="logo"),
        migrations.RemoveField(model_name="experience", name="website"),
        migrations.RemoveField(model_name="education", name="institution"),
        migrations.RemoveField(model_name="education", name="logo"),
        migrations.RemoveField(model_name="education", name="website"),
        migrations.RemoveField(model_name="certification", name="institution"),
        migrations.RemoveField(model_name="certification", name="logo"),
        migrations.RemoveField(model_name="certification", name="website"),
        migrations.RemoveField(model_name="award", name="institution"),
        migrations.RemoveField(model_name="award", name="logo"),
        migrations.RemoveField(model_name="award", name="website"),

        # Every row now has an organisation, so require one.
        migrations.AlterField(
            model_name="experience", name="organization",
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,
                                    related_name="experiences", to="about.organization"),
        ),
        migrations.AlterField(
            model_name="education", name="organization",
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,
                                    related_name="education", to="about.organization"),
        ),
        migrations.AlterField(
            model_name="certification", name="organization",
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,
                                    related_name="certifications", to="about.organization"),
        ),
        migrations.AlterField(
            model_name="award", name="organization",
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,
                                    related_name="awards", to="about.organization"),
        ),
    ]
