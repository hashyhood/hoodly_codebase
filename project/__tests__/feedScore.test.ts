import { differenceInMinutes } from 'date-fns';

const score = (freshMins: number, distanceM: number, likes: number, comments: number) =>
  0.5*Math.exp(-freshMins/720) + 0.3*(1/(1+distanceM/1000)) + 0.2*Math.log1p(likes+comments);

test('fresh & nearby outranks old & far', () => {
  const a = score(10, 200, 2, 1);
  const b = score(1440, 5000, 5, 2);
  expect(a).toBeGreaterThan(b);
});
