"""The dashboard's spending limit on external APIs.

Both panels fetch from a third party on a cache miss, in sequence, and WakaTime
makes two calls of its own. Each client carries a 10s timeout, but a timeout per
call bounds nothing once there is more than one call: a cold cache with both
services struggling adds up to ~30s, which the visitor sees as a gateway timeout
instead of the page.

Same shape as the upload 504 and the cleanup cascade -- a per-operation limit
mistaken for a limit on the request.
"""

import time
from unittest import mock

from django.core.cache import cache
from django.test import TestCase

from apps.dashboard.views import EXTERNAL_API_BUDGET, DashboardView


class ExternalApiBudgetTest(TestCase):
    def setUp(self):
        cache.clear()
        self.view = DashboardView()

    def tearDown(self):
        cache.clear()

    def test_a_slow_first_api_stops_the_second_from_being_called(self):
        """The second panel is dropped rather than added to the wait."""
        clock = {"t": 0.0}
        self.view._api_deadline = EXTERNAL_API_BUDGET

        def slow_fetch():
            clock["t"] += EXTERNAL_API_BUDGET + 1  # first call eats the whole budget
            return {"ok": True}

        second = mock.Mock(return_value={"ok": True})

        with mock.patch.object(time, "monotonic", lambda: clock["t"]), \
                mock.patch("apps.dashboard.views.time.monotonic", lambda: clock["t"]):
            self.view._get_cached_stats("k1", slow_fetch, lambda raw: raw, "GitHub")
            result = self.view._get_cached_stats("k2", second, lambda raw: raw, "WakaTime")

        second.assert_not_called()
        self.assertIsNone(result, "an unaffordable panel should degrade to hidden")

    def test_a_prompt_first_api_leaves_room_for_the_second(self):
        clock = {"t": 0.0}
        self.view._api_deadline = EXTERNAL_API_BUDGET

        def quick_fetch():
            clock["t"] += 1.0
            return {"ok": True}

        second = mock.Mock(return_value={"ok": True})

        with mock.patch("apps.dashboard.views.time.monotonic", lambda: clock["t"]):
            self.view._get_cached_stats("k1", quick_fetch, lambda raw: raw, "GitHub")
            self.view._get_cached_stats("k2", second, lambda raw: raw, "WakaTime")

        second.assert_called_once()

    def test_a_cached_panel_costs_nothing_against_the_budget(self):
        """The budget guards the network, not the cache."""
        cache.set("k2", {"cached": True}, 60)
        self.view._api_deadline = -1.0  # budget already spent

        fetch = mock.Mock()
        with mock.patch("apps.dashboard.views.time.monotonic", lambda: 0.0):
            result = self.view._get_cached_stats("k2", fetch, lambda raw: raw, "WakaTime")

        fetch.assert_not_called()
        self.assertEqual(result, {"cached": True})
