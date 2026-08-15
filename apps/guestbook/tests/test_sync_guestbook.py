"""Merging guestbook history in from the old Neon database.

These are offline tests: the source Postgres connection is stubbed, so the real
merge logic (diffing, pk reassignment, reply resolution, notification
suppression) runs with no credentials and no network.

The behaviours pinned here are the ones that made the real cutover awkward --
both databases had independently issued the same primary keys, the original
copy lost sub-second timestamp precision, and the live site kept writing to
each side after the other had been snapshotted.
"""

import datetime
from io import StringIO
from unittest import mock

from allauth.socialaccount.models import SocialAccount
from django.contrib.auth.models import User
from django.core.management import call_command
from django.db.models.signals import post_save
from django.test import TestCase

from apps.guestbook.models import ChatMessage, UserProfile
from apps.guestbook.signals import send_guestbook_email_notification

UTC = datetime.UTC


def at(day, hour, minute, second=0, microsecond=0):
    return datetime.datetime(2026, 8, day, hour, minute, second, microsecond, tzinfo=UTC)


def source_user(pk, username, **overrides):
    """One row as the command's users query returns it (user LEFT JOIN profile)."""
    row = {
        "id": pk, "username": username, "email": f"{username}@example.com",
        "password": f"pbkdf2_sha256$stub${username}", "first_name": "", "last_name": "",
        "is_active": True, "is_staff": False, "is_superuser": False,
        "date_joined": at(1, 9, 0), "last_login": None,
        "is_author": False, "is_co_author": False, "co_author_order": 0,
    }
    row.update(overrides)
    return row


def source_message(pk, username, message, timestamp, **overrides):
    row = {
        "id": pk, "username": username, "message": message, "timestamp": timestamp,
        "is_pinned": False, "pinned_at": None, "reply_to_id": None,
        "reply_to_username": None, "reply_to_message": None, "reply_to_timestamp": None,
    }
    row.update(overrides)
    return row


def source_social(username, uid, provider="github"):
    return {
        "username": username, "provider": provider, "uid": uid,
        "extra_data": {"login": username}, "date_joined": at(1, 9, 0), "last_login": None,
    }


class FakeCursor:
    """Answers the command's three SELECTs from canned rows."""

    def __init__(self, source):
        self.source = source
        self.rows = []

    def __enter__(self):
        return self

    def __exit__(self, *exc_info):
        return False

    def execute(self, sql, params=None):
        if "FROM socialaccount_socialaccount a" in sql:
            self.rows = self.source["socials"]
        elif "FROM guestbook_chatmessage m" in sql:
            self.rows = self.source["messages"]
        elif "FROM auth_user u" in sql:
            self.rows = self.source["users"]
        else:  # pragma: no cover - guards against a query going unstubbed
            raise AssertionError(f"unexpected query: {sql}")

    def fetchall(self):
        return self.rows


class FakeConnection:
    def __init__(self, source):
        self.source = source
        self.closed = False

    def cursor(self, **kwargs):
        return FakeCursor(self.source)

    def close(self):
        self.closed = True


class SyncGuestbookTest(TestCase):
    def sync(self, users=(), socials=(), messages=(), **options):
        """Run the command against a stubbed source, returning its output."""
        source = {
            "users": list(users),
            "socials": list(socials),
            "messages": list(messages),
        }
        self.connection = FakeConnection(source)
        out = StringIO()
        with mock.patch("psycopg2.connect", return_value=self.connection), \
                mock.patch.multiple(
                    "apps.guestbook.signals",
                    send_guestbook_notification=mock.DEFAULT,
                    send_guestbook_user_confirmation=mock.DEFAULT,
                    send_guestbook_reply_notification=mock.DEFAULT,
                ) as mails:
            call_command(
                "sync_guestbook", source_dsn="postgres://stub",
                stdout=out, stderr=out, **options,
            )
        self.mails = mails
        return out.getvalue()

    @staticmethod
    def local_user(username, **overrides):
        return User.objects.create(
            username=username, email=f"{username}@example.com", **overrides
        )

    # -- copying users ---------------------------------------------------

    def test_copies_a_user_that_only_exists_in_the_source(self):
        self.sync(users=[source_user(34, "iYonnzxz")])

        user = User.objects.get(username="iYonnzxz")
        self.assertEqual(user.email, "iYonnzxz@example.com")
        self.assertEqual(user.date_joined, at(1, 9, 0))
        # The hash carries over, so an existing password keeps working.
        self.assertEqual(user.password, "pbkdf2_sha256$stub$iYonnzxz")

    def test_carries_over_the_social_account_so_the_next_login_matches(self):
        """Without this the user's next OAuth sign-in creates a second account
        instead of recognising the one just copied."""
        self.sync(
            users=[source_user(34, "iYonnzxz")],
            socials=[source_social("iYonnzxz", "165852594")],
        )

        social = SocialAccount.objects.get(provider="github", uid="165852594")
        self.assertEqual(social.user.username, "iYonnzxz")
        self.assertEqual(social.extra_data, {"login": "iYonnzxz"})

    def test_carries_over_author_flags_without_duplicating_the_profile(self):
        """A profile is created by post_save the moment the user is; the command
        has to update that one rather than add a second."""
        self.sync(users=[source_user(2, "helper", is_co_author=True, co_author_order=3)])

        user = User.objects.get(username="helper")
        self.assertEqual(UserProfile.objects.filter(user=user).count(), 1)
        profile = UserProfile.objects.get(user=user)
        self.assertTrue(profile.is_co_author)
        self.assertEqual(profile.co_author_order, 3)

    def test_leaves_a_user_that_already_exists_untouched(self):
        existing = self.local_user("ridwahal", first_name="Local")
        self.sync(users=[source_user(1, "ridwahal", first_name="Stale")])

        existing.refresh_from_db()
        self.assertEqual(existing.first_name, "Local")
        self.assertEqual(User.objects.filter(username="ridwahal").count(), 1)

    # -- copying messages ------------------------------------------------

    def test_copies_messages_missing_from_the_target(self):
        self.local_user("iYonnzxz")
        self.sync(
            users=[source_user(34, "iYonnzxz")],
            messages=[
                source_message(60, "iYonnzxz", "Web api mlbb nya doe", at(11, 12, 58, 25)),
                source_message(61, "iYonnzxz", "Down kah*", at(11, 12, 58, 36)),
            ],
        )

        self.assertEqual(
            list(ChatMessage.objects.order_by("timestamp").values_list("message", flat=True)),
            ["Web api mlbb nya doe", "Down kah*"],
        )
        # Timestamps are copied verbatim, not stamped with "now".
        self.assertEqual(ChatMessage.objects.earliest("timestamp").timestamp, at(11, 12, 58, 25))

    def test_running_twice_copies_nothing_the_second_time(self):
        args = {
            "users": [source_user(34, "iYonnzxz")],
            "messages": [source_message(60, "iYonnzxz", "hello", at(11, 12, 58))],
        }
        self.sync(**args)
        output = self.sync(**args)

        self.assertEqual(ChatMessage.objects.count(), 1)
        self.assertEqual(User.objects.count(), 1)
        self.assertIn("already in sync", output)

    def test_keeps_rows_created_on_the_target_after_the_cutover(self):
        """The source is a stale snapshot -- it must never be treated as the
        authority on what should exist."""
        author = self.local_user("ridwahal")
        ChatMessage.objects.create(user=author, message="pp", timestamp=at(12, 8, 0))

        self.sync(
            users=[source_user(1, "ridwahal")],
            messages=[source_message(60, "ridwahal", "older", at(11, 12, 58))],
        )

        self.assertEqual(
            set(ChatMessage.objects.values_list("message", flat=True)), {"pp", "older"}
        )

    def test_reassigns_primary_keys_instead_of_reusing_the_sources(self):
        """Both databases handed out the same ids to different rows, so copying
        a source pk across would overwrite an unrelated message."""
        author = self.local_user("ridwahal")
        ChatMessage.objects.create(pk=60, user=author, message="pp", timestamp=at(12, 8, 0))

        self.sync(
            users=[source_user(1, "ridwahal")],
            messages=[source_message(60, "ridwahal", "different message", at(11, 12, 58))],
        )

        self.assertEqual(ChatMessage.objects.get(pk=60).message, "pp")
        copied = ChatMessage.objects.get(message="different message")
        self.assertNotEqual(copied.pk, 60)

    def test_sub_second_timestamp_drift_does_not_duplicate_a_message(self):
        """The first copy went through JSON and truncated microseconds, so the
        two sides disagree below the second."""
        author = self.local_user("iYonnzxz")
        ChatMessage.objects.create(
            user=author, message="Down kah*", timestamp=at(11, 12, 58, 36, 431000)
        )

        self.sync(
            users=[source_user(34, "iYonnzxz")],
            messages=[source_message(61, "iYonnzxz", "Down kah*", at(11, 12, 58, 36, 431379))],
        )

        self.assertEqual(ChatMessage.objects.count(), 1)

    def test_resolves_replies_by_natural_key_not_source_pk(self):
        """The parent already lives on the target under a completely different
        id, so following reply_to_id would attach the reply to the wrong row."""
        alice = self.local_user("alice")
        parent = ChatMessage.objects.create(
            pk=99, user=alice, message="hello", timestamp=at(10, 9, 0)
        )

        self.sync(
            users=[source_user(1, "alice"), source_user(2, "bob")],
            messages=[
                source_message(10, "alice", "hello", at(10, 9, 0)),
                source_message(
                    11, "bob", "hi back", at(10, 9, 5),
                    reply_to_id=10, reply_to_username="alice",
                    reply_to_message="hello", reply_to_timestamp=at(10, 9, 0),
                ),
            ],
        )

        reply = ChatMessage.objects.get(message="hi back")
        self.assertEqual(reply.reply_to_id, parent.pk)

    def test_skips_a_message_whose_author_cannot_be_resolved(self):
        output = self.sync(
            messages=[source_message(1, "ghost", "orphan", at(10, 9, 0))],
        )

        self.assertEqual(ChatMessage.objects.count(), 0)
        self.assertIn("ghost", output)

    def test_preserves_pin_state(self):
        self.local_user("ridwahal")
        self.sync(
            users=[source_user(1, "ridwahal")],
            messages=[source_message(
                5, "ridwahal", "pinned one", at(10, 9, 0),
                is_pinned=True, pinned_at=at(10, 10, 0),
            )],
        )

        message = ChatMessage.objects.get(message="pinned one")
        self.assertTrue(message.is_pinned)
        self.assertEqual(message.pinned_at, at(10, 10, 0))

    # -- side effects ----------------------------------------------------

    def test_does_not_email_anyone_about_copied_messages(self):
        """These conversations happened days ago; notifying their authors, the
        site owner, and everyone they replied to would be spam."""
        self.sync(
            users=[source_user(1, "alice"), source_user(2, "bob")],
            messages=[
                source_message(10, "alice", "hello", at(10, 9, 0)),
                source_message(
                    11, "bob", "hi back", at(10, 9, 5),
                    reply_to_id=10, reply_to_username="alice",
                    reply_to_message="hello", reply_to_timestamp=at(10, 9, 0),
                ),
            ],
        )

        for name, sender in self.mails.items():
            self.assertEqual(sender.call_count, 0, f"{name} should not fire for copied messages")

    def test_a_normal_message_still_notifies(self):
        """Positive control: proves the assertion above isn't vacuous, i.e. the
        receiver really would have fired had the command not silenced it."""
        author = self.local_user("alice")
        with mock.patch("apps.guestbook.signals.send_guestbook_notification") as notify:
            ChatMessage.objects.create(user=author, message="live one", timestamp=at(10, 9, 0))

        self.assertEqual(notify.call_count, 1)

    def test_reconnects_the_notification_signal_afterwards(self):
        self.sync(users=[source_user(1, "alice")])

        # disconnect() reports whether it actually found the receiver.
        was_connected = post_save.disconnect(send_guestbook_email_notification, sender=ChatMessage)
        post_save.connect(send_guestbook_email_notification, sender=ChatMessage)
        self.assertTrue(was_connected, "notifications must be restored after the run")

    def test_reconnects_the_notification_signal_even_when_the_copy_fails(self):
        target = "apps.guestbook.management.commands.sync_guestbook.Command._copy_messages"
        with mock.patch(target, side_effect=RuntimeError("boom")):
            with self.assertRaises(RuntimeError):
                self.sync(users=[source_user(1, "alice")])

        was_connected = post_save.disconnect(send_guestbook_email_notification, sender=ChatMessage)
        post_save.connect(send_guestbook_email_notification, sender=ChatMessage)
        self.assertTrue(was_connected)
        # The failed run is rolled back whole -- no half-copied user survives.
        self.assertFalse(User.objects.filter(username="alice").exists())

    def test_closes_the_source_connection(self):
        self.sync(users=[source_user(1, "alice")])
        self.assertTrue(self.connection.closed)

    # -- dry run ---------------------------------------------------------

    def test_dry_run_reports_without_writing(self):
        output = self.sync(
            users=[source_user(34, "iYonnzxz")],
            messages=[source_message(60, "iYonnzxz", "Web api mlbb nya doe", at(11, 12, 58))],
            dry_run=True,
        )

        self.assertEqual(User.objects.count(), 0)
        self.assertEqual(ChatMessage.objects.count(), 0)
        self.assertIn("1 user(s), 1 message(s)", output)
        self.assertIn("iYonnzxz", output)
        self.assertIn("nothing written", output)
