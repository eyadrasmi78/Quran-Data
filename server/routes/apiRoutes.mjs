import express from 'express';
import { getSurah, getAllSurahs, getAllVerses, getVerse, getAudio, getVersesByJuz, getSajdaVerses, getPage } from '../controllers/surahController.mjs';
import {
    getLetters, getWords, getVerseDistribution, getVersesPerPage,
    getHapax, getDefiniteArticle, getRevelationStats, getSurahExtremes,
    getHizbs, getCompare
} from '../controllers/statsController.mjs';
import { handleError } from '../utils/errorUtils.mjs'
const router = express.Router();


// Core data routes
router.get('/surahs', getAllSurahs);
router.get('/surah/:surah_id?', getSurah);
router.get('/verses/:surah_id?', getAllVerses);
router.get('/verse/:surah_id?/:verse_id?', getVerse);
router.get('/sajda', getSajdaVerses);
router.get('/audio/:surah_id?', getAudio);
router.get('/juz/:juz_id?', getVersesByJuz);
router.get('/pages/:surah_id?/:verse_id?', getPage);

// Statistics routes
router.get('/stats/letters',           getLetters);
router.get('/stats/words',             getWords);
router.get('/stats/verse-distribution', getVerseDistribution);
router.get('/stats/verses-per-page',   getVersesPerPage);
router.get('/stats/hapax',             getHapax);
router.get('/stats/definite-article',  getDefiniteArticle);
router.get('/stats/revelation',        getRevelationStats);
router.get('/stats/surah-extremes',    getSurahExtremes);
router.get('/stats/hizbs',             getHizbs);
router.get('/compare/:s1/:s2',         getCompare);

router.use((req, res) => {
    handleError(res, 404, '404 - The requested resource was not found in /api/', {
        message: 'The requested URL was not found on this server.',
    });
});

export default router;
