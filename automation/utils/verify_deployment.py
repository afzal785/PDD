"""automation/utils/verify_deployment.py
Verifies that the GitHub Pages deployment is live before running Selenium tests.
"""
import sys
import os
import requests
from automation.utils.logger import get_logger

logger = get_logger(__name__)

BASE_URL = os.environ.get("BASE_URL", "https://your-username.github.io/healthtrack/")


def check_url(url: str, label: str = "") -> bool:
    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code == 200:
            logger.info("✔ %s — HTTP %d", label or url, resp.status_code)
            return True
        else:
            logger.error("✘ %s — HTTP %d", label or url, resp.status_code)
            return False
    except requests.RequestException as exc:
        logger.error("✘ %s — Error: %s", label or url, exc)
        return False


def verify():
    results = []
    results.append(check_url(BASE_URL, "Main Page"))
    # Additional asset checks can be added here
    if all(results):
        logger.info("Deployment verification PASSED.")
        return True
    else:
        logger.error("Deployment verification FAILED.")
        return False


if __name__ == "__main__":
    sys.exit(0 if verify() else 1)
