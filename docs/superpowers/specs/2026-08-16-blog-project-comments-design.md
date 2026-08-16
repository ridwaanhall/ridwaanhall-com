# Comments for blogs and projects

**Status:** approved 2026-08-16
**Scope:** build and validate against local SQLite. Supabase is migrated only
once the local implementation is confirmed clean — that is a deliberate,
separate follow-up step, not part of this change.

## Problem

Blog posts and projects are read-only. Visitors have no way to respond to a
post except through the guestbook, which is a single global conversation and
carries no link back to what it is about.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Model layout | One `Comment` in a new `apps/comments`, generic FK to the target | One model, form, view, admin and template pair serving both targets, instead of duplicating all of it per app. Cost is no DB-level FK to the target, which is acceptable. |
| Threading | One level | Mirrors `ChatMessage.reply_to`. A reply to a reply re-parents to the top-level comment, so depth cannot exceed one. |
| Moderation | Publish immediately | Commenter deletes their own; author/co-author deletes any, reusing the guestbook's existing permission field. |
| Submission | Plain POST + redirect (PRG) | See "Why not AJAX" below. |
| Auth | Existing allauth Google/GitHub | Same accounts as the guestbook. No new sign-up path. |

## Why not AJAX

The guestbook renders every message **twice** — once server-side in
`sections/guestbook_messages.html`, once as a hand-built JS template literal in
`guestbook.html` — and CLAUDE.md records that any change to how a message
displays has to be made in both or new messages render inconsistently until a
reload. That duplication is the direct cost of posting over AJAX.

Post/Redirect/Get avoids it: one template renders a comment, in one place.
Django messages land naturally on the redirect, the form works without
JavaScript, and there is no second copy of the markup to keep in sync.

## Interaction with the content cache

Comments are **not** part of the cached blog/project payloads and are **not**
added to `MODEL_NAMESPACES` in `apps/core/cache.py`.

This is load-bearing. Those payloads are invalidated per namespace by
`post_save`/`post_delete`; if `Comment` were mapped into `blog` or `project`,
every single comment posted would orphan that namespace's cache and force a
full rebuild from Supabase — turning the cheapest possible write into the most
expensive one, on the exact pages that get the most traffic.

Instead the comment list is fetched per request as one indexed query on
`(content_type, object_id)`. The cached post/project dict already carries `id`,
so resolving the target costs nothing extra: the detail views already hold the
dict via `DetailView.find_by_slug()`.

A test asserts that posting a comment leaves the content version stamps
untouched, so this cannot regress silently.

## Model

`apps/comments/models.py`:

```
Comment
  content_type  FK(ContentType)      ─┐ generic FK to BlogPost | Project
  object_id     PositiveIntegerField ─┘
  user          FK(User, CASCADE)
  body          TextField(max_length=1000)
  reply_to      FK(self, null=True, CASCADE, related_name="replies")
  is_deleted    BooleanField(default=False)
  created_at    DateTimeField(auto_now_add=True, db_index=True)

  Meta: ordering ["created_at"]
        index on (content_type, object_id, created_at)
```

`is_deleted` is a soft delete so removing a parent does not cascade its
replies away; deleted comments render as a tombstone and keep their thread.

`reply_to` is normalised on save: if the parent itself has a parent, attach to
the grandparent instead. Enforcing depth in the model rather than the view
means it holds regardless of how a comment is created.

## Views

`apps/comments/views.py`, both requiring POST:

- `PostCommentView` — validates the form, resolves the target from
  `content_type_id` + `object_id`, saves, adds a success message, redirects
  back to the target's detail page.
- `DeleteCommentView` — sets `is_deleted`, permitted for the comment's own
  author or for `is_author`/`is_co_author` (via
  `UserProfileMixin.get_user_profile_data()`).

Both redirect to the referring detail page. Unauthenticated POSTs are rejected
server-side, not merely hidden in the template.

## Templates

- `comments/_section.html` — the whole block, included by the blog and project
  detail templates with the target object passed in.
- `comments/_comment.html` — one comment plus its replies.
- `comments/_signin_prompt.html` — the signed-out state: the same Google and
  GitHub buttons the guestbook shows, via `{% provider_login_url %}`. Pure
  server-rendered HTML.
- `comments/_messages.html` — Django messages, styled to match
  `guestbook/components/messages.html` (same zinc palette, same dismiss
  control), so feedback looks like the rest of the site.

## Testing

`apps/comments/tests/`, split per concern following the existing layout:

- `test_models.py` — reply depth normalisation, soft delete keeps replies,
  ordering.
- `test_views.py` — post, reply, delete; signed-out POST rejected; unknown
  target 404s; redirect target correct.
- `test_permissions.py` — own comment deletable, another user's not, author and
  co-author can delete any.
- `test_cache_isolation.py` — posting a comment does not bump content versions.
- `test_templates.py` — signed-out renders the sign-in prompt and no form;
  signed-in renders the form.

All view tests set `SECURE_SSL_REDIRECT=False`, since it is tied to `not DEBUG`
and CI runs with `DEBUG=False` — the failure mode that broke the last batch.

## Out of scope

Edit-after-post, likes/reactions, email notification of replies, pagination,
rate limiting, and spam filtering. Comments are not exposed in the sitemap or
JSON-LD.
