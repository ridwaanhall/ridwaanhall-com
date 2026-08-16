from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse

# The privacy policy used to live here as a singleton with ten hard-coded JSON
# columns. It is now a row in apps.legal.LegalDocument, so its admin (and the
# structured widgets it needed) moved to apps/legal/admin.py. What remains here
# is the shared singleton admin base, still used by Profile, HiringProfile and
# OpenToWorkProfile.


class SingletonModelAdmin(admin.ModelAdmin):
    """Admin for a model that only ever holds a single row (pk=1) -- disables
    add/delete and sends the changelist straight to that row's change form,
    so nobody accidentally creates a second one."""

    def has_add_permission(self, request):
        return not self.model.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        obj = self.model.load()
        url = reverse(
            f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_change",
            args=[obj.pk],
        )
        return redirect(url)
