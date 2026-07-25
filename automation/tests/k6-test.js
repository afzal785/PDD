import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Ramp-up to 20 users
    { duration: '30s', target: 20 }, // Stay at 20 users for 30s
    { duration: '10s', target: 0 },  // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

export default function () {
  // We hit the local python server that will be spun up in GitHub Actions
  const url = 'http://localhost:8000/index.html';
  
  const res = http.get(url);
  
  check(res, {
    'is status 200': (r) => r.status === 200,
    'body contains HealthTrack': (r) => r.body.includes('HealthTrack'),
  });

  sleep(1); // Think time
}
