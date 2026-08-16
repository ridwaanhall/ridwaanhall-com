"""Seed a Terms & Conditions document describing how this site actually works.

The wording is drawn from the site's real behaviour rather than boilerplate:
sign-in is Google/GitHub OAuth only (no password is ever stored here), visitors
can post guestbook messages and comment on blog posts and projects, the author
and co-authors can delete or pin any of it, and the project's own licence is
Apache 2.0 as recorded in the privacy policy's credits.

This is a starting point for the site owner to edit in the admin, not legal
advice. Everything here is editable without a migration.
"""

from django.db import migrations

SUMMARY = (
    "The terms you agree to by using this site, posting in the guestbook, or "
    "commenting on a post or project."
)

SECTIONS = [
    {
        "heading": "Acceptance",
        "body": (
            "By browsing this site, signing in, or posting a guestbook message or "
            "comment, you agree to these terms. If you do not agree with them, "
            "please do not sign in or post."
        ),
    },
    {
        "heading": "About this site",
        "body": (
            "This is a personal portfolio and writing site. It is run by one person, "
            "not a company, and is provided as-is for reading, reference, and "
            "conversation. Nothing published here is professional advice."
        ),
    },
    {
        "heading": "Accounts and signing in",
        "body": (
            "Signing in is handled entirely by Google or GitHub. No password for this "
            "site is ever created, sent, or stored here."
        ),
        "items": {
            "What is stored": "The account name, email address, and avatar your provider shares, so your posts can be attributed to you.",
            "Your responsibility": "Keep your Google or GitHub account secure. Anything posted from your account is treated as posted by you.",
            "Signing out": "You can sign out at any time from the guestbook or any comment section.",
            "Removal": "You may ask for your account and everything posted from it to be deleted; see the privacy policy for how to ask.",
        },
    },
    {
        "heading": "Content you post",
        "body": (
            "Guestbook messages and comments on blog posts and projects are written by "
            "visitors, not by the site owner, and appear publicly as soon as they are "
            "posted."
        ),
        "items": {
            "You keep ownership": "Whatever you write stays yours.",
            "You grant permission to display it": "By posting, you allow it to be shown on this site alongside your display name and avatar, for as long as the post remains.",
            "You are responsible for it": "Only post what you have the right to post, and do not post anything you would not want shown publicly.",
            "It is public": "Posts are visible to anyone visiting the page and may be read by search engines.",
        },
    },
    {
        "heading": "Acceptable use",
        "body": "Please do not use the guestbook, the comments, or the contact form to:",
        "items": {
            "Harass or abuse": "Threats, harassment, hate speech, or targeting any individual.",
            "Post unlawful content": "Anything illegal, or that infringes someone else's rights.",
            "Spam or advertise": "Bulk, repetitive, or promotional posting, including link spam.",
            "Impersonate": "Passing yourself off as someone else, or misrepresenting who you are.",
            "Attack the site": "Attempting to break, overload, probe, or gain unauthorised access to the site or its data.",
            "Scrape at scale": "Automated bulk collection of content or personal data from these pages.",
        },
    },
    {
        "heading": "Moderation and removal",
        "body": (
            "Posts are published immediately and are not reviewed in advance. That "
            "means content may appear briefly before it is seen."
        ),
        "items": {
            "You can delete your own": "You may delete any guestbook message or comment you posted.",
            "The site owner can delete anything": "The owner and co-authors may remove any post, with or without explanation, and may highlight or pin selected messages.",
            "Deleted comments leave a placeholder": "So that replies underneath them still make sense, a deleted comment is shown as removed rather than vanishing.",
            "Accounts may be blocked": "Repeated breaches of these terms may result in an account being blocked from posting.",
        },
    },
    {
        "heading": "The site's own content",
        "body": (
            "Articles, project write-ups, images, and design on this site belong to the "
            "site owner unless stated otherwise. The underlying source code is released "
            "under the Apache License 2.0."
        ),
        "items": {
            "Quoting and linking": "You are welcome to quote a short extract with clear attribution and a link back.",
            "Republishing": "Please ask before reproducing a whole article or write-up elsewhere.",
            "Code": "Use of the source code is governed by its Apache 2.0 licence, not by these terms.",
            "Trademarks and logos": "Third-party names and logos shown here belong to their respective owners.",
        },
    },
    {
        "heading": "Third-party services and links",
        "body": (
            "This site relies on outside services to work, and links out to other sites. "
            "Those services and sites have their own terms and privacy policies, and are "
            "outside the site owner's control. The privacy policy lists the services in use."
        ),
    },
    {
        "heading": "Availability",
        "body": (
            "The site is offered as-is and as-available, with no guarantee that it will "
            "be uninterrupted, error-free, or preserved indefinitely. It may change, move, "
            "or be taken down at any time, and posted content may be removed along with it. "
            "Keep your own copy of anything you would not want to lose."
        ),
    },
    {
        "heading": "Liability",
        "body": (
            "To the fullest extent the law allows, the site owner is not liable for any "
            "loss or damage arising from use of this site, from content posted by "
            "visitors, or from any third-party service the site depends on. Nothing here "
            "limits liability where the law does not permit it to be limited."
        ),
    },
    {
        "heading": "Changes to these terms",
        "body": (
            "These terms may be updated as the site changes. The date shown at the top of "
            "this page is when they were last revised, and continuing to use the site "
            "after a change means you accept the updated terms."
        ),
    },
    {
        "heading": "Governing law",
        "body": (
            "These terms are governed by the laws of the Republic of Indonesia, where the "
            "site owner is based."
        ),
    },
    {
        "heading": "Contact",
        "body": (
            "Questions about these terms, requests to remove content, or anything else can "
            "be sent through the contact page on this site."
        ),
    },
]


def forwards(apps, schema_editor):
    LegalDocument = apps.get_model("legal", "LegalDocument")
    LegalSection = apps.get_model("legal", "LegalSection")

    if LegalDocument.objects.filter(slug="terms-and-conditions").exists():
        return

    document = LegalDocument.objects.create(
        title="Terms & Conditions",
        slug="terms-and-conditions",
        document_type="terms",
        summary=SUMMARY,
        is_published=True,
        sort_order=1,
    )
    for index, section in enumerate(SECTIONS, start=1):
        LegalSection.objects.create(
            document=document,
            heading=section["heading"],
            body=section.get("body", ""),
            items=section.get("items", {}),
            order=index,
        )


def backwards(apps, schema_editor):
    LegalDocument = apps.get_model("legal", "LegalDocument")
    LegalDocument.objects.filter(slug="terms-and-conditions").delete()


class Migration(migrations.Migration):
    dependencies = [("legal", "0002_migrate_privacy_policy")]

    operations = [migrations.RunPython(forwards, backwards)]
