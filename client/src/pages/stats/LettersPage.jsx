import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { formatNumber } from '../../api/stats.js';
import Histogram from '../../components/Histogram.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function LettersPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.stats.letters().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <Err msg={error} />;
  if (!data) return <LoadingSpinner />;

  const total = data.reduce((a, l) => a + l.count, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-800">تكرار الحروف العربية</h1>
        <p className="text-brand-700 mt-1">
          مجموع الحروف الهجائية في القرآن: <b>{formatNumber(total)}</b> — مرتّبة من الأكثر شيوعاً.
        </p>
      </header>

      <section className="bg-white rounded-2xl border border-brand-200 p-5 shadow-sm">
        <Histogram
          buckets={data.map((l) => ({ label: l.letter, count: l.count }))}
          height={260}
        />
      </section>

      <section className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
        <header className="bg-brand-50 px-5 py-3 border-b border-brand-100">
          <h2 className="font-bold text-brand-800">جدول كامل (28 حرفاً + الهمزات وما يشابهها)</h2>
        </header>
        <div className="overflow-x-auto scroll-shadow">
          <table className="w-full text-right">
            <thead className="bg-brand-50/50 text-brand-700">
              <tr>
                <th className="px-4 py-2 text-sm">الترتيب</th>
                <th className="px-4 py-2 text-sm">الحرف</th>
                <th className="px-4 py-2 text-sm">العدد</th>
                <th className="px-4 py-2 text-sm">النسبة</th>
                <th className="px-4 py-2 text-sm">شريط نسبي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {data.map((l, i) => {
                const max = data[0].count;
                return (
                  <tr key={l.letter} className="hover:bg-brand-50/40">
                    <td className="px-4 py-2 font-bold text-brand-700">{i + 1}</td>
                    <td className="px-4 py-2 font-quran text-2xl text-brand-900">{l.letter}</td>
                    <td className="px-4 py-2 font-bold">{formatNumber(l.count)}</td>
                    <td className="px-4 py-2 text-brand-700">{l.percent}%</td>
                    <td className="px-4 py-2 w-1/3">
                      <div className="h-2 bg-brand-50 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500" style={{ width: `${(l.count / max) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const Err = ({ msg }) => (
  <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">{msg}</div>
);
