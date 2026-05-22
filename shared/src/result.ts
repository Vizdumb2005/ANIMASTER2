// Result Type for Functional Error Handling
// Phase: L0-3 Foundation Integrity

/**
 * Result type for functional error handling
 * Replaces throw-based error propagation with explicit success/failure states
 * 
 * @template T - Success value type
 * @template E - Error type
 */
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Create a successful Result
 * @param value - The success value
 * @returns Result with ok=true and the value
 */
export function ok<T, E>(value: T): Result<T, E> {
  return { ok: true, value };
}

/**
 * Create a failed Result
 * @param error - The error value
 * @returns Result with ok=false and the error
 */
export function err<T, E>(error: E): Result<T, E> {
  return { ok: false, error };
}

/**
 * Check if a Result is successful
 * @param result - The Result to check
 * @returns true if the Result is successful, false otherwise
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/**
 * Check if a Result is a failure
 * @param result - The Result to check
 * @returns true if the Result is a failure, false otherwise
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

/**
 * Unwrap a Result or throw if it's an error
 * @param result - The Result to unwrap
 * @returns The success value
 * @throws The error if the Result is a failure
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwrap a Result or return a default value if it's an error
 * @param result - The Result to unwrap
 * @param defaultValue - The value to return if the Result is a failure
 * @returns The success value or the default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.value : defaultValue;
}

/**
 * Map a Result's success value
 * @param result - The Result to map
 * @param fn - The mapping function
 * @returns A new Result with the mapped value or the original error
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return isOk(result) ? ok(fn(result.value)) : result;
}

/**
 * Chain operations on a Result
 * @param result - The Result to chain
 * @param fn - The function to apply if the Result is successful
 * @returns A new Result from the function or the original error
 */
export function andThen<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return isOk(result) ? fn(result.value) : result;
}

/**
 * Convert a throwing function to return a Result
 * @param fn - The function that might throw
 * @returns A function that returns a Result instead of throwing
 */
export function wrap<T, E>(fn: () => T): () => Result<T, E> {
  return () => {
    try {
      return ok(fn());
    } catch (error) {
      return err(error as E);
    }
  };
}

/**
 * Convert an async throwing function to return a Promise<Result>
 * @param fn - The async function that might throw
 * @returns A function that returns a Promise<Result> instead of throwing
 */
export function wrapAsync<T, E>(fn: () => Promise<T>): () => Promise<Result<T, E>> {
  return async () => {
    try {
      return ok(await fn());
    } catch (error) {
      return err(error as E);
    }
  };
}