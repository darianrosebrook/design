/**
 * Creates a debounced version of a function that delays execution until after `ms` milliseconds
 * have elapsed since the last time the debounced function was invoked
 *
 * Debouncing ensures that a function is only executed once after a series of rapid calls,
 * waiting for the calls to stop before executing the function.
 *
 * @param fn - The function to debounce
 * @param ms - The number of milliseconds to delay execution
 * @returns A debounced version of the input function
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 *
 * // Only the last call will execute after 300ms of inactivity
 * debouncedSearch('a');
 * debouncedSearch('ab');
 * debouncedSearch('abc');
 * ```
 *
 * @author @darianrosebrook
 */
export const debounce = <T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: Parameters<T>) {
    const fnCall = () => fn.apply(this, args);
    clearTimeout(timeout);
    timeout = setTimeout(fnCall, ms);
  };
};
