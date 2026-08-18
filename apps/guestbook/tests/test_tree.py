"""Thread building for the guestbook.

These exercise apps.guestbook.tree.build_thread directly, on plain dicts, so
they pin the rules without a database or a rendered page in the way. The
rendering side is covered by test_thread_rendering.py.
"""

from datetime import UTC, datetime, timedelta

from django.test import SimpleTestCase

from apps.guestbook.tree import MAX_DEPTH, build_thread

BASE = datetime(2026, 8, 18, 12, 0, tzinfo=UTC)


def msg(pk, reply_to=None, minutes=None):
    """An enriched message dict, shaped as GuestbookView builds them."""
    return {
        "id": pk,
        "message": f"message {pk}",
        "timestamp": BASE + timedelta(minutes=pk if minutes is None else minutes),
        "reply_to": {"id": reply_to, "user_full_name": f"user{reply_to}"} if reply_to else None,
    }


def shape(nodes):
    """(id, depth, [children]) for each node, for comparing whole trees."""
    return [(n["id"], n["depth"], shape(n["replies"])) for n in nodes]


class BuildThreadTest(SimpleTestCase):
    def test_replies_nest_under_the_message_they_answer(self):
        roots = build_thread([msg(1), msg(2, reply_to=1), msg(3, reply_to=2)])

        self.assertEqual(shape(roots), [(1, 0, [(2, 1, [(3, 2, [])])])])

    def test_roots_and_replies_both_come_back_oldest_first(self):
        """The panel scrolls oldest to newest, and the view hands over the
        latest-50 query, which is newest first."""
        roots = build_thread([
            msg(4, reply_to=1), msg(3), msg(2, reply_to=1), msg(1),
        ])

        self.assertEqual(shape(roots), [(1, 0, [(2, 1, []), (4, 1, [])]), (3, 0, [])])

    def test_a_reply_past_the_cap_sits_beside_its_parent(self):
        """Not further right: the panel is one narrow column, and unbounded
        reply_to would otherwise indent until the text had no room."""
        roots = build_thread([msg(1), msg(2, reply_to=1), msg(3, reply_to=2), msg(4, reply_to=3)])

        self.assertEqual(
            shape(roots), [(1, 0, [(2, 1, [(3, 2, []), (4, 2, [])])])]
        )

    def test_depth_never_exceeds_the_cap_however_long_the_chain(self):
        chain = [msg(1)] + [msg(n, reply_to=n - 1) for n in range(2, 12)]

        roots = build_thread(chain)

        depths = []

        def walk(nodes):
            for node in nodes:
                depths.append(node["depth"])
                walk(node["replies"])

        walk(roots)
        self.assertEqual(len(depths), 11)
        self.assertLessEqual(max(depths), MAX_DEPTH - 1)

    def test_a_reply_flattened_off_its_parent_keeps_its_caption(self):
        """The tree can no longer show that relationship, so the caption is the
        only place it survives."""
        roots = build_thread([msg(1), msg(2, reply_to=1), msg(3, reply_to=2), msg(4, reply_to=3)])

        by_id = {}

        def walk(nodes):
            for node in nodes:
                by_id[node["id"]] = node
                walk(node["replies"])

        walk(roots)
        self.assertFalse(by_id[3]["show_reply_to"], "nesting already shows this one")
        self.assertTrue(by_id[4]["show_reply_to"], "flattened, so the caption is needed")

    def test_a_reply_whose_parent_is_outside_the_window_becomes_a_captioned_root(self):
        """The view fetches the latest 50; older parents simply are not there."""
        roots = build_thread([msg(9, reply_to=404)])

        self.assertEqual(shape(roots), [(9, 0, [])])
        self.assertTrue(roots[0]["show_reply_to"])

    def test_a_root_carries_no_caption(self):
        roots = build_thread([msg(1)])

        self.assertFalse(roots[0]["show_reply_to"])

    def test_a_self_referencing_row_cannot_build_a_cycle(self):
        """The recursive template would recurse until it died. Nothing creates
        this through the app, but sync_guestbook merges rows in from a second
        database and reassigns primary keys as it goes."""
        roots = build_thread([msg(1, reply_to=1)])

        self.assertEqual(shape(roots), [(1, 0, [])])

    def test_mutually_referencing_rows_cannot_build_a_cycle(self):
        roots = build_thread([msg(1, reply_to=2), msg(2, reply_to=1)])

        # Whatever the arrangement, every message appears exactly once and the
        # structure terminates.
        seen = []

        def walk(nodes):
            for node in nodes:
                seen.append(node["id"])
                walk(node["replies"])

        walk(roots)
        self.assertCountEqual(seen, [1, 2])

    def test_a_reply_older_than_its_parent_is_not_dropped(self):
        """sync_guestbook truncates timestamps to the second, so two rows can
        genuinely disagree about which came first."""
        roots = build_thread([msg(1, minutes=10), msg(2, reply_to=1, minutes=5)])

        seen = []

        def walk(nodes):
            for node in nodes:
                seen.append(node["id"])
                walk(node["replies"])

        walk(roots)
        self.assertCountEqual(seen, [1, 2])

    def test_an_empty_list_gives_an_empty_thread(self):
        self.assertEqual(build_thread([]), [])
