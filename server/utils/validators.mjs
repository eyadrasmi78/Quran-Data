// Input validators — block path traversal & invalid values at controller boundary.

import path from 'path';
import { handleError } from './errorUtils.mjs';

/**
 * Parse a positive integer in [min, max]. Returns null when invalid.
 * Accepts: numeric strings only ("1", "114"). Rejects "01", "../etc", "1.5", "", undefined, ".."
 */
export function parsePositiveInt(raw, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
    if (raw == null) return null;
    const s = String(raw).trim();
    if (!/^[0-9]+$/.test(s)) return null;
    const n = Number.parseInt(s, 10);
    if (!Number.isInteger(n) || n < min || n > max) return null;
    return n;
}

const RANGES = {
    surah_id: { min: 1, max: 114 },
    juz_id:   { min: 1, max: 30  },
    page:     { min: 1, max: 604 },
    verse_id: { min: 1, max: 286 } // longest surah; per-surah upper bound checked at file level
};

/**
 * Convenience wrapper. Sends a 400 response and returns null on failure.
 */
export function requireId(res, raw, kind) {
    const range = RANGES[kind] || { min: 1, max: 999 };
    const n = parsePositiveInt(raw, range);
    if (n === null) {
        handleError(res, 400, `Invalid ${kind}.`, {
            message: `${kind} must be an integer in [${range.min}, ${range.max}].`,
            received: String(raw ?? '')
        });
        return null;
    }
    return n;
}

/**
 * Defense in depth: assert resolved file path stays inside an allowed root.
 * Throws if escape detected (caller should treat as 400).
 */
export function assertInside(filePath, rootDir) {
    const resolved = path.resolve(filePath);
    const root = path.resolve(rootDir);
    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
        throw new Error('path escape detected');
    }
    return resolved;
}
