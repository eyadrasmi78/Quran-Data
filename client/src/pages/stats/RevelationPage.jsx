import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { formatNumber } from '../../api/stats.js';
import { PieChart } from '../../components/Charts.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

const PERIOD_LABELS = {
  'meccan-early':  'مكي مبكّر',
  'meccan-middle': 'مكي أوسط',
  'meccan-late':   'مكي متأخّر',
  'medinan':       'مدني'
};
const PERIOD_COLORS = {
  'meccan-early':  '#5e9d72',
  'meccan-middle': '#3d8054',
  'meccan-late':   '#255134',
  'medinan':       '#d97706'
};

export default function RevelationPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.stats.revelation().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <Err msg={error} />;
  if (!data) return <LoadingSpinner />;

  const periodCounts = {};
  data.chronology.forEach((c) => { periodCounts[c.period] = (periodCounts[c.period] || 0) + 1; });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-800">النزول والترتيب الزمني</h1>
        <p className="text-brand-700 mt-1">
          مقارنة بين السور المكية والمدنية، وترتيب نزول السور (وفق المصحف المصري).
        </p>
      </header>

      {/* Summary cards */}
      <section className="grid lg:grid-cols-3 gap-3">
        <Card>
          <h2 className="font-bold text-brand-800 mb-3">السور المكية</h2>
          <Row k="عدد السور"             v={formatNumber(data.meccan.count)} />
          <Row k="مجموع الآيات"          v={formatNumber(data.meccan.verses)} />
          <Row k="مجموع الكلمات"         v={formatNumber(data.meccan.words)} />
          <Row k="متوسط الكلمات/آية"     v={data.meccan.avgWordsPerVerse} />
          <Row k="متوسط آيات/سورة"       v={data.meccan.avgVersesPerSurah} />
        </Card>
        <Card>
          <h2 className="font-bold text-brand-800 mb-3">السور المدنية</h2>
          <Row k="عدد السور"             v={formatNumber(data.medinan.count)} />
          <Row k="مجموع الآيات"          v={formatNumber(data.medinan.verses)} />
          <Row k="مجموع الكلمات"         v={formatNumber(data.medinan.words)} />
          <Row k="متوسط الكلمات/آية"     v={data.medinan.avgWordsPerVerse} />
          <Row k="متوسط آيات/سورة"       v={data.medinan.avgVersesPerSurah} />
        </Card>
        <Card>
          <h2 className="font-bold text-brand-800 mb-3">التوزيع</h2>
          <PieChart
            data={[
              { label: 'مكية', value: data.meccan.count, color: '#3d8054' },
              { label: 'مدنية', value: data.medinan.count, color: '#d97706' }
            ]}
            size={150}
          />
        </Card>
      </section>

      {/* Period breakdown */}
      <section className="bg-white rounded-2xl border border-brand-200 p-5 shadow-sm">
        <h2 className="font-bold text-brand-800 mb-3">المراحل الزمنية للنزول</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <div key={key} className="rounded-xl p-4 text-white" style={{ background: PERIOD_COLORS[key] }}>
              <p className="text-sm opacity-90">{label}</p>
              <p className="text-2xl font-bold">{periodCounts[key] || 0} سورة</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-brand-500 mt-3">
          المرجع: ترتيب نزول السور وفق المصحف المصري الشريف. تختلف بعض الأقوال في تفاصيل الترتيب.
        </p>
      </section>

      {/* Chronology table */}
      <section className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
        <header className="bg-brand-50 px-5 py-3 border-b border-brand-100">
          <h2 className="font-bold text-brand-800">ترتيب النزول الكامل (114 سورة)</h2>
          <p className="text-xs text-brand-600 mt-0.5">من الأقدم إلى الأحدث.</p>
        </header>
        <div className="overflow-x-auto scroll-shadow max-h-[600px]">
          <table className="w-full text-right">
            <thead className="bg-brand-50/50 text-brand-700 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-sm">ترتيب النزول</th>
                <th className="px-4 py-2 text-sm">السورة</th>
                <th className="px-4 py-2 text-sm">الترتيب في المصحف</th>
                <th className="px-4 py-2 text-sm">المكان</th>
                <th className="px-4 py-2 text-sm">المرحلة</th>
                <th className="px-4 py-2 text-sm">الآيات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {data.chronology.map((c) => (
                <tr key={c.order} className="hover:bg-brand-50/40">
                  <td className="px-4 py-2 font-bold text-brand-700">{c.order}</td>
                  <td className="px-4 py-2">
                    <Link to={`/surah/${c.number}`} className="font-bold text-brand-900 hover:text-brand-700">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{c.number}</td>
                  <td className="px-4 py-2">{c.place}</td>
                  <td className="px-4 py-2">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-white text-xs"
                      style={{ background: PERIOD_COLORS[c.period] }}
                    >
                      {PERIOD_LABELS[c.period]}
                    </span>
                  </td>
                  <td className="px-4 py-2">{formatNumber(c.verses)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const Card = ({ children }) => <div className="bg-white border border-brand-200 rounded-xl p-5">{children}</div>;
const Row = ({ k, v }) => (
  <div className="flex justify-between border-b border-brand-50 py-1.5 last:border-0">
    <span className="text-brand-700">{k}</span>
    <span className="font-bold text-brand-900">{v}</span>
  </div>
);
const Err = ({ msg }) => <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">{msg}</div>;
