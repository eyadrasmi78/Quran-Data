import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function HizbsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.stats.hizbs().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <Err msg={error} />;
  if (!data) return <LoadingSpinner />;

  // Group by juz for nicer display
  const byJuz = {};
  data.forEach((h) => {
    if (!byJuz[h.juz]) byJuz[h.juz] = [];
    byJuz[h.juz].push(h);
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-800">الأحزاب — 60 حزباً</h1>
        <p className="text-brand-700 mt-1">
          القرآن الكريم مقسّم إلى 60 حزباً (كل جزء = حزبان)، و240 ربعاً.
          الجدول التالي يبيّن بداية كل حزب من 60 حسب المصحف المعتمد.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(byJuz).map(([juz, hizbs]) => (
          <div key={juz} className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
            <header className="bg-brand-50 px-4 py-2.5 border-b border-brand-100 flex justify-between items-center">
              <h2 className="font-bold text-brand-800">الجزء {juz}</h2>
              <Link to={`/juz/${juz}`} className="text-sm text-brand-600 hover:underline">عرض الجزء ←</Link>
            </header>
            <ul className="divide-y divide-brand-50">
              {hizbs.map((h) => (
                <li key={h.hizb} className="px-4 py-2.5 hover:bg-brand-50/40">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-brand-900">حزب {h.hizb}</span>
                    <span className="text-xs text-brand-500">
                      {h.hizb % 2 === 1 ? 'النصف الأول' : 'النصف الثاني'}
                    </span>
                  </div>
                  <p className="text-sm text-brand-700 mt-0.5">
                    يبدأ من{' '}
                    <Link
                      to={`/surah/${h.start.surah}#verse-${h.start.surah}-${h.start.verse}`}
                      className="font-bold hover:underline"
                    >
                      {h.start.name} — آية {h.start.verse}
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const Err = ({ msg }) => <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">{msg}</div>;
