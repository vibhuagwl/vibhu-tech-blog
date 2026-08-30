import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    spike: {
      executor: 'constant-arrival-rate',
      rate: 200,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 50,
    },
  },
};

export default function () {
  const user = `u-${__VU}-${__ITER}`;
  const res = http.post(
    'http://localhost:8080/api/v1/flash-sales/SALE1001/orders',
    JSON.stringify({
      productId: 'P1001',
      quantity: 1,
      idempotencyKey: `${user}-P1001-SALE1001`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user,
      },
    },
  );
  check(res, { accepted_or_conflict: (r) => r.status === 202 || r.status === 409 || r.status === 429 });
}
