/**
 * Calculates estimated reading time for a given word count
 *
 * Uses a standard reading speed of 300 words per minute to estimate
 * how long it would take to read content of the specified length.
 *
 * @param wordCount - The number of words in the content
 * @returns A human-readable string describing the reading time
 *
 * @example
 * ```typescript
 * calculateReadingTime(150);     // "less than a minute"
 * calculateReadingTime(600);     // "2 minutes"
 * calculateReadingTime(18000);   // "an hour"
 * calculateReadingTime(72000);   // "4 hours"
 * ```
 *
 * @author @darianrosebrook
 */
export const calculateReadingTime = (wordCount) => {
    const wordsPerMinute = 300;
    const minutes = Math.floor(wordCount / wordsPerMinute);
    if (minutes < 1)
        return "less than a minute";
    if (minutes === 1)
        return "a minute";
    if (minutes < 60)
        return `${minutes} minutes`;
    if (minutes === 60)
        return "an hour";
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours} hour${hours > 1 ? "s" : ""}`;
    if (hours === 24)
        return "a day";
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""}`;
};
/**
 * Formats a number with a fixed number of decimal places
 *
 * @param number - The number to format
 * @param precision - The number of decimal places to show (default: 2)
 * @returns A string representation of the number with fixed precision
 *
 * @example
 * ```typescript
 * formatNumberWithPrecision(3.14159, 2);  // "3.14"
 * formatNumberWithPrecision(1.5, 3);      // "1.500"
 * formatNumberWithPrecision(42, 0);       // "42"
 * ```
 *
 * @author @darianrosebrook
 */
export const formatNumberWithPrecision = (number, precision = 2) => {
    return number.toFixed(precision);
};
/**
 * Formats a number with comma separators for thousands
 *
 * Uses the US locale (en-US) to add comma separators for improved readability
 * of large numbers.
 *
 * @param number - The number to format
 * @param precision - The minimum number of decimal places to show (default: 0)
 * @returns A string representation of the number with comma separators
 *
 * @example
 * ```typescript
 * formatNumberWithCommas(1234);       // "1,234"
 * formatNumberWithCommas(1234.56, 2); // "1,234.56"
 * formatNumberWithCommas(1000000);    // "1,000,000"
 * ```
 *
 * @author @darianrosebrook
 */
export const formatNumberWithCommas = (number, precision = 0) => {
    return number.toLocaleString("en-US", { minimumFractionDigits: precision });
};
/**
 * Formats a Date object into a human-readable string
 *
 * Uses the US locale (en-US) to format dates with customizable options.
 * By default shows the full date in a readable format.
 *
 * @param date - The Date object to format
 * @param config - Intl.DateTimeFormatOptions for customizing the output format
 * @returns A formatted date string
 *
 * @example
 * ```typescript
 * const date = new Date('2024-01-15');
 *
 * formatDate(date);
 * // "January 15, 2024"
 *
 * formatDate(date, { weekday: 'long', month: 'short', day: 'numeric' });
 * // "Monday, Jan 15"
 *
 * formatDate(date, { year: '2-digit', month: '2-digit', day: '2-digit' });
 * // "01/15/24"
 * ```
 *
 * @author @darianrosebrook
 */
export const formatDate = (date, config = {
    year: "numeric",
    month: "long",
    day: "numeric",
}) => {
    return date.toLocaleDateString("en-US", config);
};
