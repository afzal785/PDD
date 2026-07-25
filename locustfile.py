# locustfile.py
"""Load testing script for HealthTrack web application using Locust.

This script simulates 100 concurrent users for 1 minute, measuring requests per second (RPS)
and response time statistics (min, avg, max). Adjust the `host` variable to point to the
running instance of the HealthTrack web app (e.g., http://localhost:8000).

Run with:
    locust -f locustfile.py --users 100 --spawn-rate 10 --run-time 1m

The web UI will be available at http://localhost:8089 where you can view live metrics.
"""

HOST = "http://localhost:8000"

from locust import HttpUser, task, between

class HealthTrackUser(HttpUser):
    # Wait between tasks (in seconds)
    wait_time = between(1, 3)

    @task
    def load_homepage(self):
        """Load the main page of the HealthTrack app."""
        self.client.get("/", name="Load Home Page")

    @task(2)
    def load_dashboard(self):
        """Simulate navigation to the dashboard after login.
        In a real scenario you would first perform a login request and store the
        session cookie. For baseline static testing we directly request the dashboard
        endpoint (adjust the path if different)."""
        self.client.get("/dashboard", name="Load Dashboard")

    @task(1)
    def load_api_metrics(self):
        """Fetch a sample API endpoint that provides metrics.
        Replace /api/metrics with an actual endpoint if available."""
        self.client.get("/api/metrics", name="API Metrics")

    # You can add more tasks to cover other parts of the app.

# Note: Locust will automatically report RPS, response time percentiles, etc.
# The output can be saved from the web UI or using the --csv flag if needed.
