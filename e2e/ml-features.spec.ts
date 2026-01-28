import { test, expect } from '@playwright/test';

test.describe('Funcionalidades de Machine Learning', () => {
  test('deve exigir autenticação em /api/ml/status', async ({ request }) => {
    const res = await request.get('/api/ml/status');
    expect(res.status()).toBe(401);

    const json = await res.json();
    expect(json?.success).toBe(false);
    expect(String(json?.error || '')).toMatch(/não autenticado/i);
  });

  test('deve exigir autenticação em /api/ml/predictions', async ({ request }) => {
    const res = await request.get('/api/ml/predictions?table_id=test');
    expect(res.status()).toBe(401);

    const json = await res.json();
    expect(json?.success).toBe(false);
    expect(String(json?.error || '')).toMatch(/não autenticado/i);
  });
});
