"""
Merge guestbook history in from another Postgres database.

Written for the Neon -> Supabase cutover: the live site kept writing to the old
database for a while after the initial copy, so a handful of users and messages
only ever existed there. It is a *merge*, not a restore --

* rows already present are left alone, so it is safe to re-run;
* rows created on the target since the cutover are never touched;
* primary keys are reassigned, because the two databases independently issued
  the same ids to different rows.

Matching uses a natural key rather than the pk, and tolerates sub-second
timestamp drift, since the original copy went through JSON and lost precision.

    manage.py sync_guestbook --source-dsn "postgres://..." --dry-run
    manage.py sync_guestbook --source-dsn "postgres://..."
"""

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models.signals import post_save

from apps.guestbook.models import ChatMessage, UserProfile


def _message_key(username, text, timestamp):
    """Identity of a message across the two databases.

    The pk is useless here (both sides reused the same numbers for different
    rows) and the timestamp is only reliable to the second, so fall back to
    who said what, when.
    """
    return username, (text or "").strip(), timestamp.replace(microsecond=0)


class Command(BaseCommand):
    help = "Merge guestbook users and messages in from another Postgres database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source-dsn", required=True,
            help="Read-only connection string for the database to copy from.",
        )
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Report what would be copied without writing anything.",
        )

    def handle(self, *args, **options):
        try:
            import psycopg2
            import psycopg2.extras
        except ImportError as exc:  # pragma: no cover - psycopg2 is a hard dep
            raise CommandError("psycopg2 is required to read the source database.") from exc

        dry_run = options["dry_run"]
        source = psycopg2.connect(options["source_dsn"])
        try:
            with source.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
                users = self._fetch_users(cursor)
                socials = self._fetch_socials(cursor)
                messages = self._fetch_messages(cursor)
        finally:
            source.close()

        missing_users = [u for u in users if not User.objects.filter(username=u["username"]).exists()]
        existing_keys = {
            _message_key(m.user.username, m.message, m.timestamp)
            for m in ChatMessage.objects.select_related("user")
        }
        missing_messages = [
            m for m in messages
            if _message_key(m["username"], m["message"], m["timestamp"]) not in existing_keys
        ]

        self.stdout.write(f"source: {len(users)} users, {len(messages)} messages")
        self.stdout.write(f"target: {User.objects.count()} users, {ChatMessage.objects.count()} messages")
        self.stdout.write(f"to copy: {len(missing_users)} user(s), {len(missing_messages)} message(s)")
        for u in missing_users:
            self.stdout.write(f"  + user {u['username']}")
        for m in missing_messages:
            self.stdout.write(f"  + [{m['timestamp']:%Y-%m-%d %H:%M}] {m['username']}: {m['message'][:60]!r}")

        if dry_run:
            self.stdout.write(self.style.WARNING("dry run -- nothing written"))
            return
        if not missing_users and not missing_messages:
            self.stdout.write(self.style.SUCCESS("already in sync"))
            return

        with transaction.atomic():
            self._disable_notifications()
            try:
                created_users = self._copy_users(missing_users, socials)
                created_messages = self._copy_messages(missing_messages)
            finally:
                self._enable_notifications()
            self._reset_sequences()

        self.stdout.write(self.style.SUCCESS(
            f"copied {created_users} user(s) and {created_messages} message(s)"
        ))

    # -- reading the source ---------------------------------------------

    def _fetch_users(self, cursor):
        cursor.execute(
            """
            SELECT u.id, u.username, u.email, u.password, u.first_name, u.last_name,
                   u.is_active, u.is_staff, u.is_superuser, u.date_joined, u.last_login,
                   p.is_author, p.is_co_author, p.co_author_order
            FROM auth_user u
            LEFT JOIN guestbook_userprofile p ON p.user_id = u.id
            ORDER BY u.id
            """
        )
        return [dict(row) for row in cursor.fetchall()]

    def _fetch_socials(self, cursor):
        cursor.execute(
            """
            SELECT u.username, a.provider, a.uid, a.extra_data, a.date_joined, a.last_login
            FROM socialaccount_socialaccount a
            JOIN auth_user u ON u.id = a.user_id
            """
        )
        socials = {}
        for row in cursor.fetchall():
            socials.setdefault(row["username"], []).append(dict(row))
        return socials

    def _fetch_messages(self, cursor):
        cursor.execute(
            """
            SELECT m.id, u.username, m.message, m.timestamp, m.is_pinned, m.pinned_at,
                   m.reply_to_id, ru.username AS reply_to_username,
                   r.message AS reply_to_message, r.timestamp AS reply_to_timestamp
            FROM guestbook_chatmessage m
            JOIN auth_user u ON u.id = m.user_id
            LEFT JOIN guestbook_chatmessage r ON r.id = m.reply_to_id
            LEFT JOIN auth_user ru ON ru.id = r.user_id
            ORDER BY m.timestamp
            """
        )
        return [dict(row) for row in cursor.fetchall()]

    # -- writing --------------------------------------------------------

    def _copy_users(self, missing_users, socials):
        from allauth.socialaccount.models import SocialAccount

        for row in missing_users:
            user = User.objects.create(
                username=row["username"], email=row["email"] or "",
                password=row["password"] or "", first_name=row["first_name"] or "",
                last_name=row["last_name"] or "", is_active=row["is_active"],
                is_staff=row["is_staff"], is_superuser=row["is_superuser"],
                date_joined=row["date_joined"], last_login=row["last_login"],
            )
            # The post_save signal already created a profile; carry over its
            # author/co-author state rather than leaving the defaults.
            UserProfile.objects.filter(user=user).update(
                is_author=bool(row["is_author"]),
                is_co_author=bool(row["is_co_author"]),
                co_author_order=row["co_author_order"] or 0,
            )
            # Without the social account, the next OAuth login would create a
            # brand new user instead of matching this one.
            for social in socials.get(row["username"], []):
                SocialAccount.objects.get_or_create(
                    provider=social["provider"], uid=social["uid"],
                    defaults={
                        "user": user, "extra_data": social["extra_data"] or {},
                        "date_joined": social["date_joined"],
                        "last_login": social["last_login"],
                    },
                )
        return len(missing_users)

    def _copy_messages(self, missing_messages):
        users = {u.username: u for u in User.objects.all()}
        created = 0
        for row in missing_messages:
            author = users.get(row["username"])
            if author is None:
                self.stderr.write(self.style.WARNING(
                    f"skipping message from unknown user {row['username']!r}"
                ))
                continue
            reply_to = None
            if row["reply_to_id"] and row["reply_to_username"]:
                # Resolve the parent by natural key -- source pks mean nothing here.
                reply_to = ChatMessage.objects.filter(
                    user__username=row["reply_to_username"],
                    message=row["reply_to_message"],
                ).order_by("timestamp").first()
            ChatMessage.objects.create(
                user=author, message=row["message"], timestamp=row["timestamp"],
                reply_to=reply_to, is_pinned=row["is_pinned"], pinned_at=row["pinned_at"],
            )
            created += 1
        return created

    # -- side effects ---------------------------------------------------

    def _disable_notifications(self):
        """Silence the new-message emails.

        Copied messages are historical; letting the post_save receiver run
        would email their authors, the site owner, and anyone they replied to
        about conversations that happened days ago.
        """
        from apps.guestbook.signals import send_guestbook_email_notification

        post_save.disconnect(send_guestbook_email_notification, sender=ChatMessage)

    def _enable_notifications(self):
        from apps.guestbook.signals import send_guestbook_email_notification

        post_save.connect(send_guestbook_email_notification, sender=ChatMessage)

    def _reset_sequences(self):
        """Explicit-pk-free inserts still leave sequences behind on Postgres if
        anything earlier in this database was loaded with explicit ids."""
        from django.apps import apps as django_apps
        from django.core.management.color import no_style
        from django.db import connection

        if connection.vendor != "postgresql":
            return
        models = [User, ChatMessage, UserProfile]
        models += list(django_apps.get_app_config("socialaccount").get_models())
        statements = connection.ops.sequence_reset_sql(no_style(), models)
        with connection.cursor() as cursor:
            for statement in statements:
                cursor.execute(statement)
