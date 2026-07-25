"""automation/utils/driver.py
Selenium WebDriver factory – headless Chrome via webdriver-manager.
"""
import os
import logging
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

logger = logging.getLogger(__name__)


def get_driver(headless: bool = True, window_width: int = 1920, window_height: int = 1080):
    """Create and return a configured Chrome WebDriver instance."""
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument(f"--window-size={window_width},{window_height}")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-infobars")
    options.add_experimental_option("excludeSwitches", ["enable-logging"])
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.implicitly_wait(10)
    logger.info("WebDriver initialised (headless=%s)", headless)
    return driver
