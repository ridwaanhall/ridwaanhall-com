"""
Structured admin editors for the project's ``models.JSONField`` columns.

Django renders a ``JSONField`` as a bare textarea full of raw JSON, which makes
editing a bio paragraph or a blog post body an exercise in hand-writing valid
JSON. These fields keep that exact storage but give the admin a real UI.

Architecture -- one named control, nameless UI
----------------------------------------------
Each widget renders a *single* ``<textarea name="...">`` carrying the canonical
JSON, plus a ``name``-less DOM editor (built by ``adminJsonWidgets.js``) that
parses it once, mutates that parsed model in place, and writes it back with
``JSON.stringify``. It deliberately does NOT render one named input per list
item, because that shape breaks in four separate ways:

* A ``<textarea>``'s *submission* value is CRLF-normalised per the HTML spec
  (``\\n`` -> ``\\r\\n``) and Django does no CR handling anywhere. Reading
  ``.value`` from JS (the LF-preserving API value) sidesteps it entirely.
* ``django/forms/models.py``'s ``construct_instance`` skips a field when it has
  a default, the value is empty, and ``value_omitted_from_data()`` is true. All
  these columns declare ``default=list``/``default=dict``, so with per-item
  inputs (bare key absent from POST) *clearing a list would silently keep the
  old value*. One named control keeps that check correctly false.
* Django's ``inlines.js`` rewrites ``__prefix__`` in ``id``/``name``/``for``
  when cloning a formset row; with a nameless UI there is exactly one name to
  rewrite and no duplicate ids.
* Round-trip fidelity comes for free: a value the editor never touched is never
  re-derived from the DOM, so its exact key set and bytes survive.

Without JavaScript these degrade to precisely the old behaviour (a raw JSON
textarea), so nothing ever becomes uneditable.

Fidelity note
-------------
Production stores these as Postgres ``jsonb``, which normalises object key
order and preserves array order. So dict key order is not ours to control (do
not build a key-reorder affordance -- it would look like it worked on SQLite
and be a silent no-op in production), while list order is real, meaningful, and
must stay editable.
"""

import json

from django import forms
from django.core.exceptions import ValidationError

__all__ = [
    "ContentBlockField",
    "CopyrightCreditsField",
    "GroupedKeyValueField",
    "KeyValueField",
    "StringListField",
]

# Block types the blog renderer (blog/sections/detail_content.html) understands,
# grouped by which keys each one is allowed to carry. Serialization is driven by
# these sets, so a `ul` can never gain a `text` key nor a `p` an `items` key.
TEXT_TYPES = ("p", "h1", "h2", "h3", "h4", "h5", "h6", "code", "pre", "blockquote", "div", "span", "li")
LIST_TYPES = ("ul", "ol")
TABLE_TYPES = ("table",)
ANCHOR_TYPES = ("a",)
IMAGE_TYPES = ("img",)
VOID_TYPES = ("br", "hr")

BLOCK_TYPES = TEXT_TYPES + LIST_TYPES + TABLE_TYPES + ANCHOR_TYPES + IMAGE_TYPES + VOID_TYPES

# Optional keys are only emitted when non-empty, so blocks that never had them
# don't acquire them (and `ul` items keep their class-present/class-absent split).
BLOCK_KEYS = {
    **{t: ("text",) for t in TEXT_TYPES},
    **{t: ("items",) for t in LIST_TYPES},
    "table": ("headers", "rows"),
    "a": ("text", "href", "target"),
    "img": ("src", "alt"),
    **{t: () for t in VOID_TYPES},
}
BLOCK_OPTIONAL_KEYS = {"target"}


def _normalise_newlines(value):
    """Undo any CRLF a browser introduced. The stored data has zero ``\\r``."""
    return value.replace("\r\n", "\n").replace("\r", "\n")


class BaseJSONWidget(forms.Textarea):
    """Renders the JSON source textarea plus a mount point for the JS editor."""

    # Multi-control widgets should be wrapped in a <fieldset> with the label as
    # its <legend> (django/contrib/admin/helpers.py reads this).
    use_fieldset = True

    template_name = "core/widgets/json_widget.html"
    jsonw_kind = ""

    class Media:
        # No jQuery here on purpose: the admin loads jquery.js in DEBUG and
        # jquery.min.js otherwise, and Django's Media merge treats those as
        # different files -- declaring it would double-load jQuery and break
        # jquery.init.js's noConflict(true). The editor is vanilla JS.
        js = ["js/adminJsonWidgets.js"]
        css = {"all": ["css/adminJsonWidgets.css"]}

    def __init__(self, attrs=None, options=None):
        self.options = options or {}
        super().__init__(attrs)

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        context["widget"]["jsonw_kind"] = self.jsonw_kind
        context["widget"]["jsonw_options"] = json.dumps(self.options)
        return context


class BaseJSONField(forms.JSONField):
    """Common behaviour for the structured JSON editors.

    Subclasses ``forms.JSONField`` to keep its parsing errors and its
    ``bound_data`` -> ``InvalidJSONInput`` behaviour, which re-renders whatever
    the editor typed instead of blanking the field when validation fails.
    """

    widget = BaseJSONWidget

    # Zero value for this field's shape. Deliberately NOT called `empty_value`:
    # forms.JSONField subclasses CharField, whose __init__ sets an instance
    # attribute of that name (defaulting to "") and would take precedence.
    empty_factory = dict

    def __init__(self, *args, widget_options=None, **kwargs):
        self.widget_options = widget_options or {}
        super().__init__(*args, **kwargs)
        # The widget is deep-copied per field instance, so configure the copy.
        if isinstance(self.widget, BaseJSONWidget):
            self.widget.options = {**self.widget.options, **self.widget_options}

    def to_python(self, value):
        value = super().to_python(value)
        # forms.JSONField returns None for empty input, but none of these
        # columns are nullable -- saving None raises IntegrityError. Return the
        # shape's zero value instead.
        if value is None or value == "":
            return self.empty_factory()
        return self._coerce(value)

    def _coerce(self, value):
        return value

    def has_changed(self, initial, data):
        """Order-sensitive change detection.

        Not cosmetic: ``django/forms/models.py`` gates ``save_existing()`` and
        new-row creation in formsets behind ``form.has_changed()``, so a false
        negative means an edit to an inline's JSON field is silently dropped.
        Over-reporting merely costs a redundant UPDATE.
        """
        if self.disabled:
            return False
        try:
            parsed = self.to_python(data)
        except ValidationError:
            return True
        # An unsaved extra row in a formset has initial=None while to_python()
        # yields the shape's zero value. Treating those as different would mark
        # every blank "add another" row as changed, so Django would fully
        # validate it and demand its required fields before letting the page
        # save at all.
        if initial is None or initial == "":
            initial = self.empty_factory()
        return json.dumps(initial, sort_keys=False, ensure_ascii=False) != json.dumps(
            parsed, sort_keys=False, ensure_ascii=False
        )


class StringListField(BaseJSONField):
    """A ``list[str]`` edited as repeatable rows with add/remove/reorder."""

    widget = BaseJSONWidget
    empty_factory = list

    def __init__(self, *args, multiline=False, allows_html=False, item_label="item", **kwargs):
        kwargs.setdefault("widget_options", {})
        kwargs["widget_options"] = {
            "multiline": multiline,
            "allowsHtml": allows_html,
            "itemLabel": item_label,
            **kwargs["widget_options"],
        }
        super().__init__(*args, **kwargs)
        self.widget.jsonw_kind = "stringlist"

    def _coerce(self, value):
        if not isinstance(value, list):
            raise ValidationError("Expected a list of text entries.", code="invalid")
        out = []
        for index, item in enumerate(value):
            if not isinstance(item, str):
                raise ValidationError(
                    "Entry %(pos)s must be text, got %(kind)s.",
                    code="invalid",
                    params={"pos": index + 1, "kind": type(item).__name__},
                )
            out.append(_normalise_newlines(item))
        return out


class KeyValueField(BaseJSONField):
    """A flat ``dict[str, str]`` edited as label/description pairs."""

    widget = BaseJSONWidget
    empty_factory = dict

    def __init__(self, *args, key_label="Label", value_label="Description", **kwargs):
        kwargs.setdefault("widget_options", {})
        kwargs["widget_options"] = {
            "keyLabel": key_label,
            "valueLabel": value_label,
            **kwargs["widget_options"],
        }
        super().__init__(*args, **kwargs)
        self.widget.jsonw_kind = "keyvalue"

    def _coerce(self, value):
        return _coerce_flat_mapping(value)


class GroupedKeyValueField(BaseJSONField):
    """A two-level ``dict[str, dict[str, str]]`` edited as named groups."""

    widget = BaseJSONWidget
    empty_factory = dict

    def __init__(self, *args, group_label="Group", key_label="Label",
                 value_label="Description", **kwargs):
        kwargs.setdefault("widget_options", {})
        kwargs["widget_options"] = {
            "groupLabel": group_label,
            "keyLabel": key_label,
            "valueLabel": value_label,
            **kwargs["widget_options"],
        }
        super().__init__(*args, **kwargs)
        self.widget.jsonw_kind = "groupedkeyvalue"

    def _coerce(self, value):
        if not isinstance(value, dict):
            raise ValidationError("Expected a set of named groups.", code="invalid")
        out = {}
        for group, entries in value.items():
            if not isinstance(group, str):
                raise ValidationError("Group names must be text.", code="invalid")
            if not isinstance(entries, dict):
                raise ValidationError(
                    "Group %(group)s must contain label/description pairs.",
                    code="invalid",
                    params={"group": group},
                )
            out[group] = _coerce_flat_mapping(entries, context=group)
        return out


class CopyrightCreditsField(BaseJSONField):
    """The privacy policy's one hybrid field.

    Exactly four keys, all hardcoded in
    ``core/sections/privacy_policy_content.html``: ``owner`` and ``license``
    scalars plus ``third_party_services`` and ``inspiration`` mappings. The
    editor cannot add or remove top-level keys, and optional keys that were
    absent stay absent.
    """

    widget = BaseJSONWidget
    empty_factory = dict

    SCALAR_KEYS = ("owner", "license")
    MAPPING_KEYS = ("third_party_services", "inspiration")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.widget.jsonw_kind = "copyrightcredits"

    def _coerce(self, value):
        if not isinstance(value, dict):
            raise ValidationError("Expected the copyright & credits structure.", code="invalid")
        unknown = set(value) - set(self.SCALAR_KEYS) - set(self.MAPPING_KEYS)
        if unknown:
            raise ValidationError(
                "Unexpected key(s): %(keys)s.",
                code="invalid",
                params={"keys": ", ".join(sorted(unknown))},
            )
        out = {}
        for key in self.SCALAR_KEYS:
            if key in value:
                if not isinstance(value[key], str):
                    raise ValidationError(
                        "%(key)s must be text.", code="invalid", params={"key": key}
                    )
                out[key] = _normalise_newlines(value[key])
        for key in self.MAPPING_KEYS:
            if key in value:
                out[key] = _coerce_flat_mapping(value[key], context=key)
        return out


class ContentBlockField(BaseJSONField):
    """The blog post body: an ordered list of typed content blocks.

    Emits only the keys each block type is allowed to carry, so round-tripping
    an untouched post is byte-stable. Text values pass through verbatim (raw
    HTML rendered with ``|safe``) -- no escaping, no whitespace collapsing.
    """

    widget = BaseJSONWidget
    empty_factory = list

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget_options", {})
        kwargs["widget_options"] = {
            "blockTypes": list(BLOCK_TYPES),
            "textTypes": list(TEXT_TYPES),
            "listTypes": list(LIST_TYPES),
            **kwargs["widget_options"],
        }
        super().__init__(*args, **kwargs)
        self.widget.jsonw_kind = "contentblocks"

    def _coerce(self, value):
        if not isinstance(value, list):
            raise ValidationError("Expected a list of content blocks.", code="invalid")
        return [self._coerce_block(b, i) for i, b in enumerate(value)]

    def _coerce_block(self, block, index):
        pos = index + 1
        if not isinstance(block, dict):
            raise ValidationError(
                "Block %(pos)s must be an object.", code="invalid", params={"pos": pos}
            )
        block_type = block.get("type")
        if not isinstance(block_type, str) or not block_type:
            raise ValidationError(
                "Block %(pos)s is missing a type.", code="invalid", params={"pos": pos}
            )

        out = {"type": block_type}
        if "class" in block:
            css = block["class"]
            if not isinstance(css, str):
                raise ValidationError(
                    "Block %(pos)s has a non-text class.", code="invalid", params={"pos": pos}
                )
            # Deliberately NOT stripped: two real class values contain double
            # spaces that must survive untouched.
            out["class"] = css

        for key in BLOCK_KEYS.get(block_type, ("text",)):
            if key not in block:
                continue
            raw = block[key]
            if key == "items":
                out[key] = self._coerce_items(raw, pos)
            elif key == "headers":
                out[key] = self._coerce_headers(raw, pos)
            elif key == "rows":
                out[key] = self._coerce_rows(raw, block.get("headers"), pos)
            else:
                if not isinstance(raw, str):
                    raise ValidationError(
                        "Block %(pos)s field '%(key)s' must be text.",
                        code="invalid",
                        params={"pos": pos, "key": key},
                    )
                if key in BLOCK_OPTIONAL_KEYS and raw == "":
                    continue
                out[key] = _normalise_newlines(raw)
        return out

    def _coerce_items(self, raw, pos):
        if not isinstance(raw, list):
            raise ValidationError(
                "Block %(pos)s items must be a list.", code="invalid", params={"pos": pos}
            )
        items = []
        for item in raw:
            # Bare strings are supported by the template's else-branch; keep
            # them verbatim rather than rewriting them into dicts.
            if isinstance(item, str):
                items.append(_normalise_newlines(item))
                continue
            if not isinstance(item, dict):
                raise ValidationError(
                    "Block %(pos)s has an invalid list item.", code="invalid", params={"pos": pos}
                )
            entry = {"type": item.get("type", "li")}
            if "text" in item:
                entry["text"] = _normalise_newlines(str(item["text"]))
            # `class` is preserved only when it was already there: 49 of 85
            # stored items omit the key entirely and the template ignores it.
            if "class" in item:
                entry["class"] = item["class"]
            items.append(entry)
        return items

    def _coerce_headers(self, raw, pos):
        if not isinstance(raw, list) or any(not isinstance(h, str) for h in raw):
            raise ValidationError(
                "Block %(pos)s headers must be a list of text.",
                code="invalid",
                params={"pos": pos},
            )
        return list(raw)

    def _coerce_rows(self, raw, headers, pos):
        if not isinstance(raw, list):
            raise ValidationError(
                "Block %(pos)s rows must be a list.", code="invalid", params={"pos": pos}
            )
        width = len(headers) if isinstance(headers, list) else None
        rows = []
        for row_index, row in enumerate(raw, start=1):
            if not isinstance(row, list) or any(not isinstance(c, str) for c in row):
                raise ValidationError(
                    "Block %(pos)s row %(row)s must be a list of text cells.",
                    code="invalid",
                    params={"pos": pos, "row": row_index},
                )
            if width is not None and len(row) != width:
                raise ValidationError(
                    "Block %(pos)s row %(row)s has %(got)s cells but there are "
                    "%(want)s columns.",
                    code="invalid",
                    params={"pos": pos, "row": row_index, "got": len(row), "want": width},
                )
            rows.append(list(row))
        return rows


def _coerce_flat_mapping(value, context=None):
    """Validate a ``dict[str, str]``, preserving order and exact strings."""
    where = f" in {context}" if context else ""
    if not isinstance(value, dict):
        raise ValidationError(
            "Expected label/description pairs%(where)s.",
            code="invalid",
            params={"where": where},
        )
    out = {}
    for key, val in value.items():
        if not isinstance(key, str):
            raise ValidationError(
                "Labels%(where)s must be text.", code="invalid", params={"where": where}
            )
        if not isinstance(val, str):
            raise ValidationError(
                "The value for '%(key)s'%(where)s must be text.",
                code="invalid",
                params={"key": key, "where": where},
            )
        out[key] = _normalise_newlines(val)
    return out


class ChoiceListField(forms.MultipleChoiceField):
    """A JSONField holding a list of strings, constrained to a fixed vocabulary.

    ``OpenToWorkProfile.type`` and ``.location_types`` hold the same words as
    ``Experience.employment_type`` and ``.location_type``, but as lists. They
    were edited through the free-text list widget, so nothing stopped "Fulltime"
    or "remote " drifting in beside the canonical spellings -- and unlike the
    single-value columns, a JSONField cannot carry ``choices``.

    This is a plain ``MultipleChoiceField`` rendered as checkboxes rather than
    another member of the JSON-widget family above: those exist because their
    shapes have no Django equivalent, whereas "pick several from a fixed list"
    is exactly what MultipleChoiceField is. ``clean()`` returns ``list[str]``,
    which is what the column already stores, so no migration is involved.
    """

    widget = forms.CheckboxSelectMultiple

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("required", False)
        super().__init__(*args, **kwargs)

    def prepare_value(self, value):
        # The stored value is already a list; guard against a None column and
        # against a single string, which would otherwise render as one checked
        # box per character.
        if value is None:
            return []
        if isinstance(value, str):
            return [value]
        return list(value)

    def has_changed(self, initial, data):
        # Compare as ordered lists of strings: the column preserves list order
        # (jsonb arrays do), so a reorder is a real change, but None and []
        # are the same empty value and must not count as one.
        return [str(v) for v in (initial or [])] != [str(v) for v in (data or [])]
