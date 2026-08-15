"""Step 2 of 3: copy the existing links into the ordered join table.

Also restores the editorial order the field originally had. Before this field
became a relation it was a JSON list whose order was meaningful and curated;
migration 0003 moved the *values* across faithfully but a plain many-to-many
has nowhere to keep the sequence, so reads fell back to Skill pk order. The
constant below is that original list, applied once here so production ends up
matching what the site rendered before the conversion.

Anything not named in it (i.e. skills highlighted after the fact) keeps a
stable position by falling in behind, ordered by pk.
"""

from django.db import migrations

# The order Profile.skills_highlight held as a JSON column, prior to 0002-0004.
ORIGINAL_ORDER = ["Python", "Django", "TensorFlow", "PyTorch", "Flask"]


def forwards(apps, schema_editor):
    Profile = apps.get_model("about", "Profile")
    ProfileSkillHighlight = apps.get_model("about", "ProfileSkillHighlight")
    db = schema_editor.connection.alias

    rank = {name: index for index, name in enumerate(ORIGINAL_ORDER)}

    for profile in Profile.objects.using(db).all():
        skills = list(profile.skills_highlight.using(db).all())
        # Known names first in their curated order, then the rest by pk so the
        # result is deterministic either way.
        skills.sort(key=lambda s: (rank.get(s.name, len(rank)), s.pk))
        for position, skill in enumerate(skills):
            ProfileSkillHighlight.objects.using(db).update_or_create(
                profile=profile, skill=skill, defaults={"order": position}
            )


def backwards(apps, schema_editor):
    """Copy the links back onto the plain many-to-many, then clear this table.

    By the time this runs 0007 has already been reversed, so the field points
    at its auto-created join table again (freshly recreated and empty) and
    ``.set()`` writes there. Order is necessarily lost -- that is the whole
    reason the through model exists.
    """
    Profile = apps.get_model("about", "Profile")
    ProfileSkillHighlight = apps.get_model("about", "ProfileSkillHighlight")
    db = schema_editor.connection.alias

    for profile in Profile.objects.using(db).all():
        skill_ids = list(
            ProfileSkillHighlight.objects.using(db)
            .filter(profile=profile)
            .order_by("order")
            .values_list("skill_id", flat=True)
        )
        profile.skills_highlight.set(skill_ids)

    ProfileSkillHighlight.objects.using(db).all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("about", "0005_profileskillhighlight"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
