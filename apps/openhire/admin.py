from django.contrib import admin

from apps.core.admin import SingletonModelAdmin
from apps.openhire.models import (
    HiringProfile,
    OpenToWorkProfile,
    PortfolioHighlight,
    Position,
)


class PositionInline(admin.StackedInline):
    model = Position
    extra = 1


@admin.register(HiringProfile)
class HiringProfileAdmin(SingletonModelAdmin):
    inlines = [PositionInline]


class PortfolioHighlightInline(admin.TabularInline):
    model = PortfolioHighlight
    extra = 1


@admin.register(OpenToWorkProfile)
class OpenToWorkProfileAdmin(SingletonModelAdmin):
    inlines = [PortfolioHighlightInline]
