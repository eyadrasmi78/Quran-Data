import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import SurahCard from '../components/SurahCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function HomePage() {
  const [surahs, setSurahs] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [place, setPlace] = useState('all');

  useEffect(() => {
    api.surahs().then(setSurahs).catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (!surahs) return [];
    return surahs.filter((s) => {
      const matchText =
        !filter ||
        s.name?.ar?.includes(filter) ||
        String(s.number) === filter.trim();
      const matchPlace =
        place === 'all' ||
        (place === 'meccan' &&
          (s.revelation_place?.en?.toLowerCase().includes('mecc') ||
            s.revelation_place?.ar?.includes('مكية'))) ||
        (place === 'medinan' &&
          (s.revelation_place?.en?.toLowerCase().includes('medin') ||
            s.revelation_place?.ar?.includes('مدنية')));
      return matchText && matchPlace;
    });
  }, [surahs, filter, place]);

  if (error) return <ErrorBox msg={error} />;
  if (!surahs) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-brand-800">السور — {surahs.length}</h1>
        <div className="me-auto flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="ابحث باسم السورة أو رقمها…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-brand-200 rounded-md bg-white focus:outline-none focus:border-brand-500"
          />
          <select
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="px-3 py-2 border border-brand-200 rounded-md bg-white"
          >
            <option value="all">الكل</option>
            <option value="meccan">مكية</option>
            <option value="medinan">مدنية</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-brand-700 py-10">لا توجد نتائج مطابقة.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <SurahCard key={s.number} surah={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">
      تعذّر تحميل السور: {msg}
    </div>
  );
}
