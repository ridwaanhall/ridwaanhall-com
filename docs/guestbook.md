# Guestbook App

The `apps/guestbook` app provides an interactive chat-like messaging system with OAuth authentication, threaded replies, email notifications, and author/co-author management.

This app is **optional** — it can be fully disabled by setting `GUESTBOOK_PAGE=False` in the environment. When disabled, all related URLs, middleware, and installed apps are skipped.

## File Structure

```
apps/guestbook/
├── views.py               # Guestbook page, send/delete message views
├── models.py              # UserProfile, ChatMessage models
├── signals.py             # Post-save email notification dispatch
├── urls.py                # URL routing (includes allauth)
├── admin.py               # Admin registration
├── apps.py                # AppConfig (imports signals on ready)
├── management/
│   └── commands/
│       ├── manage_authors.py  # Full author/co-author management
│       ├── make_author.py     # Quick author assignment
│       └── check_users.py     # User inspection tool
└── templates/guestbook/
    └── guestbook.html     # Chat UI template
```

## Models (`models.py`)

### `UserProfile`

Extended user profile, auto-created via `post_save` signal on Django's `User` model.

| Field | Type | Description |
|-------|------|-------------|
| `user` | OneToOneField | Link to Django User |
| `is_author` | BooleanField | Site owner flag (used for message styling and deletion rights) |
| `is_co_author` | BooleanField | Co-author flag (max 2 co-authors) |
| `co_author_order` | IntegerField | FIFO ordering for co-authors |
| `created_at` | DateTimeField | Profile creation timestamp |

### `ChatMessage`

| Field | Type | Description |
|-------|------|-------------|
| `user` | ForeignKey(User) | Message author |
| `message` | CharField(500) | Message content (max 500 characters) |
| `reply_to` | ForeignKey(self) | Optional parent message for threading |
| `timestamp` | DateTimeField | Auto-set on creation, indexed, ordered descending |

## Views (`views.py`)

### `UserProfileMixin`

Shared utility mixin providing:

- `mask_email(email)` — masks email addresses (e.g., `r***@gmail.com`)
- `get_user_profile_data(user)` — extracts name, email, and profile image from Google/GitHub OAuth `SocialAccount` data

### `GuestbookView`

**URL**: `/guestbook/`

Renders the guestbook page with the 50 most recent messages. Uses batch profile data caching to avoid N+1 queries. Each message is enriched with:

- Author display name and masked email
- Profile image URL (from OAuth provider)
- `is_author` / `is_co_author` flags for UI styling
- `reply_to` parent message data (if threaded)

### `SendMessageView`

**URL**: `/guestbook/send-message/` (POST, login required)

Handles AJAX message submissions:

- Validates message text (non-empty, max 500 chars)
- Supports `reply_to` for threaded replies
- Timestamps stored in `Asia/Jakarta` timezone
- Returns JSON with the new message data

### `DeleteMessageView`

**URL**: `/guestbook/delete-message/` (POST, login required)

Allows only the **author** (site owner) to delete messages. Regular users cannot delete their own messages.

## Email Notifications (`signals.py`)

A `post_save` signal on `ChatMessage` dispatches emails when a new message is created. The logic uses a flat 3-step approach:

### Step 1: Owner Notification

If the sender's email does **not** match `CONTACT_EMAIL_RECIPIENT`, the site owner receives a notification about the new message.

### Step 2: Sender Confirmation

If the sender's email does **not** match `CONTACT_EMAIL_RECIPIENT`, the sender receives a confirmation email with a copy of their message.

### Step 3: Reply Notification

If the message is a reply (`reply_to` is set), the original message's author receives a notification that someone replied to their message. This is skipped if the replier is the same person as the original poster.

**Self-notification prevention**: When the site owner posts a message, steps 1 and 2 are both skipped to avoid sending emails to yourself.

## Authentication

Authentication is handled entirely by `django-allauth` with two providers:

- **Google OAuth** — requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- **GitHub OAuth** — requires `GH_CLIENT_ID` and `GH_CLIENT_SECRET`

Settings:

- `SOCIALACCOUNT_LOGIN_ON_GET = True` — skips the intermediate "continue?" page
- `ACCOUNT_EMAIL_VERIFICATION = "none"` — no email verification required
- `LOGIN_REDIRECT_URL = "guestbook"` — redirects back to guestbook after login

## Management Commands

### `manage_authors`

Full author and co-author management with rich table output.

```bash
python manage.py manage_authors list
python manage.py manage_authors set-author --user <username>
python manage.py manage_authors add-co-author --user <username>
python manage.py manage_authors remove-co-author --user <username>
python manage.py manage_authors clear-all --force
```

- Maximum 1 author and 2 co-authors
- FIFO removal: adding a 3rd co-author removes the oldest one
- Setting a new author removes the previous one

### `make_author`

Quick author assignment (simpler alternative to `manage_authors`).

```bash
python manage.py make_author <username>
python manage.py make_author <username> --remove
```

### `check_users`

Inspect all users with OAuth details, author status, and login history.

```bash
python manage.py check_users
python manage.py check_users --format json
python manage.py check_users --filter-provider google
python manage.py check_users --authors-only
```

## URL Configuration

```
/guestbook/                → GuestbookView
/guestbook/accounts/       → allauth URLs (Google/GitHub login)
/guestbook/logout/         → LogoutView
/guestbook/send-message/   → SendMessageView
/guestbook/delete-message/ → DeleteMessageView
```

## Feature Toggle

When `GUESTBOOK_PAGE=False`:

- The guestbook URL pattern is not registered
- `allauth` apps are not added to `INSTALLED_APPS`
- `AccountMiddleware` is not added to `MIDDLEWARE`
- OAuth provider settings are skipped
- Template context variable `GUESTBOOK_PAGE` is `False` (hides guestbook links in navigation)
