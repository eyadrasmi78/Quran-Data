import { handleError } from '../utils/errorUtils.mjs';
import { requireId } from '../utils/validators.mjs';
import {
    getMetadata,
    getSurah as getSurahCached,
    getAudio as getAudioCached,
    getPages,
    getVerseFromDisk,
    versesByJuz,
    sajdaVerses
} from '../utils/dataStore.mjs';

// Common 500 helper — never exposes internal details to clients.
function fail500(res, label, err) {
    console.error(`[${label}]`, err);
    return handleError(res, 500, 'An internal error occurred.', {
        message: 'Please try again later.'
    });
}

export const getAllSurahs = (req, res) => {
    try {
        res.json({ success: true, result: getMetadata() });
    } catch (error) {
        fail500(res, 'getAllSurahs', error);
    }
};

export const getAllVerses = (req, res) => {
    const surahId = requireId(res, req.params.surah_id ?? req.query.surah_id, 'surah_id');
    if (surahId === null) return;
    try {
        const surah = getSurahCached(surahId);
        if (!surah) return handleError(res, 404, 'The requested verses do not exist.', { surah_id: surahId });
        res.json({ success: true, result: surah.verses });
    } catch (error) {
        fail500(res, 'getAllVerses', error);
    }
};

export const getSurah = (req, res) => {
    const surahId = requireId(res, req.params.surah_id ?? req.query.surah_id, 'surah_id');
    if (surahId === null) return;
    try {
        const surah = getSurahCached(surahId);
        if (!surah) return handleError(res, 404, 'The requested surah does not exist.', { surah_id: surahId });
        res.json({ success: true, result: surah });
    } catch (error) {
        fail500(res, 'getSurah', error);
    }
};

export const getVerse = (req, res) => {
    const surahId = requireId(res, req.params.surah_id ?? req.query.surah_id, 'surah_id');
    if (surahId === null) return;
    const verseId = requireId(res, req.params.verse_id ?? req.query.verse_id, 'verse_id');
    if (verseId === null) return;
    try {
        const verse = getVerseFromDisk(surahId, verseId);
        if (!verse) return handleError(res, 404, 'The requested verse does not exist.', { surah_id: surahId, verse_id: verseId });
        res.json({ success: true, result: verse });
    } catch (error) {
        fail500(res, 'getVerse', error);
    }
};

export const getAudio = (req, res) => {
    const surahId = requireId(res, req.params.surah_id ?? req.query.surah_id, 'surah_id');
    if (surahId === null) return;
    try {
        const audio = getAudioCached(surahId);
        if (!audio) return handleError(res, 404, 'The requested audio does not exist.', { surah_id: surahId });
        res.json({ success: true, result: audio });
    } catch (error) {
        fail500(res, 'getAudio', error);
    }
};

export const getVersesByJuz = (req, res) => {
    const juzId = requireId(res, req.params.juz_id ?? req.query.juz_id, 'juz_id');
    if (juzId === null) return;
    try {
        const verses = versesByJuz(juzId);
        if (verses.length === 0) {
            return handleError(res, 404, 'No verses found for the specified juz.', { juz_id: juzId });
        }
        res.json({ success: true, result: verses });
    } catch (error) {
        fail500(res, 'getVersesByJuz', error);
    }
};

export const getSajdaVerses = (req, res) => {
    try {
        const verses = sajdaVerses();
        if (verses.length === 0) return handleError(res, 404, 'No verses with sajda found.');
        res.json({ success: true, result: verses });
    } catch (error) {
        fail500(res, 'getSajdaVerses', error);
    }
};

export const getPage = (req, res) => {
    // All three params are optional — at least one is required.
    let surahId = null, verseId = null, page = null;
    if (req.params.surah_id != null || req.query.surah_id != null) {
        surahId = requireId(res, req.params.surah_id ?? req.query.surah_id, 'surah_id');
        if (surahId === null) return;
    }
    if (req.params.verse_id != null || req.query.verse_id != null) {
        verseId = requireId(res, req.params.verse_id ?? req.query.verse_id, 'verse_id');
        if (verseId === null) return;
    }
    if (req.query.page != null) {
        page = requireId(res, req.query.page, 'page');
        if (page === null) return;
    }

    if (page == null && surahId == null) {
        return handleError(res, 400, 'At least one of page or surah_id is required.');
    }

    try {
        const pagesData = getPages();
        let result = [];
        if (page != null) {
            result = pagesData.filter(p => p.page === page);
        } else if (surahId != null && verseId != null) {
            result = pagesData.filter(p =>
                (p.start.surah_number === surahId && p.start.verse <= verseId && p.end.verse >= verseId) ||
                (p.end.surah_number === surahId && p.end.verse >= verseId)
            );
        } else if (surahId != null) {
            result = pagesData.filter(p =>
                p.start.surah_number === surahId || p.end.surah_number === surahId
            );
        }

        if (result.length === 0) {
            return handleError(res, 404, 'No pages found for the given query.', {
                surah_id: surahId, verse_id: verseId, page
            });
        }

        const enriched = result.map(item => ({
            page: item.page,
            image: { url: `/data/quran_image/${item.page}.png` },
            ...item
        }));
        res.json({ success: true, result: enriched });
    } catch (error) {
        fail500(res, 'getPage', error);
    }
};
