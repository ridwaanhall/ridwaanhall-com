"""Store dates as dates, not as a month name beside an integer year.

Experience, Education, Certification and Award each recorded a date as a
CharField month ("Jan") plus an IntegerField year. That pair cannot be sorted,
filtered or compared without reconstructing it in Python, and it was fed
straight into the JSON-LD ``startDate`` as "Jan 2024" -- which schema.org
rejects, since it expects ISO 8601.

Only month and year were ever meaningful, so the day is pinned to the 1st.

The steps have to live in one migration, in this order: the new columns must
exist before the copy, the old ones must still exist during it, and the NOT NULL
constraints are applied last, once every row has a value.

Reversible -- backwards rebuilds the month/year pairs from the dates.
"""

from django.db import migrations, models

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONTH_NUMBERS = {name: number for number, name in enumerate(MONTHS, start=1)}
# Tolerate full month names and different casing, in case anything was entered
# by hand in the admin rather than coming from the original import.
MONTH_NUMBERS.update({name.lower(): number for name, number in list(MONTH_NUMBERS.items())})
MONTH_NUMBERS.update({
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
})

#: model, (old month field, old year field, new date field)
CONVERSIONS = [
    ("Experience", [("period_start_month", "period_start_year", "period_start"),
                    ("period_end_month", "period_end_year", "period_end")]),
    ("Education", [("date_start_month", "date_start_year", "date_start"),
                   ("date_end_month", "date_end_year", "date_end")]),
    ("Certification", [("issued_month", "issued_year", "issued")]),
    ("Award", [("issued_month", "issued_year", "issued")]),
]


def _to_date(month, year):
    import datetime

    if not month or not year:
        return None
    number = MONTH_NUMBERS.get(str(month).strip()) or MONTH_NUMBERS.get(str(month).strip().lower())
    if number is None:
        return None
    return datetime.date(int(year), number, 1)


def forwards(apps, schema_editor):
    for model_name, fields in CONVERSIONS:
        model = apps.get_model("about", model_name)
        rows = []
        for row in model.objects.all():
            for month_field, year_field, date_field in fields:
                setattr(row, date_field,
                        _to_date(getattr(row, month_field), getattr(row, year_field)))
            rows.append(row)
        if rows:
            model.objects.bulk_update(rows, [f[2] for f in fields])


def backwards(apps, schema_editor):
    for model_name, fields in CONVERSIONS:
        model = apps.get_model("about", model_name)
        rows = []
        for row in model.objects.all():
            for month_field, year_field, date_field in fields:
                value = getattr(row, date_field)
                setattr(row, month_field, MONTHS[value.month - 1] if value else None)
                setattr(row, year_field, value.year if value else None)
            rows.append(row)
        if rows:
            columns = [c for f in fields for c in (f[0], f[1])]
            model.objects.bulk_update(rows, columns)


class Migration(migrations.Migration):
    dependencies = [("about", "0007_profile_skills_highlight_through")]

    operations = [
        # 1. New columns, nullable so existing rows can be added to.
        migrations.AddField(
            model_name="experience", name="period_start",
            field=models.DateField(null=True, help_text="Day is ignored; only month and year are shown."),
        ),
        migrations.AddField(
            model_name="experience", name="period_end",
            field=models.DateField(blank=True, null=True, help_text="Leave empty for a role you are still in ('Present')."),
        ),
        migrations.AddField(
            model_name="education", name="date_start",
            field=models.DateField(blank=True, null=True, help_text="Day is ignored."),
        ),
        migrations.AddField(
            model_name="education", name="date_end",
            field=models.DateField(blank=True, null=True, help_text="Day is ignored."),
        ),
        migrations.AddField(
            model_name="certification", name="issued",
            field=models.DateField(null=True, help_text="Day is ignored; only month and year are shown."),
        ),
        migrations.AddField(
            model_name="award", name="issued",
            field=models.DateField(null=True, help_text="Day is ignored; only month and year are shown."),
        ),

        # 2. Relax the old NOT NULL columns before touching them.
        #
        # This exists for the *reverse* path. Reversing replays the operations
        # backwards, so RemoveField's undo re-adds each old column using the
        # definition in force at that point. Left as NOT NULL, adding it back to
        # a table that already has rows fails outright -- before RunPython has
        # any chance to populate it. Relaxing them here means the undo re-adds
        # them nullable, fills them in, and only then restores the constraint.
        migrations.AlterField(
            model_name="experience", name="period_start_month",
            field=models.CharField(max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="experience", name="period_start_year",
            field=models.IntegerField(null=True),
        ),
        migrations.AlterField(
            model_name="certification", name="issued_month",
            field=models.CharField(max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="certification", name="issued_year",
            field=models.IntegerField(null=True),
        ),
        migrations.AlterField(
            model_name="award", name="issued_month",
            field=models.CharField(max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="award", name="issued_year",
            field=models.IntegerField(null=True),
        ),

        # 3. Copy, while both sets of columns exist.
        migrations.RunPython(forwards, backwards),

        # 4. Drop the text/int pairs.
        migrations.RemoveField(model_name="experience", name="period_start_month"),
        migrations.RemoveField(model_name="experience", name="period_start_year"),
        migrations.RemoveField(model_name="experience", name="period_end_month"),
        migrations.RemoveField(model_name="experience", name="period_end_year"),
        migrations.RemoveField(model_name="education", name="date_start_month"),
        migrations.RemoveField(model_name="education", name="date_start_year"),
        migrations.RemoveField(model_name="education", name="date_end_month"),
        migrations.RemoveField(model_name="education", name="date_end_year"),
        migrations.RemoveField(model_name="certification", name="issued_month"),
        migrations.RemoveField(model_name="certification", name="issued_year"),
        migrations.RemoveField(model_name="award", name="issued_month"),
        migrations.RemoveField(model_name="award", name="issued_year"),

        # 5. Now every row has a value, tighten the ones that are required.
        migrations.AlterField(
            model_name="experience", name="period_start",
            field=models.DateField(help_text="Day is ignored; only month and year are shown."),
        ),
        migrations.AlterField(
            model_name="certification", name="issued",
            field=models.DateField(help_text="Day is ignored; only month and year are shown."),
        ),
        migrations.AlterField(
            model_name="award", name="issued",
            field=models.DateField(help_text="Day is ignored; only month and year are shown."),
        ),
    ]
