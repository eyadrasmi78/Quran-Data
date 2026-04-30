import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import VerseList from '../components/VerseList.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function SajdaPage() {
  const [verses, setVerses] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.sajda().then(setVerses).catch((e) => setError(e.message));
  }, []);

  if (error)
    return (
      <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">
        تعذّر تحميل آيات السجدة: {error}
      </div>
    );
  if (!verses) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-brand-200 shadow-sm">
        <h1 className="text-2xl font-bold text-brand-800">آيات السجدة</h1>
        <p className="text-brand-700 mt-1">عدد الآيات: {verses.length}</p>
      </div>
      <VerseList verses={verses} showSurahName />
    </div>
  );
}
