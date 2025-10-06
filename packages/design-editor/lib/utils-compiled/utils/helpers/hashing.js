/**
 * Generates a SHA-256 hash of a file
 *
 * Uses the Web Crypto API to compute a SHA-256 cryptographic hash of the file content.
 * This is commonly used for file integrity verification, content addressing, or detecting
 * changes in file content.
 *
 * @param file - The File object to hash
 * @returns A promise that resolves with the hex-encoded hash string (64 characters)
 *
 * @example
 * ```typescript
 * const fileInput = document.getElementById('fileInput') as HTMLInputElement;
 * const file = fileInput.files?.[0];
 *
 * if (file) {
 *   const hash = await generateFileHash(file);
 *   console.log('File hash:', hash); // e.g., "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
 * }
 * ```
 *
 * @author @darianrosebrook
 */
export async function generateFileHash(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return hashHex;
}
