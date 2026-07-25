"""automation/pages/login_page.py
Page Object for the Login / Auth view of HealthTrack.
"""
from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage


class LoginPage(BasePage):
    # Locators
    LOGIN_VIEW = (By.ID, "login-view")
    DEMO_BTN   = (By.XPATH, "//button[contains(text(),'Demo Login')]")
    EMAIL_INPUT = (By.ID, "email-input")
    PASSWORD_INPUT = (By.ID, "password-input")
    LOGIN_BTN  = (By.XPATH, "//button[contains(text(),'Login')]")
    ERROR_MSG  = (By.CLASS_NAME, "error-message")

    def open(self):
        self.navigate()
        return self

    def is_login_page_displayed(self) -> bool:
        return self.is_visible(*self.LOGIN_VIEW)

    def demo_login(self):
        self.click(*self.DEMO_BTN)
        return self

    def login(self, email: str, password: str):
        self.type_text(*self.EMAIL_INPUT, email)
        self.type_text(*self.PASSWORD_INPUT, password)
        self.click(*self.LOGIN_BTN)
        return self

    def get_error_message(self) -> str:
        return self.get_text(*self.ERROR_MSG)
