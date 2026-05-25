import { describe, it } from 'vitest';
import fc from 'fast-check';

describe('Property-based Testing Sanity Check', () => {
  it('should assert that addition is commutative (a + b === b + a)', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      })
    );
  });
});
