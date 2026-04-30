// Eager in-memory data store — reads all Quran JSON once at boot,
// so request handlers never touch disk or block the event loop.

import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_ROOT       = path.join(__dirname, '..', '..', 'data');
const METADATA_PATH   = path.join(DATA_ROOT, 'json', 'metadata.json');
const SURAH_FOLDER    = path.join(DATA_ROOT, 'json', 'surah');
const AUDIO_FOLDER    = path.join(DATA_ROOT, 'json', 'audio');
const VERSES_FOLDER   = path.join(DATA_ROOT, 'json', 'verses');
const PAGES_PATH      = path.join(DATA_ROOT, 'pagesQuran.json');

// Caches keyed by integer id. Populated once at boot.
const surahById = new Map(); // 1..114 → full surah object (with verses + audio)
const audioById = new Map(); // 1..114 → array of audio entries
let metadata = [];           // 114-element array as returned by /api/surahs
let pagesData = [];          // 604-element array (raw pagesQuran.json)

let loaded = false;
let sajdaVersesCache = null; // computed lazily once

export function loadAll() {
    if (loaded) return;

    metadata = fs.readJSONSync(METADATA_PATH);

    for (let n = 1; n <= 114; n++) {
        const surahFile = path.join(SURAH_FOLDER, `surah_${n}.json`);
        if (fs.existsSync(surahFile)) {
            surahById.set(n, fs.readJSONSync(surahFile));
        }
        const audioFile = path.join(AUDIO_FOLDER, `audio_surah_${n}.json`);
        if (fs.existsSync(audioFile)) {
            audioById.set(n, fs.readJSONSync(audioFile));
        }
    }

    pagesData = fs.readJSONSync(PAGES_PATH);
    loaded = true;
}

export function getMetadata() {
    return metadata;
}

export function getSurah(id) {
    return surahById.get(id) || null;
}

export function getAudio(id) {
    return audioById.get(id) || null;
}

export function getPages() {
    return pagesData;
}

/**
 * Single verse lookup — reads the on-disk per-verse file lazily.
 * Path is constructed only from validated integers, so no traversal risk.
 */
export function getVerseFromDisk(surahId, verseId) {
    const fileName = `${String(surahId).padStart(3, '0')}_${String(verseId).padStart(3, '0')}.json`;
    const versePath = path.join(VERSES_FOLDER, fileName);
    if (!fs.existsSync(versePath)) return null;
    return fs.readJSONSync(versePath);
}

/**
 * Aggregations computed from the in-memory cache (no disk I/O).
 */
export function versesByJuz(juzId) {
    const out = [];
    for (const surah of surahById.values()) {
        for (const v of surah.verses || []) {
            if (v.juz === juzId) {
                out.push({ ...v, surahName: surah.name?.ar, surahNumber: surah.number });
            }
        }
    }
    return out;
}

export function sajdaVerses() {
    if (sajdaVersesCache) return sajdaVersesCache;
    const out = [];
    for (const surah of surahById.values()) {
        for (const v of surah.verses || []) {
            if (v.sajda) {
                out.push({ ...v, surahName: surah.name?.ar, surahNumber: surah.number });
            }
        }
    }
    sajdaVersesCache = out;
    return out;
}
