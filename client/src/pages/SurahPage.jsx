import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { computeSurahStats } from '../api/stats.js';
import VerseList from '../components/VerseList.jsx';
import AudioPlayer from '../components/AudioPlayer.jsx';
import SurahStats from '../components/SurahStats.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function SurahPage() {
  const { id } = useParams();
  const [surah, setSurah] = useState(null);
  const [pages, setPages] = useState(null);
  const [allSurahs, setAllSurahs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSurah(null);
    setPages(null);
    setError(null);
    Promise.all([
      api.surah(id),
      api.pages({ surah_id: id }).catch(() => []),
      api.surahs()
    ])
      .then(([s, p, all]) => {
        setSurah(s);
        setPages(p);
        setAllSurahs(all);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const stats = useMemo(
    () => (surah ? computeSurahStats(surah, pages, allSurahs || []) : null),
    [surah, pages, allSurahs]
  );

  if (error)
    return (
      <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">
        تعذّر تحميل السورة: {error}
      </div>
    );
  if (!surah) return <LoadingSpinner />;

  const num = parseInt(id, 10);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-6 border border-brand-200 shadow-sm">
        <div>
          <p className="text-sm text-brand-600 mb-1">سورة رقم {surah.number}</p>
          <h1 className="text-3xl font-bold text-brand-900 font-ui">{surah.name?.ar}</h1>
          <p className="text-brand-700 mt-1">
            {stats?.startPage && stats?.endPage && (
              <>
                تبدأ في الصفحة <Link className="underline decoration-dotted" to={`/pages/${stats.startPage}`}>{stats.startPage}</Link>
                {' '}وتنتهي في الصفحة{' '}
                <Link className="underline decoration-dotted" to={`/pages/${stats.endPage}`}>{stats.endPage}</Link>
                {' '}({stats.pagesCount} صفحة)
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {num > 1 && (
            <Link
              to={`/surah/${num - 1}`}
              className="px-3 py-2 rounded-md bg-brand-50 border border-brand-200 hover:bg-brand-100"
            >
              ← السابقة
            </Link>
          )}
          {num < 114 && (
            <Link
              to={`/surah/${num + 1}`}
              className="px-3 py-2 rounded-md bg-brand-50 border border-brand-200 hover:bg-brand-100"
            >
              التالية →
            </Link>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold text-brand-800 mb-3">الاستماع</h2>
        <AudioPlayer tracks={surah.audio} />
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1 lg:sticky lg:top-4 self-start">
          <SurahStats stats={stats} />
        </aside>

        <section className="lg:col-span-2 min-w-0">
          <h2 className="text-xl font-bold text-brand-800 mb-3">الآيات</h2>
          <VerseList
            verses={(surah.verses || []).map((v) => ({
              ...v,
              surahNumber: surah.number,
              surahName: surah.name?.ar
            }))}
          />
        </section>
      </div>
    </div>
  );
}
