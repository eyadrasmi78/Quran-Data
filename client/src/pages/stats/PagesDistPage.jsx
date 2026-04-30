import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { formatNumber } from '../../api/stats.js';
import Histogram from '../../components/Histogram.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function PagesDistPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.stats.versesPerPage().then(setData).catch((e) => setError(e.message));
  }, []);

  const { sorted, avg, max, min } = useMemo(() => {
    if (!data) return {};
    const totals = data.map((d) => d.count);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const max = data.reduce((a, b) => (b.count > a.count ? b : a));
    const min = data.reduce((a, b) => (b.count < a.count ? b : a));
    const sorted = [...data].sort((a, b) => b.count - a.count);
    return { sorted, avg: avg.toFixed(2), max, min };
  }, [data]);

  if (error) return <Err msg={error} />;
  if (!data) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-800">توزيع الآيات على الصفحات</h1>
        <p className="text-brand-700 mt-1">
          عدد الآيات في كل صفحة من الـ604 صفحة (مصحف المدينة).
        </p>
      </header>

      <section className="grid sm:grid-cols-3 gap-3">
        <Card label="متوسط الآيات/صفحة" value={avg} />
        <Card label="أكثر صفحة آيات"
              value={`${max.count} آية`}
              extra={<Link to={`/pages/${max.page}`} className="text-brand-600 hover:underline text-sm">صفحة {max.page} ←</Link>} />
        <Card label="أقل صفحة آيات"
              value={`${min.count} آية`}
              extra={<Link to={`/pages/${min.page}`} className="text-brand-600 hover:underline text-sm">صفحة {min.page} ←</Link>} />
      </section>

      <section className="bg-white rounded-2xl border border-brand-200 p-5 shadow-sm">
        <h2 className="font-bold text-brand-800 mb-3">رسم بياني — كل عمود يمثّل صفحة</h2>
        <Histogram
          buckets={data.map((d) => ({ label: String(d.page), count: d.count }))}
          height={260}
        />
      </section>

      <section className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
        <header className="bg-brand-50 px-5 py-3 border-b border-brand-100">
          <h2 className="font-bold text-brand-800">أكثر 30 صفحة احتواءً للآيات</h2>
        </header>
        <div className="overflow-x-auto scroll-shadow">
          <table className="w-full text-right">
            <thead className="bg-brand-50/50 text-brand-700">
              <tr>
                <th className="px-4 py-2 text-sm">#</th>
                <th className="px-4 py-2 text-sm">الصفحة</th>
                <th className="px-4 py-2 text-sm">عدد الآيات</th>
                <th className="px-4 py-2 text-sm">عرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {sorted.slice(0, 30).map((s, i) => (
                <tr key={s.page} className="hover:bg-brand-50/40">
                  <td className="px-4 py-2 text-brand-500">{i + 1}</td>
                  <td className="px-4 py-2 font-bold">{s.page}</td>
                  <td className="px-4 py-2 font-bold text-brand-700">{s.count}</td>
                  <td className="px-4 py-2">
                    <Link to={`/pages/${s.page}`} className="text-brand-600 hover:text-brand-800 underline decoration-dotted">
                      افتح الصفحة ←
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const Card = ({ label, value, extra }) => (
  <div className="bg-white border border-brand-200 rounded-xl p-4">
    <p className="text-brand-600 text-sm">{label}</p>
    <p className="text-2xl font-bold text-brand-900 mt-1">{value}</p>
    {extra && <div className="mt-1">{extra}</div>}
  </div>
);
const Err = ({ msg }) => <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">{msg}</div>;
