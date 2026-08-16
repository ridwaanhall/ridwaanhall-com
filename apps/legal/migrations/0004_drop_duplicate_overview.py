"""Remove the "Overview" section that duplicated the document summary.

Migration 0002 originally copied the old policy's ``overview`` into both the
document summary and a section of its own, so the same paragraph rendered twice
-- once under the title and again as the first section. 0002 no longer creates
that section, which makes this a no-op on any database migrated after the fix;
it exists for databases that ran the earlier version.
"""

from django.db import migrations


def forwards(apps, schema_editor):
    LegalDocument = apps.get_model("legal", "LegalDocument")

    for document in LegalDocument.objects.all():
        summary = (document.summary or "").strip()
        if not summary:
            continue
        duplicates = document.sections.filter(heading="Overview", parent__isnull=True)
        for section in duplicates:
            if (section.body or "").strip() == summary and not section.items:
                section.delete()


def backwards(apps, schema_editor):
    """Deliberately a no-op.

    The text was never lost -- it is the document summary, which is what the
    page renders. Recreating the duplicate section on rollback would restore
    the bug rather than the data.
    """


class Migration(migrations.Migration):
    dependencies = [("legal", "0003_seed_terms")]

    operations = [migrations.RunPython(forwards, backwards)]
