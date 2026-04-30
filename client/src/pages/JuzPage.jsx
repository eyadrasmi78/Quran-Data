import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { computeJuzStats } from '../api/stats.js';
import VerseList from '../components/VerseList.jsx';
import JuzStats from '../components/JuzStats.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function JuzPage() {
  const { id } = useParams();
  const n = parseInt(id, 10);
  const [verses, setVerses] = useState(null);
  const [allSurahs, setAllSurahs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setVerses(null);
    setError(null);
    Promise.all([api.juz(n), api.surahs()])
      .then(([v, s]) => { setVerses(v); setAllSurahs(s); })
      .catch((e) => setError(e.message));
  }, [n]);

  const stats = useMemo(
    () => (verses ? computeJuzStats(n, verses, allSurahs || []) : null),
    [n, verses, allSurahs]
  );

  if (error)
    return (
      <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">
        تعذّر تحميل الجزء: {error}
      </div>
    );
  if (!verses) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-5 border border-brand-200 shadow-sm">
        <h1 className="text-2xl font-bold text-brand-800">الجزء {n}</h1>
        <div className="flex gap-2">
          {n > 1 && (
            <Link to={`/juz/${n - 1}`} className="px-3 py-2 rounded-md bg-brand-50 border border-brand-200 hover:bg-brand-100">
              ← السابق
            </Link>
          )}
          <Link to="/juz" className="px-3 py-2 rounded-md bg-brand-50 border border-brand-200 hover:bg-brand-100">
            كل الأجزاء
          </Link>
          {n < 30 && (
            <Link to={`/juz/${n + 1}`} className="px-3 py-2 rounded-md bg-brand-50 border border-brand-200 hover:bg-brand-100">
              التالي →
            </Link>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1 lg:sticky lg:top-4 self-start">
          <JuzStats stats={stats} />
        </aside>
        <section className="lg:col-span-2 min-w-0">
          <h2 className="text-xl font-bold text-brand-800 mb-3">الآيات</h2>
          <VerseList verses={verses} showSurahName />
        </section>
      </div>
    </div>
  );
}
