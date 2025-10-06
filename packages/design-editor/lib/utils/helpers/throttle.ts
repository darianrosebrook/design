/**
 * Creates a throttled version of a function that can only be called once every `limit` milliseconds
 *
 * Throttling ensures that a function is not called more frequently than the specified limit,
 * regardless of how many times the throttled function is invoked.
 *
 * @param func - The function to throttle
 * @param limit - The minimum time interval between function calls in milliseconds
 * @returns A throttled version of the input function
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *   console.log('Scroll event handled');
 * }, 100);
 *
 * window.addEventListener('scroll', throttledScroll);
 * ```
 *
 * @author @darianrosebrook
 */
export const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
