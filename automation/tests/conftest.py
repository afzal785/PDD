"""automation/tests/conftest.py
PyTest fixtures for Selenium framework – driver setup, teardown,
screenshot on failure, and BASE_URL injection.
"""
import os
import pytest
from automation.utils.driver import get_driver
from automation.utils.screenshot import capture
from automation.utils.logger import get_logger

logger = get_logger(__name__)

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")


def pytest_addoption(parser):
    parser.addoption("--base-url", default=BASE_URL, help="Base URL of the app under test")
    parser.addoption("--headless", action="store_true", default=True, help="Run in headless mode")


@pytest.fixture(scope="session")
def base_url(request):
    return request.config.getoption("--base-url")


@pytest.fixture(scope="function")
def driver(request):
    headless = request.config.getoption("--headless")
    drv = get_driver(headless=headless)
    yield drv
    # Take screenshot on test failure
    if request.node.rep_call.failed if hasattr(request.node, "rep_call") else False:
        capture(drv, request.node.name)
    drv.quit()


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    setattr(item, "rep_" + rep.when, rep)
    if rep.when == "call" and rep.failed:
        driver_fixture = item.funcargs.get("driver")
        if driver_fixture:
            capture(driver_fixture, item.name)
