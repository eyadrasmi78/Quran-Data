// Statistics helpers — derived purely from existing API data, no server changes.

// مصحف المدينة المنوّرة (King Fahd Complex): 15 سطراً في الصفحة (ما عدا الفاتحة + بداية البقرة).
export const LINES_PER_PAGE = 15;
export const TOTAL_PAGES = 604;
export const TOTAL_JUZS = 30;
export const TOTAL_SURAHS = 114;
// مجموع الآيات الشهير (الفاتحة 7 + بقية القرآن 6229 = 6236).
export const TOTAL_VERSES = 6236;

/**
 * عدد أسطر "زخرفة" بداية السورة (الإطار + البسملة) على أول صفحة منها
 * عندما تبدأ السورة من أعلى الصفحة. القيم مستندة إلى مصحف المدينة:
 *  - الفاتحة: الصفحة 1 بأكملها للسورة بزخرفة كبيرة → 8 أسطر للزخرفة، 7 للآيات
 *  - البقرة: الصفحة 2 بزخرفة استثنائية → 9 أسطر للزخرفة، 6 للآيات
 *  - التوبة: لا بسملة → سطر واحد فقط للعنوان
 *  - الباقي: 3 أسطر تقريباً (إطار العنوان + البسملة)
 */
const SPECIAL_HEADER_LINES = {
  1: 8,
  2: 9,
  9: 1
};
const DEFAULT_HEADER_LINES = 3;

function headerLinesFor(surahNumber) {
  return SPECIAL_HEADER_LINES[surahNumber] ?? DEFAULT_HEADER_LINES;
}

// زخرفة بداية السورة عندما تظهر على صفحة مشتركة (إطار العنوان + البسملة):
const SHARED_PAGE_HEADER_LINES = 2;
const SHARED_PAGE_HEADER_NO_BISMILLAH = 1; // التوبة فقط (سورة 9)

function sharedHeaderFor(surahNumber) {
  return surahNumber === 9 ? SHARED_PAGE_HEADER_NO_BISMILLAH : SHARED_PAGE_HEADER_LINES;
}

/**
 * يحدّد كل السور المشاركة على صفحة واحدة، مع عدد آيات كل منها وما إذا كانت
 * تبدأ على هذه الصفحة (وبالتالي تأخذ زخرفة بداية).
 */
function surahsOnSharedPage(pageInfo, allSurahsMeta) {
  const startS = pageInfo.start.surah_number;
  const endS = pageInfo.end.surah_number;
  const startV = pageInfo.start.verse;
  const endV = pageInfo.end.verse;
  const result = [];

  for (let n = startS; n <= endS; n++) {
    const meta = allSurahsMeta?.find((s) => s.number === n);
    if (!meta) continue;
    const totalV = meta.verses_count;

    let versesOnPage;
    let startsHere; // هل تبدأ السورة على هذه الصفحة (آية 1)؟

    if (n === startS && n === endS) {
      versesOnPage = endV - startV + 1;
      startsHere = startV === 1;
    } else if (n === startS) {
      versesOnPage = totalV - startV + 1;
      startsHere = startV === 1;
    } else if (n === endS) {
      versesOnPage = endV;
      startsHere = true; // هذه السورة لم تبدأ من قبل، إذن تبدأ هنا
    } else {
      versesOnPage = totalV;
      startsHere = true;
    }

    result.push({ number: n, versesOnPage, startsHere });
  }
  return result;
}

/**
 * احسب عدد الأسطر التي تشغلها سورة بدقة باستخدام بيانات الصفحات.
 *
 * - الصفحة الكاملة لهذه السورة (start = end):
 *     - أول صفحة + تبدأ من الآية 1: 15 − headerLinesFor(surah)
 *     - غير ذلك: 15
 * - صفحة مشتركة (سور متعدّدة):
 *     - حصة كل سورة = ⟨آياتها على الصفحة / مجموع الآيات⟩ × (15 − مجموع زخارف بدايات السور)
 *
 * @param {Object} surah        من /api/surah/:id (يحوي verses[])
 * @param {Array}  pages        من /api/pages?surah_id=:id
 * @param {Array}  allSurahsMeta من /api/surahs (verses_count لكل سورة)
 */
export function computeSurahLines(surah, pages, allSurahsMeta = []) {
  const verses = surah?.verses || [];
  if (!verses.length) return { lines: 0, pageBreakdown: [] };

  const versesByPage = new Map();
  for (const v of verses) {
    versesByPage.set(v.page, (versesByPage.get(v.page) || 0) + 1);
  }
  const pagesArr = [...versesByPage.keys()].sort((a, b) => a - b);
  const startPage = pagesArr[0];

  const pageInfoMap = new Map();
  for (const p of pages || []) pageInfoMap.set(p.page, p);

  const breakdown = [];
  let total = 0;

  for (const page of pagesArr) {
    const info = pageInfoMap.get(page);
    const versesOnPage = versesByPage.get(page);

    let lines;
    let shared = false;

    const isFullPage =
      info &&
      info.start?.surah_number === surah.number &&
      info.end?.surah_number === surah.number;

    if (!info || isFullPage) {
      // الصفحة كاملة لهذه السورة
      lines = LINES_PER_PAGE;
      if (page === startPage) lines -= headerLinesFor(surah.number);
    } else {
      // صفحة مشتركة — حصة تناسبية مع خصم زخارف كل السور
      shared = true;
      const surahsOnPage = surahsOnSharedPage(info, allSurahsMeta);

      const totalHeaders = surahsOnPage.reduce(
        (acc, s) => acc + (s.startsHere ? sharedHeaderFor(s.number) : 0),
        0
      );
      const totalVerses = surahsOnPage.reduce((acc, s) => acc + s.versesOnPage, 0) || 1;
      const verseLinesAvail = Math.max(1, LINES_PER_PAGE - totalHeaders);
      const target = surahsOnPage.find((s) => s.number === surah.number);
      const targetVerses = target?.versesOnPage ?? versesOnPage;
      const verseShare = Math.round((targetVerses / totalVerses) * verseLinesAvail);
      // Credit the surah's own header lines back to its line count — the
      // header decoration belongs to the surah, not to the "lost lines" pool.
      const ownHeader = target?.startsHere ? sharedHeaderFor(surah.number) : 0;
      lines = verseShare + ownHeader;
    }

    lines = Math.max(1, lines);
    total += lines;
    breakdown.push({ page, lines, shared, verses: versesOnPage });
  }

  return { lines: total, pageBreakdown: breakdown };
}

/**
 * احسب الإحصائيات العامة من قائمة السور (`/api/surahs`).
 * الأسطر التقريبية = (604 صفحة × 15) − مجموع زخارف بداية كل سورة.
 */
export function computeGlobalStats(surahs) {
  const totalWords = surahs.reduce((acc, s) => acc + (s.words_count || 0), 0);
  const totalLetters = surahs.reduce((acc, s) => acc + (s.letters_count || 0), 0);
  const totalVerses = surahs.reduce((acc, s) => acc + (s.verses_count || 0), 0);
  const meccan = surahs.filter((s) =>
    /mecc|مكية/i.test((s.revelation_place?.en || '') + (s.revelation_place?.ar || ''))
  ).length;
  const medinan = surahs.length - meccan;

  // مجموع زخارف بدايات السور
  const totalHeaders = surahs.reduce((acc, s) => acc + headerLinesFor(s.number), 0);
  const approxLines = TOTAL_PAGES * LINES_PER_PAGE - totalHeaders;

  return {
    surahs: surahs.length,
    juzs: TOTAL_JUZS,
    pages: TOTAL_PAGES,
    verses: totalVerses || TOTAL_VERSES,
    words: totalWords,
    letters: totalLetters,
    approxLines,
    maxLines: TOTAL_PAGES * LINES_PER_PAGE,
    meccan,
    medinan
  };
}

/**
 * إحصائيات سورة واحدة من كائن `/api/surah/:id` (يحوي verses[]).
 * إن مُرّرت بيانات الصفحات (من /api/pages?surah_id=:id) نحسب الأسطر بدقة أعلى.
 */
export function computeSurahStats(surah, pages = null, allSurahsMeta = []) {
  const verses = surah.verses || [];
  const versePages = verses.map((v) => v.page).filter((p) => Number.isFinite(p));
  const juzs = Array.from(
    new Set(verses.map((v) => v.juz).filter((j) => Number.isFinite(j)))
  ).sort((a, b) => a - b);
  const sajdaCount = verses.filter((v) => v.sajda).length;

  const startPage = versePages.length ? Math.min(...versePages) : null;
  const endPage = versePages.length ? Math.max(...versePages) : null;
  const pagesCount = startPage && endPage ? endPage - startPage + 1 : 0;

  const { lines: approxLines, pageBreakdown } = computeSurahLines(
    surah,
    pages,
    allSurahsMeta
  );
  const sharedPages = pageBreakdown.filter((p) => p.shared).length;

  return {
    number: surah.number,
    nameAr: surah.name?.ar,
    revelationPlace: surah.revelation_place?.ar,
    versesCount: surah.verses_count ?? verses.length,
    wordsCount: surah.words_count ?? 0,
    lettersCount: surah.letters_count ?? 0,
    startPage,
    endPage,
    pagesCount,
    sharedPages,
    approxLines,
    pageBreakdown,
    juzs,
    sajdaCount,
    headerLines: headerLinesFor(surah.number)
  };
}

/**
 * Format a number with Arabic-Indic separators (uses Arabic locale).
 */
export function formatNumber(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('ar-EG').format(n);
}

// ────────────────────────────────────────────────────────────────────────
// إحصائيات نصّ الآية: عدّ الكلمات والحروف من النص الفعلي
// ────────────────────────────────────────────────────────────────────────

// نطاق حروف العربية (أساسي + موسّع) — يتجاهل التشكيل والأرقام والرموز
const ARABIC_LETTER_RE = /[ء-غـ-يٮ-ٯٱ-ۓۺ-ۿ]/g;

export function countArabicLetters(text) {
  if (!text) return 0;
  return (text.match(ARABIC_LETTER_RE) || []).length;
}

export function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * احسب إحصائيات نصّية لمصفوفة آيات (تحوي text.ar).
 * مفيد لحساب كلمات وحروف الجزء (الذي لا يأتي معه عدّ جاهز).
 */
export function computeTextStats(verses) {
  let words = 0;
  let letters = 0;
  for (const v of verses) {
    const t = v?.text?.ar || '';
    words += countWords(t);
    letters += countArabicLetters(t);
  }
  return { words, letters };
}

// ────────────────────────────────────────────────────────────────────────
// زمن القراءة — Reading Time Estimator
// ────────────────────────────────────────────────────────────────────────

// كلمات في الدقيقة (تقريبية) لثلاث سرعات تلاوة شائعة:
export const RECITATION_SPEEDS = {
  tarteel:  { wpm: 50,  label: 'ترتيل (بطيء)' },
  tajweed:  { wpm: 80,  label: 'تجويد (متوسّط)' },
  hadr:     { wpm: 120, label: 'حدر (سريع)' }
};

/**
 * Returns a human-readable Arabic duration like "2 ساعة و15 دقيقة".
 */
export function formatDurationAr(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  const total = Math.round(minutes);
  if (total < 1) return 'أقل من دقيقة';
  if (total < 60) return `${formatNumber(total)} دقيقة`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h < 24) {
    return m === 0 ? `${formatNumber(h)} ساعة` : `${formatNumber(h)} س و${formatNumber(m)} د`;
  }
  const d = Math.floor(h / 24);
  const rh = h % 24;
  // Build "X ي و Y س و Z د" omitting any zero parts so we don't drop minutes.
  const parts = [`${formatNumber(d)} ي`];
  if (rh > 0) parts.push(`${formatNumber(rh)} س`);
  if (m > 0) parts.push(`${formatNumber(m)} د`);
  return parts.join(' و');
}

/**
 * احسب أزمنة القراءة للسرعات الثلاث.
 * @param {number} wordCount
 * @returns {{tarteel:number, tajweed:number, hadr:number}} بالدقائق
 */
export function readingTimes(wordCount) {
  if (!wordCount) return { tarteel: 0, tajweed: 0, hadr: 0 };
  return {
    tarteel: wordCount / RECITATION_SPEEDS.tarteel.wpm,
    tajweed: wordCount / RECITATION_SPEEDS.tajweed.wpm,
    hadr:    wordCount / RECITATION_SPEEDS.hadr.wpm
  };
}

/**
 * إذا قرأ المستخدم N صفحة يومياً، كم يوماً يحتاج لإنهاء القرآن (604 صفحة)؟
 */
export function daysToFinish(pagesPerDay) {
  if (!pagesPerDay || pagesPerDay < 1) return 0;
  return Math.ceil(TOTAL_PAGES / pagesPerDay);
}

// ────────────────────────────────────────────────────────────────────────
// الترتيب — Top / Bottom Rankings
// ────────────────────────────────────────────────────────────────────────

export function rankSurahs(surahs, key = 'verses_count', limit = 5, asc = false) {
  const copy = [...surahs];
  copy.sort((a, b) => (asc ? a[key] - b[key] : b[key] - a[key]));
  return copy.slice(0, limit);
}

// ────────────────────────────────────────────────────────────────────────
// التقسيمات الكلاسيكية — Classical Divisions
// ────────────────────────────────────────────────────────────────────────

export const CLASSICAL_DIVISIONS = {
  surahs:     114,
  juzs:       30,    // أجزاء
  hizbs:      60,    // أحزاب (كل جزء = حزبان)
  quarters:   240,   // أرباع (كل حزب = 4 أرباع: ربع، نصف، ثلاثة أرباع، آخر)
  pages:      604,
  manzils:    7,     // منازل (لقراءة القرآن في أسبوع)
  ruku:       556    // ركوع تقريبي (وقفات معروفة)
};

// ────────────────────────────────────────────────────────────────────────
// إحصائيات على مستوى الآية — Verse-level
// ────────────────────────────────────────────────────────────────────────

/**
 * حسب إحصائيات جزء من قائمة آياته (من /api/juz/:id) ومقابل قائمة كل السور.
 * كل آية في الـjuz تحوي surahNumber + surahName + page + sajda + text.ar.
 */
export function computeJuzStats(juzNumber, juzVerses, allSurahsMeta = []) {
  if (!juzVerses?.length) return null;

  const pages = juzVerses.map((v) => v.page).filter(Number.isFinite);
  const startPage = pages.length ? Math.min(...pages) : null;
  const endPage = pages.length ? Math.max(...pages) : null;
  const sajdaCount = juzVerses.filter((v) => v.sajda).length;
  const { words, letters } = computeTextStats(juzVerses);

  // تجميع حسب السورة
  const map = new Map();
  for (const v of juzVerses) {
    const key = v.surahNumber;
    if (!map.has(key)) {
      const meta = allSurahsMeta.find((s) => s.number === key);
      map.set(key, {
        number: key,
        name: v.surahName || meta?.name?.ar || `سورة ${key}`,
        versesInJuz: 0,
        versesTotal: meta?.verses_count || 0
      });
    }
    map.get(key).versesInJuz += 1;
  }
  const surahsBreakdown = [...map.values()].sort((a, b) => a.number - b.number);

  return {
    number: juzNumber,
    verses: juzVerses.length,
    words,
    letters,
    startPage,
    endPage,
    pages: startPage && endPage ? endPage - startPage + 1 : 0,
    surahsCount: surahsBreakdown.length,
    surahsBreakdown,
    sajdaCount
  };
}

export function verseTextStats(verses) {
  // verses: array with text.ar
  if (!verses?.length) return null;
  let longest = null;
  let shortest = null;
  let totalWords = 0;
  let totalLetters = 0;

  for (const v of verses) {
    const t = v?.text?.ar || '';
    const w = countWords(t);
    const l = countArabicLetters(t);
    totalWords += w;
    totalLetters += l;
    if (!longest || w > longest._w) longest = { ...v, _w: w, _l: l };
    if (!shortest || w < shortest._w) shortest = { ...v, _w: w, _l: l };
  }
  return {
    count: verses.length,
    avgWords: totalWords / verses.length,
    avgLetters: totalLetters / verses.length,
    longest,
    shortest,
    totalWords,
    totalLetters
  };
}
