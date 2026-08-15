"""Step 1 of 3 converting Profile.skills_highlight from JSON to a real M2M.

Django's autodetector cannot turn a JSONField into a ManyToManyField (an M2M
has no column, only a join table), and offering it the same field name would
make it drop and recreate -- silently losing the stored values. So the old
column is renamed out of the way first and the M2M added beside it; 0003 copies
the data across and 0004 drops the legacy column.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("about", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="profile",
            old_name="skills_highlight",
            new_name="skills_highlight_legacy",
        ),
        migrations.AddField(
            model_name="profile",
            name="skills_highlight",
            field=models.ManyToManyField(
                blank=True,
                related_name="highlighted_by_profiles",
                to="about.skill",
            ),
        ),
    ]
