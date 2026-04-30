import { handleError } from '../utils/errorUtils.mjs';
import { requireId, parsePositiveInt } from '../utils/validators.mjs';
import {
    letterFrequency,
    wordFrequency,
    verseLengthDistribution,
    versesPerPage,
    hapaxLegomena,
    definiteArticleStats,
    revelationPlaceStats,
    surahExtremes,
    compareSurahs,
    getRevelationOrder,
    getHizbBoundaries,
    getMetadata
} from '../utils/dataStore.mjs';

function fail500(res, label, err) {
    console.error(`[${label}]`, err);
    return handleError(res, 500, 'An internal error occurred.', { message: 'Please try again later.' });
}

export const getLetters = (req, res) => {
    try {
        res.json({ success: true, result: letterFrequency() });
    } catch (e) { fail500(res, 'getLetters', e); }
};

export const getWords = (req, res) => {
    const limit = parsePositiveInt(req.query.limit, { min: 1, max: 1000 }) ?? 100;
    try {
        res.json({ success: true, result: wordFrequency(limit) });
    } catch (e) { fail500(res, 'getWords', e); }
};

export const getVerseDistribution = (req, res) => {
    try {
        res.json({ success: true, result: verseLengthDistribution() });
    } catch (e) { fail500(res, 'getVerseDistribution', e); }
};

export const getVersesPerPage = (req, res) => {
    try {
        res.json({ success: true, result: versesPerPage() });
    } catch (e) { fail500(res, 'getVersesPerPage', e); }
};

export const getHapax = (req, res) => {
    const limit = parsePositiveInt(req.query.limit, { min: 1, max: 500 }) ?? 50;
    try {
        res.json({ success: true, result: hapaxLegomena(limit) });
    } catch (e) { fail500(res, 'getHapax', e); }
};

export const getDefiniteArticle = (req, res) => {
    try {
        res.json({ success: true, result: definiteArticleStats() });
    } catch (e) { fail500(res, 'getDefiniteArticle', e); }
};

export const getRevelationStats = (req, res) => {
    try {
        const stats = revelationPlaceStats();
        const chronology = getRevelationOrder();
        const meta = getMetadata();
        const enrichedChrono = chronology.map((c) => {
            const m = meta.find((s) => s.number === c.number);
            return { ...c, name: m?.name?.ar, verses: m?.verses_count, place: m?.revelation_place?.ar };
        });
        res.json({ success: true, result: { ...stats, chronology: enrichedChrono } });
    } catch (e) { fail500(res, 'getRevelationStats', e); }
};

export const getSurahExtremes = (req, res) => {
    try {
        res.json({ success: true, result: surahExtremes() });
    } catch (e) { fail500(res, 'getSurahExtremes', e); }
};

export const getHizbs = (req, res) => {
    try {
        const boundaries = getHizbBoundaries();
        const meta = getMetadata();
        const enriched = boundaries.map((h) => {
            const m = meta.find((s) => s.number === h.start.surah);
            return { ...h, start: { ...h.start, name: m?.name?.ar } };
        });
        res.json({ success: true, result: enriched });
    } catch (e) { fail500(res, 'getHizbs', e); }
};

export const getCompare = (req, res) => {
    const s1 = requireId(res, req.params.s1 ?? req.query.s1, 'surah_id');
    if (s1 === null) return;
    const s2 = requireId(res, req.params.s2 ?? req.query.s2, 'surah_id');
    if (s2 === null) return;
    try {
        const result = compareSurahs(s1, s2);
        if (!result) return handleError(res, 404, 'One or both surahs not found.', { s1, s2 });
        res.json({ success: true, result });
    } catch (e) { fail500(res, 'getCompare', e); }
};
