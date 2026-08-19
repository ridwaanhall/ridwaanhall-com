"""
Turning the flat guestbook message list into a thread tree.

The page fetches the latest N messages in one query and this arranges them; it
issues no queries of its own, so threading the view costs nothing beyond the
work already being done.

Three constraints shape it:

* **The window cuts threads.** The view fetches the latest 50 messages, so a
  reply can easily be inside that window while the message it answers is not.
  Rather than chase ancestors with more queries (unbounded, and it would drag
  arbitrarily old messages into a "latest 50" list), an unmatched reply becomes
  a root and keeps a caption naming who it answered. Nothing is lost -- that
  caption is exactly what the whole list used to show before it was a tree.

* **Indentation has to stop.** ``reply_to`` is an unbounded self-FK, and the
  chat panel is a single column that goes down to 375px wide. Past MAX_DEPTH a
  reply is attached to its grandparent instead, so it sits beside its parent
  rather than further right, and gets the same caption naming the message it
  actually answered. This mirrors what ``Comment.save()`` does for the same
  reason, one level up.

* **The result must be a tree, whatever the rows say.** A parent is only ever
  taken from the messages already placed, walking oldest first, so a cycle
  cannot be built no matter what ``reply_to`` contains -- the recursive template
  would otherwise recurse until it died. That matters here because
  ``sync_guestbook`` merges rows in from a second database by natural key, and
  because timestamps are only second-accurate after that round trip.
"""

# Root plus two nested levels. Three is what fits: each level costs ~1.75rem of
# indent, and the fourth would leave a 500-character message rendering in a
# column narrower than it is tall on a phone.
MAX_DEPTH = 3


def build_thread(messages, max_depth=MAX_DEPTH):
    """Arrange enriched message dicts into a tree, returning the roots.

    Each dict is mutated in place to gain:

        replies       -- child dicts, oldest first
        depth         -- 0 for a root, never more than max_depth - 1
        show_reply_to -- True when the message answers something other than the
                         node it is rendered under, i.e. its caption is the only
                         place that relationship is visible

    Roots come back oldest first, matching the order the panel scrolls through.
    """
    for message in messages:
        message["replies"] = []
        message["depth"] = 0
        message["show_reply_to"] = bool(message.get("reply_to"))

    roots = []
    placed = {}
    render_parents = {}

    # Oldest first. Resolving parents against `placed` rather than the whole
    # list is what rules out cycles: a message can only ever attach to one that
    # has already been positioned.
    for message in sorted(messages, key=lambda m: (m["timestamp"], m["id"])):
        parent = None
        if message["reply_to"]:
            parent = placed.get(message["reply_to"]["id"])

        if parent is not None and parent["depth"] + 1 >= max_depth:
            # Too deep: re-attach a level up. The parent is at max_depth - 1, so
            # this lands the message beside it rather than indented past it.
            parent = render_parents[parent["id"]]

        if parent is None:
            roots.append(message)
        else:
            message["depth"] = parent["depth"] + 1
            parent["replies"].append(message)
            # The caption earns its place only when the tree doesn't already
            # show the relationship -- here it does, unless the message was
            # flattened off the parent it actually answered.
            message["show_reply_to"] = parent["id"] != message["reply_to"]["id"]

        placed[message["id"]] = message
        render_parents[message["id"]] = parent

    return roots
