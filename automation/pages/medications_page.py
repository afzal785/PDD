"""automation/pages/medications_page.py
Page Object for the Medications view of HealthTrack.
"""
from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage


class MedicationsPage(BasePage):
    ADD_MED_BTN   = (By.XPATH, "//button[contains(text(),'Add New Medication')]")
    MED_NAME_IN   = (By.ID, "med-name-input")
    MED_DOSAGE_IN = (By.ID, "med-dosage-input")
    SAVE_BTN      = (By.XPATH, "//button[contains(text(),'Save Medication')]")
    MED_CARD      = (By.CLASS_NAME, "medication-card")
    DELETE_BTN    = (By.XPATH, "//button[contains(@class,'delete-med')]")

    def click_add(self):
        self.click(*self.ADD_MED_BTN)

    def fill_medication(self, name: str, dosage: str):
        self.type_text(*self.MED_NAME_IN, name)
        self.type_text(*self.MED_DOSAGE_IN, dosage)

    def save(self):
        self.click(*self.SAVE_BTN)

    def is_medication_listed(self, name: str) -> bool:
        try:
            el = self.driver.find_element(By.XPATH, f"//*[contains(text(),'{name}')]")
            return el.is_displayed()
        except Exception:
            return False

    def count_medications(self) -> int:
        return len(self.driver.find_elements(*self.MED_CARD))
