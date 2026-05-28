/**
 * shared/src/deepMerge.ts
 *
 * Deep merge utility for sparse mutation patches.
 * Handles nested objects, arrays (by ID), and null-safe field updates.
 * All operations are immutable - never mutates inputs.
 */

export type MergeableValue =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null
  | undefined;

export interface MergeOptions {
  /**
   * Property name to use as ID for array merging.
   * Default: 'id'
   */
  idField?: string;

  /**
   * Whether to merge arrays by ID (true) or replace entirely (false).
   * Default: true
   */
  mergeArrays?: boolean;

  /**
   * Whether undefined values in the patch should delete the property.
   * If false, undefined values are ignored (preserving the original).
   * Default: false
   */
  deleteOnUndefined?: boolean;
}

const DEFAULT_OPTIONS: Required<MergeOptions> = {
  idField: 'id',
  mergeArrays: true,
  deleteOnUndefined: false,
};

/**
 * Check if a value is a plain object (not array, not null, not date, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  if (value.constructor !== Object) return false;
  return true;
}

/**
 * Check if a value is an array of objects with IDs (mergeable arrays)
 */
function isMergeableArray(value: unknown, idField: string = 'id'): value is Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return false;
  // Consider empty arrays as mergeable
  if (value.length === 0) return true;
  // Check if items are objects with the ID field
  return value.every(item => isPlainObject(item) && idField in item);
}

/**
 * Deep merge a patch into a target object.
 *
 * Rules:
 * - Nested objects are recursively merged
 * - Arrays of objects with 'id' fields are merged by ID
 * - null values in patch overwrite (set to null)
 * - undefined values in patch are ignored (preserve original) unless deleteOnUndefined is true
 * - Original objects are never mutated
 *
 * @param target - The base object to merge into
 * @param patch - The sparse patch with updates
 * @param options - Merge behavior options
 * @returns A new object with merged values
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  patch: Partial<T> | Record<string, unknown>,
  options: MergeOptions = {}
): T {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return deepMergeInternal(target, patch, opts, new Set()) as T;
}

/**
 * Internal recursive merge with cycle detection
 */
function deepMergeInternal(
  target: unknown,
  patch: unknown,
  options: Required<MergeOptions>,
  seen: Set<unknown>
): unknown {
  // Handle null/undefined patch - no changes
  if (patch === undefined) {
    return target;
  }

  // Explicit null in patch overwrites the target
  if (patch === null) {
    return null;
  }

  // Cycle detection
  if (seen.has(patch)) {
    throw new Error('Circular reference detected in patch object');
  }

  // If patch is not an object, it replaces the target
  if (!isPlainObject(patch)) {
    // Handle arrays
    if (Array.isArray(patch)) {
      return mergeArrays(target, patch, options, seen);
    }
    // Primitive value - replace
    return patch;
  }

  // If target is not a plain object, replace it entirely with patch
  if (!isPlainObject(target)) {
    // Deep clone the patch to ensure immutability
    return deepClone(patch, seen);
  }

  // Both are plain objects - recursive merge
  seen.add(patch);
  const result: Record<string, unknown> = {};

  // Start with all properties from target
  for (const key of Object.keys(target)) {
    if (key in patch) {
      const patchValue = (patch as Record<string, unknown>)[key];

      // Handle undefined in patch
      if (patchValue === undefined) {
        if (options.deleteOnUndefined) {
          // Skip this key - effectively deleting it
          continue;
        } else {
          // Preserve original value
          result[key] = (target as Record<string, unknown>)[key];
        }
      } else {
        // Recursively merge
        result[key] = deepMergeInternal(
          (target as Record<string, unknown>)[key],
          patchValue,
          options,
          new Set(seen)
        );
      }
    } else {
      // Property not in patch - preserve original (deep clone for immutability)
      const originalValue = (target as Record<string, unknown>)[key];
      result[key] = deepClone(originalValue, new Set(seen));
    }
  }

  // Add new properties from patch that weren't in target
  for (const key of Object.keys(patch)) {
    if (!(key in target)) {
      const patchValue = (patch as Record<string, unknown>)[key];
      if (patchValue !== undefined) {
        result[key] = deepClone(patchValue, new Set(seen));
      }
    }
  }

  seen.delete(patch);
  return result;
}

/**
 * Merge two arrays, matching by ID when possible
 */
function mergeArrays(
  target: unknown,
  patch: unknown[],
  options: Required<MergeOptions>,
  seen: Set<unknown>
): unknown[] {
  // If target is not a mergeable array, replace with patch (cloned)
  if (!isMergeableArray(target, options.idField) || !options.mergeArrays) {
    return patch.map(item => deepClone(item, new Set(seen)));
  }

  const targetArray = target as Array<Record<string, unknown>>;
  const result: Array<Record<string, unknown>> = [];
  const processedPatchIds = new Set<string | number>();

  // Process each item in target
  for (const targetItem of targetArray) {
    const itemId = targetItem[options.idField];

    if (itemId !== undefined) {
      // Look for matching patch item by ID
      const patchItem = patch.find(
        p => isPlainObject(p) && p[options.idField] === itemId
      ) as Record<string, unknown> | undefined;

      if (patchItem !== undefined) {
        // Merge the items
        processedPatchIds.add(itemId as string | number);
        result.push(
          deepMergeInternal(targetItem, patchItem, options, new Set(seen)) as Record<string, unknown>
        );
      } else {
        // No patch for this item - keep original (cloned)
        result.push(deepClone(targetItem, new Set(seen)) as Record<string, unknown>);
      }
    } else {
      // No ID on target item - keep it (cloned)
      result.push(deepClone(targetItem, new Set(seen)) as Record<string, unknown>);
    }
  }

  // Add new items from patch that weren't merged
  for (const patchItem of patch) {
    if (!isPlainObject(patchItem)) {
      // Non-object array items - add as-is (cloned)
      result.push(deepClone(patchItem, new Set(seen)) as Record<string, unknown>);
      continue;
    }

    const patchId = patchItem[options.idField];
    if (patchId === undefined || !processedPatchIds.has(patchId as string | number)) {
      // New item - add it (cloned)
      result.push(deepClone(patchItem, new Set(seen)) as Record<string, unknown>);
    }
  }

  return result;
}

/**
 * Deep clone a value to ensure immutability
 */
function deepClone(value: unknown, seen: Set<unknown>): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    throw new Error('Circular reference detected in target object');
  }

  seen.add(value);

  let result: unknown;

  if (Array.isArray(value)) {
    result = value.map(item => deepClone(item, new Set(seen)));
  } else if (isPlainObject(value)) {
    result = {};
    for (const key of Object.keys(value)) {
      (result as Record<string, unknown>)[key] = deepClone(
        (value as Record<string, unknown>)[key],
        new Set(seen)
      );
    }
  } else {
    // Non-plain object (Date, RegExp, etc.) - return as-is
    result = value;
  }

  seen.delete(value);
  return result;
}

/**
 * Create a sparse patch for updating specific fields while preserving others.
 * This is a helper for creating type-safe partial updates.
 *
 * @example
 * const patch = createPatch<CharacterRelationship>({
 *   type: 'conversing',
 *   tension: 0.5
 * });
 */
export function createPatch<T extends Record<string, unknown>>(
  partial: Partial<T>
): Partial<T> {
  return partial;
}

/**
 * Apply a sparse patch to a target using deep merge.
 * Convenience wrapper around deepMerge.
 *
 * @param target - The base object
 * @param patch - The sparse patch
 * @param options - Merge options
 * @returns New merged object
 */
export function applyPatch<T extends Record<string, unknown>>(
  target: T,
  patch: Partial<T>,
  options?: MergeOptions
): T {
  return deepMerge(target, patch, options);
}
