"""automation/utils/screenshot.py
Screenshot capture utility – saves to automation/screenshots/.
"""
import os
from datetime import datetime
from automation.utils.logger import get_logger

logger = get_logger(__name__)

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def capture(driver, name: str) -> str:
    """Capture a screenshot and return the file path."""
    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in name)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{safe_name}_{timestamp}.png"
    filepath = os.path.join(SCREENSHOT_DIR, filename)
    driver.save_screenshot(filepath)
    logger.info("Screenshot saved: %s", filepath)
    return filepath
