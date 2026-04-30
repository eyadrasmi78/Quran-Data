import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import {
  computeGlobalStats,
  formatNumber,
  LINES_PER_PAGE
} from '../api/stats.js';
import StatTile from '../components/StatTile.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function StatsPage() {
  const [surahs, setSurahs] = useState(null);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('number'); // number | verses | words | letters

  useEffect(() => {
    api.surahs().then(setSurahs).catch((e) => setError(e.message));
  }, []);

  const global = useMemo(
    () => (surahs ? computeGlobalStats(surahs) : null),
    [surahs]
  );

  const ranked = useMemo(() => {
    if (!surahs) return [];
    const copy = [...surahs];
    const sorters = {
      number:  (a, b) => a.number - b.number,
      verses:  (a, b) => b.verses_count  - a.verses_count,
      words:   (a, b) => b.words_count   - a.words_count,
      letters: (a, b) => b.letters_count - a.letters_count
    };
    return copy.sort(sorters[sortBy] || sorters.number);
  }, [surahs, sortBy]);

  if (error)
    return (
      <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">
        تعذّر تحميل الإحصائيات: {error}
      </div>
    );
  if (!surahs || !global) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-brand-800">الإحصائيات العامة للقرآن الكريم</h1>
        <p className="text-brand-700 mt-1">
          محسوبة من بيانات المشروع المحلية على Docker.
        </p>
      </header>

      {/* الشبكة العامة */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatTile label="عدد السور"    value={formatNumber(global.surahs)}  icon="📖" accent="brand" />
        <StatTile label="عدد الأجزاء"  value={formatNumber(global.juzs)}    icon="📚" accent="brand" />
        <StatTile label="عدد الصفحات" value={formatNumber(global.pages)}    icon="📄" accent="brand" />
        <StatTile label="عدد الآيات"   value={formatNumber(global.verses)}  icon="✦"  accent="sand"  />
        <StatTile label="عدد الكلمات"  value={formatNumber(global.words)}   icon="🔤" accent="sand"  />
        <StatTile label="عدد الحروف"   value={formatNumber(global.letters)} icon="ا"  accent="sand"  />
        <StatTile
          label={`عدد الأسطر (${LINES_PER_PAGE} للصفحة)`}
          value={formatNumber(global.approxLines)}
          icon="≡"
          accent="night"
        />
        <StatTile
          label="مكي / مدني"
          value={`${formatNumber(global.meccan)} / ${formatNumber(global.medinan)}`}
          icon="🕋"
          accent="night"
        />
      </section>

      {/* جدول السور */}
      <section className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
        <div className="bg-brand-50 px-5 py-3 border-b border-brand-100 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold text-brand-800">إحصائيات حسب السورة</h2>
          <div className="me-auto flex items-center gap-2 text-sm">
            <label className="text-brand-700">ترتيب حسب:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 border border-brand-200 rounded-md bg-white"
            >
              <option value="number">رقم السورة</option>
              <option value="verses">عدد الآيات (تنازلي)</option>
              <option value="words">عدد الكلمات (تنازلي)</option>
              <option value="letters">عدد الحروف (تنازلي)</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto scroll-shadow">
          <table className="w-full text-right">
            <thead className="bg-brand-50/50 text-brand-700">
              <tr>
                <Th>#</Th>
                <Th>السورة</Th>
                <Th>المكان</Th>
                <Th>الآيات</Th>
                <Th>الكلمات</Th>
                <Th>الحروف</Th>
                <Th>إجراء</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {ranked.map((s) => (
                <tr key={s.number} className="hover:bg-brand-50/40">
                  <Td className="font-bold">{s.number}</Td>
                  <Td className="font-ui font-bold text-brand-900">{s.name?.ar}</Td>
                  <Td>{s.revelation_place?.ar}</Td>
                  <Td>{formatNumber(s.verses_count)}</Td>
                  <Td>{formatNumber(s.words_count)}</Td>
                  <Td>{formatNumber(s.letters_count)}</Td>
                  <Td>
                    <Link
                      to={`/surah/${s.number}`}
                      className="text-brand-600 hover:text-brand-800 underline decoration-dotted"
                    >
                      التفاصيل ←
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const Th = ({ children }) => (
  <th className="px-4 py-2 text-sm font-bold whitespace-nowrap">{children}</th>
);
const Td = ({ children, className = '' }) => (
  <td className={`px-4 py-2 whitespace-nowrap ${className}`}>{children}</td>
);
