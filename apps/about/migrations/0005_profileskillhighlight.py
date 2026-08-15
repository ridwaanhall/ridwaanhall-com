"""Step 1 of 3 giving Profile.skills_highlight a stable editorial order.

Creates the ordered join table only. The M2M itself still points at its
auto-created table at this point, so 0006 can read the existing links out of it
before 0007 swaps the field over to this model.
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("about", "0004_remove_profile_skills_highlight_legacy"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProfileSkillHighlight",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "profile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="skill_highlights",
                        to="about.profile",
                    ),
                ),
                (
                    "skill",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="profile_highlights",
                        to="about.skill",
                    ),
                ),
            ],
            options={
                "verbose_name": "Highlighted Skill",
                "verbose_name_plural": "Highlighted Skills",
                "ordering": ["order"],
            },
        ),
        migrations.AddConstraint(
            model_name="profileskillhighlight",
            constraint=models.UniqueConstraint(
                fields=("profile", "skill"), name="unique_profile_skill_highlight"
            ),
        ),
    ]
