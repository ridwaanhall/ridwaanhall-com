"""Step 3 of 3: drop the legacy JSON column.

Kept separate from 0003 so the data migration can be applied and inspected in
production before the old values are actually removed.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("about", "0003_migrate_skills_highlight"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="profile",
            name="skills_highlight_legacy",
        ),
    ]
