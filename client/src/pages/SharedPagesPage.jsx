import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { formatNumber } from '../api/stats.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function SharedPagesPage() {
  const [allPages, setAllPages] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.allPages().then(setAllPages).catch((e) => setError(e.message));
  }, []);

  const shared = useMemo(() => {
    if (!allPages) return [];
    return allPages
      .filter((p) => p.start.surah_number !== p.end.surah_number)
      .map((p) => {
        const surahsCount = p.end.surah_number - p.start.surah_number + 1;
        return { ...p, surahsCount };
      });
  }, [allPages]);

  if (error)
    return (
      <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">
        تعذّر التحميل: {error}
      </div>
    );
  if (!allPages) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-800">الصفحات المشتركة</h1>
        <p className="text-brand-700 mt-1">
          هذه {formatNumber(shared.length)} صفحة من أصل {formatNumber(allPages.length)} تشترك فيها سورتان أو أكثر — معظمها في نهاية المصحف بسبب قِصَر السور.
        </p>
      </header>

      <div className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto scroll-shadow">
          <table className="w-full text-right">
            <thead className="bg-brand-50 text-brand-700">
              <tr>
                <Th>الصفحة</Th>
                <Th>عدد السور</Th>
                <Th>تبدأ بـ</Th>
                <Th>تنتهي بـ</Th>
                <Th>إجراء</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {shared.map((p) => (
                <tr key={p.page} className="hover:bg-brand-50/40">
                  <Td className="font-bold">{formatNumber(p.page)}</Td>
                  <Td>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-sm font-bold">
                      {formatNumber(p.surahsCount)}
                    </span>
                  </Td>
                  <Td>
                    <Link to={`/surah/${p.start.surah_number}`} className="text-brand-700 hover:underline">
                      {p.start.name?.ar}
                    </Link>{' '}
                    <span className="text-brand-500 text-sm">(آية {formatNumber(p.start.verse)})</span>
                  </Td>
                  <Td>
                    <Link to={`/surah/${p.end.surah_number}`} className="text-brand-700 hover:underline">
                      {p.end.name?.ar}
                    </Link>{' '}
                    <span className="text-brand-500 text-sm">(آية {formatNumber(p.end.verse)})</span>
                  </Td>
                  <Td>
                    <Link
                      to={`/pages/${p.page}`}
                      className="text-brand-600 hover:text-brand-800 underline decoration-dotted"
                    >
                      افتح الصفحة ←
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const Th = ({ children }) => (
  <th className="px-4 py-2 text-sm font-bold whitespace-nowrap">{children}</th>
);
const Td = ({ children, className = '' }) => (
  <td className={`px-4 py-2 whitespace-nowrap ${className}`}>{children}</td>
);
