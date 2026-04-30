const BASE = import.meta.env.VITE_API_URL || '/api';

const cache = new Map();

async function get(path, { useCache = true } = {}) {
  if (useCache && cache.has(path)) return cache.get(path);

  const res = await fetch(`${BASE}${path}`);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { message: text }; }

  if (!res.ok || body.success === false) {
    const msg = body.message || body.error || `خطأ ${res.status}`;
    throw new Error(msg);
  }

  if (useCache) cache.set(path, body.result);
  return body.result;
}

export const api = {
  surahs: () => get('/surahs'),
  surah: (id) => get(`/surah/${id}`),
  verses: (id) => get(`/verses/${id}`),
  verse: (s, v) => get(`/verse/${s}/${v}`),
  audio: (id) => get(`/audio/${id}`),
  juz: (id) => get(`/juz/${id}`),
  sajda: () => get('/sajda'),
  pages: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== '')
    ).toString();
    return get(`/pages${qs ? `?${qs}` : ''}`);
  },
  // الملف الخام لكل الصفحات الـ604 — يأتي من /data وليس /api، لذا fetch مباشر
  allPages: async () => {
    if (cache.has('__allPages')) return cache.get('__allPages');
    const r = await fetch('/data/pagesQuran.json');
    if (!r.ok) throw new Error('تعذّر تحميل بيانات الصفحات');
    const data = await r.json();
    cache.set('__allPages', data);
    return data;
  },
  // Statistics
  stats: {
    letters:      ()      => get('/stats/letters'),
    words:        (limit = 100) => get(`/stats/words?limit=${limit}`),
    distribution: ()      => get('/stats/verse-distribution'),
    versesPerPage:()      => get('/stats/verses-per-page'),
    hapax:        (limit = 50)  => get(`/stats/hapax?limit=${limit}`),
    definite:     ()      => get('/stats/definite-article'),
    revelation:   ()      => get('/stats/revelation'),
    extremes:     ()      => get('/stats/surah-extremes'),
    hizbs:        ()      => get('/stats/hizbs'),
    compare:      (a, b)  => get(`/compare/${a}/${b}`)
  }
};
