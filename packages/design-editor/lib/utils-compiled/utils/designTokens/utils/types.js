/**
 * Design Token Resolution Types
 *
 * Core type definitions for token resolution, transformation, and diagnostics.
 */
export class Diagnostics {
    constructor() {
        this.list = [];
    }
    warn(d) {
        this.list.push(d);
    }
    error(d) {
        this.list.push(d);
    }
    hasErrors() {
        return this.list.some((d) => d.code === 'MISSING' ||
            d.code === 'TYPE_MISMATCH' ||
            d.code === 'DEPTH_EXCEEDED');
    }
    clear() {
        this.list = [];
    }
}
