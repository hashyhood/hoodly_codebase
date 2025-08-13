import { getCache, setCache } from '../lib/cache';

test('cache returns within TTL', () => {
  setCache('k','v');
  expect(getCache('k',1000)).toBe('v');
});

test('cache expires', async () => {
  setCache('k2','v2');
  await new Promise(r=>setTimeout(r,30));
  expect(getCache('k2',10)).toBeNull();
});
