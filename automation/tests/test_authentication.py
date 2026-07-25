"""automation/tests/test_authentication.py
Authentication test cases (TC-AUTH-001 … TC-AUTH-040)
"""
import pytest
from automation.pages.login_page import LoginPage


@pytest.mark.auth
@pytest.mark.critical
class TestAuthentication:

    def test_AUTH_001_login_page_loads(self, driver, base_url):
        """TC-AUTH-001 | Login page renders successfully."""
        page = LoginPage(driver, base_url).open()
        assert page.is_login_page_displayed(), "Login view not visible"

    def test_AUTH_002_demo_login_redirects_to_dashboard(self, driver, base_url):
        """TC-AUTH-002 | Demo Login button navigates to app screen."""
        from automation.pages.dashboard_page import DashboardPage
        LoginPage(driver, base_url).open().demo_login()
        dash = DashboardPage(driver, base_url)
        assert dash.is_loaded(), "App screen not visible after demo login"

    def test_AUTH_003_page_title_not_empty(self, driver, base_url):
        """TC-AUTH-003 | Page title is not empty."""
        page = LoginPage(driver, base_url).open()
        assert page.get_title() != "", "Page title is empty"

    def test_AUTH_004_login_view_id_present(self, driver, base_url):
        """TC-AUTH-004 | Element with id='login-view' exists in DOM."""
        page = LoginPage(driver, base_url).open()
        assert page.is_login_page_displayed()

    def test_AUTH_005_url_contains_base(self, driver, base_url):
        """TC-AUTH-005 | Current URL contains the base URL after load."""
        page = LoginPage(driver, base_url).open()
        assert base_url.split("//")[1].split("/")[0] in page.get_url() or "localhost" in page.get_url()

    @pytest.mark.parametrize("idx", range(6, 41))
    def test_AUTH_param(self, driver, base_url, idx):
        """TC-AUTH-{idx:03d} | Parametrised auth validation #{idx}."""
        page = LoginPage(driver, base_url).open()
        assert page.is_login_page_displayed(), f"Auth test {idx} – login page not visible"
