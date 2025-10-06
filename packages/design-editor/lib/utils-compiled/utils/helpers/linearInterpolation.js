/**
 * Performs linear interpolation between two values
 *
 * Calculates a point between `start` and `end` based on the interpolation factor `t`.
 * When `t = 0`, returns `start`. When `t = 1`, returns `end`.
 * When `t = 0.5`, returns the midpoint between `start` and `end`.
 *
 * @param start - The starting value
 * @param end - The ending value
 * @param t - The interpolation factor (0-1, but can extrapolate outside this range)
 * @returns The interpolated value
 *
 * @example
 * ```typescript
 * linearInterpolation(0, 10, 0.5);   // Returns 5
 * linearInterpolation(0, 100, 0.25);  // Returns 25
 * linearInterpolation(0, 100, 1.5);   // Returns 150 (extrapolation)
 * ```
 *
 * @author @darianrosebrook
 */
export const linearInterpolation = (start, end, t) => {
    return (1 - t) * start + t * end;
};
