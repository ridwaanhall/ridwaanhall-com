"""Carry the old core.PrivacyPolicy singleton into the legal-document model.

The singleton had two prose fields and ten JSON columns of three different
shapes, so the conversion is explicit rather than generic:

* ``overview`` / ``policy_updates`` are prose -> a section with a body.
* Seven columns are flat ``{term: description}`` -> a section whose ``items``
  is that dict verbatim.
* ``data_collected`` and ``cookies`` are ``{group: {term: description}}``
  -> a parent section with one child per group.
* ``copyright_credits`` mixes both: ``owner``/``license`` are plain strings
  while ``third_party_services``/``inspiration`` are nested dicts -> the
  strings become the parent's items and each dict becomes a child.

Reversible: going backwards rebuilds the singleton from the sections, so the
old page can be restored if this turns out wrong.
"""

from django.db import migrations

# field name -> heading, in the order the old template rendered them.
FLAT_SECTIONS = [
    ("data_usage", "How Your Data Is Used"),
    ("third_party_services", "Third-Party Services"),
    ("data_protection", "How Your Data Is Protected"),
    ("user_rights", "Your Rights"),
    ("guestbook_limitations", "Guestbook Limitations"),
    ("email_communications", "Email Communications"),
    ("legal_basis", "Legal Basis for Processing"),
]
NESTED_SECTIONS = [
    ("data_collected", "What Data Is Collected"),
    ("cookies", "Cookies"),
]


def forwards(apps, schema_editor):
    PrivacyPolicy = apps.get_model("core", "PrivacyPolicy")
    LegalDocument = apps.get_model("legal", "LegalDocument")
    LegalSection = apps.get_model("legal", "LegalSection")

    if LegalDocument.objects.filter(slug="privacy-policy").exists():
        return

    policy = PrivacyPolicy.objects.first()
    if policy is None:
        # Fresh install (or a test database): there is nothing to convert, but
        # /privacy-policy/ is in the sitemap and in the footer of every page, so
        # it must not 404. Seed an empty document for the owner to fill in.
        _seed_placeholder(LegalDocument, LegalSection)
        return

    document = LegalDocument.objects.create(
        title="Privacy Policy",
        slug="privacy-policy",
        document_type="privacy",
        summary=(policy.overview or "").strip(),
        is_published=True,
        sort_order=0,
    )

    order = 0

    def add(heading, body="", items=None, parent=None):
        nonlocal order
        order += 1
        return LegalSection.objects.create(
            document=document, parent=parent, heading=heading,
            body=body or "", items=items or {}, order=order,
        )

    if policy.overview:
        add("Overview", body=policy.overview)

    for field, heading in NESTED_SECTIONS:
        groups = getattr(policy, field, None) or {}
        if not groups:
            continue
        parent = add(heading)
        for group_name, entries in groups.items():
            if isinstance(entries, dict):
                add(_heading_for(group_name), items=entries, parent=parent)
            else:
                # A stray string where a group was expected: keep it rather
                # than dropping content on the floor.
                add(_heading_for(group_name), body=str(entries), parent=parent)

    for field, heading in FLAT_SECTIONS:
        entries = getattr(policy, field, None) or {}
        if entries:
            add(heading, items=entries)

    credits = policy.copyright_credits or {}
    if credits:
        plain = {k: v for k, v in credits.items() if not isinstance(v, dict)}
        parent = add("Copyright & Credits", items=plain)
        for key, value in credits.items():
            if isinstance(value, dict) and value:
                add(_heading_for(key), items=value, parent=parent)

    if policy.policy_updates:
        add("Policy Updates", body=policy.policy_updates)


PLACEHOLDER_HEADINGS = [
    "Overview",
    "What Data Is Collected",
    "How Your Data Is Used",
    "Third-Party Services",
    "How Your Data Is Protected",
    "Your Rights",
    "Cookies",
    "Policy Updates",
]


def _seed_placeholder(LegalDocument, LegalSection):
    document = LegalDocument.objects.create(
        title="Privacy Policy",
        slug="privacy-policy",
        document_type="privacy",
        summary="",
        is_published=True,
        sort_order=0,
    )
    for order, heading in enumerate(PLACEHOLDER_HEADINGS, start=1):
        LegalSection.objects.create(
            document=document, heading=heading, body="", items={}, order=order,
        )


def backwards(apps, schema_editor):
    """Rebuild the singleton from the sections and drop the document."""
    PrivacyPolicy = apps.get_model("core", "PrivacyPolicy")
    LegalDocument = apps.get_model("legal", "LegalDocument")

    document = LegalDocument.objects.filter(slug="privacy-policy").first()
    if document is None:
        return

    policy, _ = PrivacyPolicy.objects.get_or_create(pk=1)
    heading_to_field = {heading: field for field, heading in FLAT_SECTIONS + NESTED_SECTIONS}

    for section in document.sections.filter(parent__isnull=True):
        if section.heading == "Overview":
            policy.overview = section.body
        elif section.heading == "Policy Updates":
            policy.policy_updates = section.body
        elif section.heading == "Copyright & Credits":
            restored = dict(section.items or {})
            for child in section.children.all():
                restored[_key_for(child.heading)] = child.items
            policy.copyright_credits = restored
        elif section.heading in heading_to_field:
            field = heading_to_field[section.heading]
            children = list(section.children.all())
            if children:
                setattr(policy, field, {
                    _key_for(child.heading): child.items for child in children
                })
            else:
                setattr(policy, field, section.items)

    policy.save()
    document.delete()


# Group keys become section headings verbatim, so the reverse migration can
# turn them back into keys exactly. Most are already display-ready
# ("Contact Form", "Essential Cookies"); only copyright_credits used snake_case,
# so those two get an explicit two-way mapping rather than a lossy
# humanise/de-humanise pair.
DISPLAY_NAMES = {
    "third_party_services": "Third-Party Services",
    "inspiration": "Inspiration",
}
REVERSE_NAMES = {display: key for key, display in DISPLAY_NAMES.items()}


def _heading_for(key):
    return DISPLAY_NAMES.get(key, key)


def _key_for(heading):
    return REVERSE_NAMES.get(heading, heading)


class Migration(migrations.Migration):
    dependencies = [
        ("legal", "0001_initial"),
        ("core", "0002_contentversion"),
    ]

    operations = [migrations.RunPython(forwards, backwards)]
