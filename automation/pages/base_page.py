"""automation/pages/base_page.py
Base Page Object – common helpers for all page objects.
"""
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from automation.utils.logger import get_logger

logger = get_logger(__name__)


class BasePage:
    def __init__(self, driver, base_url: str):
        self.driver = driver
        self.base_url = base_url.rstrip("/")
        self.wait = WebDriverWait(driver, 20)

    def navigate(self, path: str = ""):
        url = f"{self.base_url}/{path}".rstrip("/")
        logger.info("Navigating to: %s", url)
        self.driver.get(url)

    def find(self, by, value):
        return self.wait.until(EC.presence_of_element_located((by, value)))

    def find_visible(self, by, value):
        return self.wait.until(EC.visibility_of_element_located((by, value)))

    def click(self, by, value):
        el = self.wait.until(EC.element_to_be_clickable((by, value)))
        el.click()
        return el

    def type_text(self, by, value, text: str):
        el = self.find_visible(by, value)
        el.clear()
        el.send_keys(text)
        return el

    def get_title(self) -> str:
        return self.driver.title

    def get_url(self) -> str:
        return self.driver.current_url

    def is_visible(self, by, value) -> bool:
        try:
            return self.find_visible(by, value).is_displayed()
        except Exception:
            return False

    def get_text(self, by, value) -> str:
        return self.find_visible(by, value).text
