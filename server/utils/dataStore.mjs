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
const REVELATION_PATH = path.join(DATA_ROOT, 'computed', 'revelationOrder.json');
const HIZB_PATH       = path.join(DATA_ROOT, 'computed', 'hizbBoundaries.json');

// Arabic letter set used across all text aggregations
const ARABIC_LETTERS = 'ابتثجحخدذرزسشصضطظعغفقكلمنهويءأإآةىؤئ'.split('');
const ARABIC_LETTER_RE = /[ء-غـ-يٮ-ٯٱ-ۓۺ-ۿ]/g;
const TASHKEEL_RE = /[ً-ْٰـ]/g; // diacritics + tatweel

function stripDiacritics(text) {
  return (text || '').replace(TASHKEEL_RE, '').trim();
}
function normalizeArabic(text) {
  return stripDiacritics(text)
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ة/g, 'ه');
}
function tokenizeWords(text) {
  return stripDiacritics(text).split(/\s+/).filter(Boolean);
}

// Caches keyed by integer id. Populated once at boot.
const surahById = new Map(); // 1..114 → full surah object (with verses + audio)
const audioById = new Map(); // 1..114 → array of audio entries
let metadata = [];           // 114-element array as returned by /api/surahs
let pagesData = [];          // 604-element array (raw pagesQuran.json)

let loaded = false;
let sajdaVersesCache = null; // computed lazily once
let revelationOrder = [];    // [{number, order, period}]
let hizbBoundaries = [];     // [{hizb, juz, start: {surah, verse}}]

// Lazy-computed aggregations (filled on first request, cached forever)
let letterFreqCache = null;
let wordFreqCache = null;
let verseLengthDistCache = null;
let versesPerPageCache = null;
let hapaxCache = null;
let definiteArticleCache = null;
let revelationStatsCache = null;
let surahExtremesCache = null;

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

    // Optional reference data — gracefully handle if missing.
    try {
        revelationOrder = fs.existsSync(REVELATION_PATH) ? fs.readJSONSync(REVELATION_PATH) : [];
    } catch { revelationOrder = []; }
    try {
        hizbBoundaries = fs.existsSync(HIZB_PATH) ? fs.readJSONSync(HIZB_PATH) : [];
    } catch { hizbBoundaries = []; }

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

// ── Reference data ─────────────────────────────────────────────────
export function getRevelationOrder() { return revelationOrder; }
export function getHizbBoundaries()  { return hizbBoundaries;  }

// ── Aggregations (all cached after first call) ─────────────────────

/** Frequency of each Arabic letter across the whole Quran (diacritics stripped). */
export function letterFrequency() {
    if (letterFreqCache) return letterFreqCache;
    const counts = Object.fromEntries(ARABIC_LETTERS.map((l) => [l, 0]));
    for (const surah of surahById.values()) {
        for (const v of surah.verses || []) {
            const text = stripDiacritics(v.text?.ar || '');
            for (const ch of text) {
                if (counts[ch] != null) counts[ch] += 1;
            }
        }
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    letterFreqCache = ARABIC_LETTERS.map((letter) => ({
        letter,
        count: counts[letter],
        percent: +(counts[letter] / total * 100).toFixed(3)
    })).sort((a, b) => b.count - a.count);
    return letterFreqCache;
}

/** Top-N word frequencies (normalized: diacritics stripped, alif/ya/hamza unified). */
export function wordFrequency(limit = 100) {
    if (!wordFreqCache) {
        const map = new Map();
        for (const surah of surahById.values()) {
            for (const v of surah.verses || []) {
                for (const w of tokenizeWords(v.text?.ar || '')) {
                    const norm = normalizeArabic(w);
                    if (!norm) continue;
                    map.set(norm, (map.get(norm) || 0) + 1);
                }
            }
        }
        wordFreqCache = [...map.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([word, count]) => ({ word, count }));
    }
    return wordFreqCache.slice(0, Math.max(1, Math.min(1000, limit)));
}

/** Histogram of verse word counts (buckets: 1, 2, 3..., 50+). */
export function verseLengthDistribution() {
    if (verseLengthDistCache) return verseLengthDistCache;
    const buckets = new Array(51).fill(0); // 0..49 + 50+ at index 50
    let totalVerses = 0;
    let maxVerse = null;
    let minVerse = null;
    for (const surah of surahById.values()) {
        for (const v of surah.verses || []) {
            const w = tokenizeWords(v.text?.ar || '').length;
            const idx = w >= 50 ? 50 : w;
            buckets[idx] += 1;
            totalVerses += 1;
            if (!maxVerse || w > maxVerse._w) {
                maxVerse = { surahNumber: surah.number, surahName: surah.name?.ar, number: v.number, words: w, text: v.text?.ar };
            }
            if (minVerse == null || w < minVerse._w) {
                minVerse = { surahNumber: surah.number, surahName: surah.name?.ar, number: v.number, words: w, text: v.text?.ar };
            }
            if (maxVerse) maxVerse._w = maxVerse.words;
            if (minVerse) minVerse._w = minVerse.words;
        }
    }
    verseLengthDistCache = {
        totalVerses,
        buckets: buckets.map((count, words) => ({
            words: words === 50 ? '50+' : words,
            count
        })).filter((b) => b.count > 0),
        longest: maxVerse,
        shortest: minVerse
    };
    return verseLengthDistCache;
}

/** Number of verses on each page of the mushaf (length 604). */
export function versesPerPage() {
    if (versesPerPageCache) return versesPerPageCache;
    const counts = new Array(605).fill(0);
    for (const surah of surahById.values()) {
        for (const v of surah.verses || []) {
            if (v.page >= 1 && v.page <= 604) counts[v.page] += 1;
        }
    }
    versesPerPageCache = counts.slice(1).map((count, i) => ({ page: i + 1, count }));
    return versesPerPageCache;
}

/** Words that appear in only one surah (hapax), top by total count across all occurrences. */
export function hapaxLegomena(limit = 100) {
    if (hapaxCache) return hapaxCache.slice(0, Math.max(1, Math.min(500, limit)));
    const wordSurahs = new Map();    // word → Set<surahNumber>
    const wordCounts = new Map();    // word → total count
    const wordSamples = new Map();   // word → first {surahNumber, name, verseNumber}
    for (const surah of surahById.values()) {
        for (const v of surah.verses || []) {
            for (const w of tokenizeWords(v.text?.ar || '')) {
                const norm = normalizeArabic(w);
                if (!norm) continue;
                if (!wordSurahs.has(norm)) {
                    wordSurahs.set(norm, new Set());
                    wordSamples.set(norm, {
                        surahNumber: surah.number,
                        surahName: surah.name?.ar,
                        verseNumber: v.number
                    });
                }
                wordSurahs.get(norm).add(surah.number);
                wordCounts.set(norm, (wordCounts.get(norm) || 0) + 1);
            }
        }
    }
    hapaxCache = [];
    for (const [word, surahs] of wordSurahs) {
        if (surahs.size === 1) {
            hapaxCache.push({
                word,
                count: wordCounts.get(word),
                ...wordSamples.get(word)
            });
        }
    }
    hapaxCache.sort((a, b) => b.count - a.count);
    return hapaxCache.slice(0, Math.max(1, Math.min(500, limit)));
}

/** Stats on definite article (ال) prefix usage per surah. */
export function definiteArticleStats() {
    if (definiteArticleCache) return definiteArticleCache;
    const perSurah = [];
    let totalWords = 0, totalDef = 0;
    for (const surah of surahById.values()) {
        let words = 0, def = 0;
        for (const v of surah.verses || []) {
            for (const w of tokenizeWords(v.text?.ar || '')) {
                const stripped = stripDiacritics(w);
                words += 1;
                // Match ال prefix (الـ, الـ with hamza wasl ٱل) — common cases
                if (/^(?:ال|ٱل)/.test(stripped) && stripped.length > 2) def += 1;
            }
        }
        totalWords += words;
        totalDef += def;
        perSurah.push({
            number: surah.number,
            name: surah.name?.ar,
            words,
            definite: def,
            percent: words ? +(def / words * 100).toFixed(2) : 0
        });
    }
    definiteArticleCache = {
        totalWords,
        totalDefinite: totalDef,
        overallPercent: totalWords ? +(totalDef / totalWords * 100).toFixed(2) : 0,
        perSurah
    };
    return definiteArticleCache;
}

/** Aggregate stats by revelation place (Meccan vs Medinan). */
export function revelationPlaceStats() {
    if (revelationStatsCache) return revelationStatsCache;
    const groups = { meccan: [], medinan: [] };
    for (const surah of surahById.values()) {
        const place = (surah.revelation_place?.en || '').toLowerCase();
        const ar = surah.revelation_place?.ar || '';
        const key = place.includes('mecc') || ar.includes('مكية') ? 'meccan' : 'medinan';
        groups[key].push({
            number: surah.number,
            name: surah.name?.ar,
            verses: surah.verses_count,
            words: surah.words_count,
            letters: surah.letters_count
        });
    }
    function summarize(arr) {
        if (!arr.length) return { count: 0 };
        const verses = arr.reduce((a, s) => a + s.verses, 0);
        const words = arr.reduce((a, s) => a + s.words, 0);
        const letters = arr.reduce((a, s) => a + s.letters, 0);
        return {
            count: arr.length,
            verses,
            words,
            letters,
            avgVersesPerSurah: +(verses / arr.length).toFixed(1),
            avgWordsPerSurah: +(words / arr.length).toFixed(1),
            avgWordsPerVerse: verses ? +(words / verses).toFixed(2) : 0
        };
    }
    revelationStatsCache = {
        meccan: { ...summarize(groups.meccan), surahs: groups.meccan },
        medinan: { ...summarize(groups.medinan), surahs: groups.medinan }
    };
    return revelationStatsCache;
}

/** For each surah, identify its longest and shortest verses. */
export function surahExtremes() {
    if (surahExtremesCache) return surahExtremesCache;
    const out = [];
    for (const surah of surahById.values()) {
        let longest = null, shortest = null;
        for (const v of surah.verses || []) {
            const w = tokenizeWords(v.text?.ar || '').length;
            if (!longest || w > longest.words) longest = { number: v.number, words: w };
            if (!shortest || w < shortest.words) shortest = { number: v.number, words: w };
        }
        out.push({
            number: surah.number,
            name: surah.name?.ar,
            verses: surah.verses_count,
            avgWordsPerVerse: surah.verses_count
                ? +(surah.words_count / surah.verses_count).toFixed(2)
                : 0,
            longest,
            shortest
        });
    }
    surahExtremesCache = out;
    return out;
}

/** Side-by-side comparison of two surahs. */
export function compareSurahs(s1, s2) {
    const a = surahById.get(s1);
    const b = surahById.get(s2);
    if (!a || !b) return null;
    function pack(surah) {
        const verses = surah.verses || [];
        const verseLengths = verses.map((v) => tokenizeWords(v.text?.ar || '').length);
        return {
            number: surah.number,
            name: surah.name?.ar,
            place: surah.revelation_place?.ar,
            verses: surah.verses_count,
            words: surah.words_count,
            letters: surah.letters_count,
            startPage: Math.min(...verses.map((v) => v.page)),
            endPage: Math.max(...verses.map((v) => v.page)),
            juzs: [...new Set(verses.map((v) => v.juz))].sort((a, b) => a - b),
            sajdaCount: verses.filter((v) => v.sajda).length,
            avgWordsPerVerse: verses.length
                ? +(surah.words_count / verses.length).toFixed(2)
                : 0,
            longestVerseWords: Math.max(...verseLengths, 0),
            shortestVerseWords: Math.min(...verseLengths, Infinity) === Infinity
                ? 0 : Math.min(...verseLengths)
        };
    }
    return { a: pack(a), b: pack(b) };
}
