// Custom fast-check arbitrary for Vector2 type
import * as fc from 'fast-check';
import type { Vector2 } from '@animaster/shared/scene';

/**
 * Creates a fast-check arbitrary for Vector2 objects
 * @param options Configuration options for the vector generation
 * @returns Fast-check arbitrary that generates Vector2 objects
 */
export function arbitraryVector2(options: {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  allowNegative?: boolean;
  integerOnly?: boolean;
} = {}): fc.Arbitrary<Vector2> {
  const {
    minX = -1000,
    maxX = 1000,
    minY = -1000,
    maxY = 1000,
    allowNegative = true,
    integerOnly = false
  } = options;

  // Determine the range based on allowNegative flag
  const xMin = allowNegative ? minX : Math.max(0, minX);
  const yMin = allowNegative ? minY : Math.max(0, minY);
  const xMax = allowNegative ? maxX : Math.max(0, maxX);
  const yMax = allowNegative ? maxY : Math.max(0, maxY);

  // Choose the appropriate arbitrary based on integerOnly flag
  const xArbitrary = integerOnly 
    ? fc.integer({ min: xMin, max: xMax })
    : fc.float({ min: xMin, max: xMax });
  
  const yArbitrary = integerOnly
    ? fc.integer({ min: yMin, max: yMax })
    : fc.float({ min: yMin, max: yMax });

  return fc.record({
    x: xArbitrary,
    y: yArbitrary
  }) as fc.Arbitrary<Vector2>;
}

/**
 * Creates a fast-check arbitrary for normalized Vector2 objects (values between 0 and 1)
 * @returns Fast-check arbitrary that generates normalized Vector2 objects
 */
export function arbitraryNormalizedVector2(): fc.Arbitrary<Vector2> {
  return fc.record({
    x: fc.float({ min: 0, max: 1 }),
    y: fc.float({ min: 0, max: 1 })
  }) as fc.Arbitrary<Vector2>;
}

/**
 * Creates a fast-check arbitrary for unit Vector2 objects (values between -1 and 1)
 * @returns Fast-check arbitrary that generates unit Vector2 objects
 */
export function arbitraryUnitVector2(): fc.Arbitrary<Vector2> {
  return fc.record({
    x: fc.float({ min: -1, max: 1 }),
    y: fc.float({ min: -1, max: 1 })
  }) as fc.Arbitrary<Vector2>;
}

/**
 * Creates a fast-check arbitrary for screen-space Vector2 objects
 * @param screenWidth Width of the screen space
 * @param screenHeight Height of the screen space
 * @returns Fast-check arbitrary that generates screen-space Vector2 objects
 */
export function arbitraryScreenSpaceVector2(
  screenWidth: number = 1920,
  screenHeight: number = 1080
): fc.Arbitrary<Vector2> {
  return fc.record({
    x: fc.float({ min: 0, max: screenWidth }),
    y: fc.float({ min: 0, max: screenHeight })
  }) as fc.Arbitrary<Vector2>;
}