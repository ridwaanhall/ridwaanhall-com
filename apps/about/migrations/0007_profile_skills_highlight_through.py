"""Step 3 of 3: point the M2M at the ordered through model.

Written by hand rather than taken from `makemigrations`, which offers a single
``AlterField`` here -- and that fails at run time: Django's schema editor
refuses to "add or remove through= on M2M fields"
(``django/db/backends/base/schema.py``, the ValueError just past the
both-sides-have-through no-op branch).

``RemoveField`` then ``AddField`` is the supported route. Neither touches the
highlight data:

* RemoveField drops the auto-created join table, whose rows 0006 already
  copied into ``ProfileSkillHighlight``.
* AddField skips table creation entirely for a M2M with an explicit through
  (``schema.add_field`` only calls ``create_model`` when the through model is
  auto-created), and an M2M has no column, so it is a state-only change.

Reversing puts the auto-created table back, empty, which is exactly what 0006's
reverse then repopulates.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("about", "0006_populate_skill_highlight_order"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="profile",
            name="skills_highlight",
        ),
        migrations.AddField(
            model_name="profile",
            name="skills_highlight",
            field=models.ManyToManyField(
                blank=True,
                related_name="highlighted_by_profiles",
                through="about.ProfileSkillHighlight",
                to="about.skill",
            ),
        ),
    ]
