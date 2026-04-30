import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import VerseList from '../components/VerseList.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function JuzPage() {
  const { id } = useParams();
  const n = parseInt(id, 10);
  const [verses, setVerses] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setVerses(null);
    setError(null);
    api.juz(n).then(setVerses).catch((e) => setError(e.message));
  }, [n]);

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
      <p className="text-brand-700">عدد الآيات في هذا الجزء: {verses.length}</p>
      <VerseList verses={verses} showSurahName />
    </div>
  );
}
