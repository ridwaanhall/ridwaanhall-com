"""
Helpers for pointing admin forms at the structured JSON editors.

Fields are declared explicitly on a ``ModelForm`` rather than via
``ModelAdmin.formfield_overrides``, because the latter maps a whole field
*class* to one widget: ``BlogPost`` needs different editors for ``content`` and
``tags``, and ``PrivacyPolicy`` mixes three different shapes across its ten
JSON columns.
"""

from django import forms

from apps.core.admin_widgets import StringListField

__all__ = ["string_list_form"]


def string_list_form(model, fields, per_field=None):
    """Build a ModelForm that edits ``fields`` as structured string lists.

    ``per_field`` optionally maps a field name to extra ``StringListField``
    kwargs (``multiline``, ``allows_html``, ``item_label``).
    """
    per_field = per_field or {}
    attrs = {
        name: StringListField(required=False, **per_field.get(name, {}))
        for name in fields
    }
    attrs["Meta"] = type("Meta", (), {"model": model, "fields": "__all__"})
    return type(f"{model.__name__}AdminForm", (forms.ModelForm,), attrs)
