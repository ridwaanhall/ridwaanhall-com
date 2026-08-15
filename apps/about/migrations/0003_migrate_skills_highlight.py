"""Step 2 of 3: copy the stored skill names onto the new M2M.

This is the repo's first data migration, and there are no fixtures to re-seed
from, so it fails loudly rather than skipping anything it cannot match.

Note the reverse is lossy in one respect: the JSON column stored a curated
order, while an M2M has no order column, so ``backwards`` writes the names back
in Skill pk order. The only consumer is the JSON-LD ``knowsAbout`` array, where
order carries no meaning.
"""

from django.db import migrations


def forwards(apps, schema_editor):
    Profile = apps.get_model("about", "Profile")
    Skill = apps.get_model("about", "Skill")
    db = schema_editor.connection.alias

    for profile in Profile.objects.using(db).all():
        names = profile.skills_highlight_legacy or []
        if not isinstance(names, list):
            raise RuntimeError(
                f"Profile pk={profile.pk}: skills_highlight is "
                f"{type(names).__name__}, expected a list."
            )

        pks, missing = [], []
        for raw in names:
            if not isinstance(raw, str):
                missing.append(raw)
                continue
            # Skill.name is not unique (only slug is), so pin to the lowest pk
            # to stay deterministic.
            qs = Skill.objects.using(db)
            pk = (
                qs.filter(name=raw.strip())
                .order_by("pk")
                .values_list("pk", flat=True)
                .first()
            )
            if pk is None:
                pk = (
                    qs.filter(name__iexact=raw.strip())
                    .order_by("pk")
                    .values_list("pk", flat=True)
                    .first()
                )
            if pk is None:
                missing.append(raw)
            elif pk not in pks:
                pks.append(pk)

        if missing:
            raise RuntimeError(
                f"Profile pk={profile.pk}: no about.Skill matches {missing!r}. "
                f"Create those Skill rows (or fix the names) and re-run "
                f"`manage.py migrate about`."
            )

        profile.skills_highlight.set(pks)


def backwards(apps, schema_editor):
    Profile = apps.get_model("about", "Profile")
    db = schema_editor.connection.alias

    for profile in Profile.objects.using(db).all():
        profile.skills_highlight_legacy = list(
            profile.skills_highlight.order_by("pk").values_list("name", flat=True)
        )
        # Historical models carry no custom save(), so SingletonModel's pk
        # forcing does not run here -- update_fields is safe.
        profile.save(update_fields=["skills_highlight_legacy"])


class Migration(migrations.Migration):

    dependencies = [
        ("about", "0002_profile_skills_highlight_m2m"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
