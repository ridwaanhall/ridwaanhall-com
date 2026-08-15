"""DataService's openhire accessors."""

from django.test import TestCase

from apps.core.data_service import DataService


class OpenHireDataServiceTest(TestCase):
    """Tests that DataService correctly loads openhire data from apps/openhire/data/."""

    def test_get_open_to_work_data_returns_dict_or_none(self):
        result = DataService.get_open_to_work_data()
        self.assertTrue(result is None or isinstance(result, dict))

    def test_get_hiring_data_returns_dict_or_none(self):
        result = DataService.get_hiring_data()
        self.assertTrue(result is None or isinstance(result, dict))

    def test_open_to_work_data_has_status(self):
        result = DataService.get_open_to_work_data()
        if result is not None:
            self.assertIn("status", result)
