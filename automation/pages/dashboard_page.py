"""automation/pages/dashboard_page.py
Page Object for the Dashboard view of HealthTrack.
"""
from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage


class DashboardPage(BasePage):
    APP_SCREEN    = (By.ID, "app-screen")
    AI_PANEL      = (By.CLASS_NAME, "ai-panel")
    METRIC_CARD   = (By.CLASS_NAME, "metric-primary")
    NAV_DASHBOARD = (By.ID, "nav-dashboard")
    NAV_MEDS      = (By.ID, "nav-medications")
    NAV_SCHEDULE  = (By.ID, "nav-schedule")
    NAV_HEALTH    = (By.ID, "nav-health")
    NAV_SETTINGS  = (By.ID, "nav-settings")

    def is_loaded(self) -> bool:
        return self.is_visible(*self.APP_SCREEN)

    def get_metric_count(self) -> int:
        return len(self.driver.find_elements(*self.METRIC_CARD))

    def navigate_to_medications(self):
        self.click(*self.NAV_MEDS)

    def navigate_to_schedule(self):
        self.click(*self.NAV_SCHEDULE)

    def navigate_to_health_log(self):
        self.click(*self.NAV_HEALTH)

    def navigate_to_settings(self):
        self.click(*self.NAV_SETTINGS)

    def is_ai_panel_visible(self) -> bool:
        return self.is_visible(*self.AI_PANEL)
