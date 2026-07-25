"""automation/utils/retry.py
Retry decorator for flaky Selenium actions.
"""
import time
import functools
from automation.utils.logger import get_logger

logger = get_logger(__name__)


def retry(times: int = 3, delay: float = 1.0, exceptions=(Exception,)):
    """Retry a function `times` times with `delay` seconds between attempts."""
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return fn(*args, **kwargs)
                except exceptions as exc:
                    logger.warning("Attempt %d/%d failed for %s: %s", attempt, times, fn.__name__, exc)
                    if attempt == times:
                        raise
                    time.sleep(delay)
        return wrapper
    return decorator
