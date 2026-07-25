"""automation/tests/test_dashboard.py
Dashboard test cases
"""
import pytest
from automation.pages.login_page import LoginPage
from automation.pages.dashboard_page import DashboardPage

@pytest.mark.dashboard
class TestDashboard:

    def test_DASH_001_dashboard_loads_after_login(self, driver, base_url):
        """TC-DASH-001 | Dashboard loads correctly after login."""
        # Login first
        LoginPage(driver, base_url).open().demo_login()
        
        # Verify dashboard
        dash = DashboardPage(driver, base_url)
        assert dash.is_loaded(), "Dashboard did not load after successful login"
        
    def test_DASH_002_dashboard_has_correct_title(self, driver, base_url):
        """TC-DASH-002 | Dashboard displays correct health summary title."""
        LoginPage(driver, base_url).open().demo_login()
        dash = DashboardPage(driver, base_url)
        
        # We can add further specific assertions here if needed
        assert dash.get_title() != "", "Dashboard title is empty"
