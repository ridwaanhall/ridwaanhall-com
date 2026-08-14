from django.contrib import admin

from apps.core.admin import SingletonModelAdmin
from apps.core.admin_forms import string_list_form
from apps.openhire.models import (
    HiringProfile,
    OpenToWorkProfile,
    PortfolioHighlight,
    Position,
)

HiringProfileAdminForm = string_list_form(
    HiringProfile,
    ["application_process", "company_culture", "requirements_general", "requirements_technical"],
    per_field={
        # Rendered as numbered steps, so order is meaningful.
        "application_process": {"multiline": True, "item_label": "step"},
        "company_culture": {"multiline": True, "item_label": "value"},
        "requirements_general": {"multiline": True, "item_label": "requirement"},
        "requirements_technical": {"multiline": True, "item_label": "requirement"},
    },
)

PositionAdminForm = string_list_form(
    Position,
    ["skills_required", "responsibilities", "benefits"],
    per_field={
        "skills_required": {"item_label": "skill"},
        "responsibilities": {"multiline": True, "item_label": "responsibility"},
        "benefits": {"multiline": True, "item_label": "benefit"},
    },
    # Backs an inline: the FK to HiringProfile must stay out of the form or
    # the admin renders it as a required select and no save can succeed.
    exclude=("hiring_profile",),
)

OpenToWorkProfileAdminForm = string_list_form(
    OpenToWorkProfile,
    [
        "type", "preferred_roles", "skills_highlight", "languages",
        "preferred_locations", "location_types", "remote_locations",
    ],
    per_field={
        "type": {"item_label": "employment type"},
        "preferred_roles": {"item_label": "role"},
        # Free text, not the Skill catalogue: one current value ("REST APIs")
        # has no matching Skill row, so this stays a plain list rather than
        # becoming an M2M like Profile.skills_highlight.
        "skills_highlight": {"item_label": "skill"},
        "languages": {"item_label": "language"},
        "preferred_locations": {"item_label": "location"},
        "location_types": {"item_label": "arrangement"},
        "remote_locations": {"item_label": "location"},
    },
)


class PositionInline(admin.StackedInline):
    model = Position
    form = PositionAdminForm
    extra = 1


@admin.register(HiringProfile)
class HiringProfileAdmin(SingletonModelAdmin):
    form = HiringProfileAdminForm
    inlines = [PositionInline]


class PortfolioHighlightInline(admin.TabularInline):
    model = PortfolioHighlight
    extra = 1


@admin.register(OpenToWorkProfile)
class OpenToWorkProfileAdmin(SingletonModelAdmin):
    form = OpenToWorkProfileAdminForm
    inlines = [PortfolioHighlightInline]
