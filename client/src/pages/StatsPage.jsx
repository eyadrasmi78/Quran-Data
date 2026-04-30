import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import {
  computeGlobalStats,
  formatNumber,
  formatDurationAr,
  readingTimes,
  daysToFinish,
  rankSurahs,
  CLASSICAL_DIVISIONS,
  RECITATION_SPEEDS,
  LINES_PER_PAGE,
  TOTAL_PAGES
} from '../api/stats.js';
import StatTile from '../components/StatTile.jsx';
import { BarChart, PieChart, RankingCard } from '../components/Charts.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function StatsPage() {
  const [surahs, setSurahs] = useState(null);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('number');
  const [pagesPerDay, setPagesPerDay] = useState(20);

  useEffect(() => {
    api.surahs().then(setSurahs).catch((e) => setError(e.message));
  }, []);

  const global = useMemo(() => (surahs ? computeGlobalStats(surahs) : null), [surahs]);
  const rt = useMemo(() => (global ? readingTimes(global.words) : null), [global]);

  const rankings = useMemo(() => {
    if (!surahs) return null;
    return {
      longestVerses:    rankSurahs(surahs, 'verses_count', 5, false),
      shortestVerses:   rankSurahs(surahs, 'verses_count', 5, true),
      mostWords:        rankSurahs(surahs, 'words_count',  5, false),
      mostLetters:      rankSurahs(surahs, 'letters_count', 5, false)
    };
  }, [surahs]);

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

  const top10ByVerses = useMemo(() => {
    if (!surahs) return [];
    return [...surahs].sort((a, b) => b.verses_count - a.verses_count).slice(0, 10);
  }, [surahs]);

  if (error)
    return (
      <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">
        تعذّر تحميل الإحصائيات: {error}
      </div>
    );
  if (!surahs || !global || !rankings || !rt) return <LoadingSpinner />;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-brand-800">إحصائيات القرآن الكريم</h1>
        <p className="text-brand-700 mt-1">
          محسوبة محلياً من بيانات Docker — بدون تعديل في الـ API.
        </p>
      </header>

      {/* 1) الشبكة العامة */}
      <Section title="نظرة عامة">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatTile label="عدد السور"    value={formatNumber(global.surahs)}  icon="📖" accent="brand" />
          <StatTile label="عدد الأجزاء"  value={formatNumber(global.juzs)}    icon="📚" accent="brand" />
          <StatTile label="عدد الصفحات" value={formatNumber(global.pages)}    icon="📄" accent="brand" />
          <StatTile label="عدد الآيات"   value={formatNumber(global.verses)}  icon="✦"  accent="sand"  />
          <StatTile label="عدد الكلمات"  value={formatNumber(global.words)}   icon="🔤" accent="sand"  />
          <StatTile label="عدد الحروف"   value={formatNumber(global.letters)} icon="ا"  accent="sand"  />
          <StatTile label={`الأسطر التقريبي (${LINES_PER_PAGE}/صفحة)`} value={formatNumber(global.approxLines)} icon="≡" accent="night" />
          <StatTile label="مكي / مدني"   value={`${formatNumber(global.meccan)} / ${formatNumber(global.medinan)}`} icon="🕋" accent="night" />
        </div>
      </Section>

      {/* 2) زمن القراءة */}
      <Section
        title="زمن القراءة المقدّر"
        subtitle="بناءً على عدد الكلمات وسرعات التلاوة المعتادة"
      >
        <div className="grid sm:grid-cols-3 gap-3">
          {Object.entries(RECITATION_SPEEDS).map(([k, v]) => (
            <div key={k} className="bg-white border border-brand-200 rounded-2xl p-5 shadow-sm">
              <p className="text-brand-600 text-sm">{v.label}</p>
              <p className="text-2xl font-bold text-brand-900 mt-1">{formatDurationAr(rt[k])}</p>
              <p className="text-xs text-brand-500 mt-1">~{v.wpm} كلمة/دقيقة</p>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-brand-50 border border-brand-200 rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-brand-800 font-bold">إذا قرأت</span>
            <input
              type="number"
              min="1"
              max="50"
              value={pagesPerDay}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setPagesPerDay(Math.min(50, Math.max(1, Number.isFinite(n) ? n : 1)));
              }}
              className="w-20 px-3 py-1 rounded-md border border-brand-300 text-center bg-white"
            />
            <span className="text-brand-800 font-bold">صفحة يومياً، تنتهي خلال</span>
            <span className="px-3 py-1 rounded-md bg-brand-600 text-white font-bold">
              {formatNumber(daysToFinish(pagesPerDay))} يوماً
            </span>
            <span className="text-brand-600 text-sm">(≈ {formatNumber(Math.ceil(daysToFinish(pagesPerDay)/30))} شهراً)</span>
          </div>
        </div>
      </Section>

      {/* 3) الترتيب — أعلى وأقل */}
      <Section title="الترتيب — أطول وأقصر السور">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <RankingCard title="أطول 5 سور" subtitle="بعدد الآيات"  items={rankings.longestVerses}  valueKey="verses_count" />
          <RankingCard title="أقصر 5 سور" subtitle="بعدد الآيات"  items={rankings.shortestVerses} valueKey="verses_count" />
          <RankingCard title="الأكثر كلمات" subtitle="عدد الكلمات" items={rankings.mostWords}     valueKey="words_count" />
          <RankingCard title="الأكثر حروفاً" subtitle="عدد الحروف" items={rankings.mostLetters}   valueKey="letters_count" />
        </div>
      </Section>

      {/* 4) المخططات */}
      <Section title="مخطّطات بصرية">
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-brand-200 p-5 shadow-sm">
            <h3 className="font-bold text-brand-800 mb-3">أطول 10 سور (آيات)</h3>
            <BarChart
              data={top10ByVerses.map((s) => ({ label: s.name?.ar, value: s.verses_count }))}
              height={240}
            />
          </div>
          <div className="bg-white rounded-2xl border border-brand-200 p-5 shadow-sm flex flex-col">
            <h3 className="font-bold text-brand-800 mb-3">مكي مقابل مدني</h3>
            <div className="flex-1 flex items-center justify-center">
              <PieChart
                data={[
                  { label: 'مكية', value: global.meccan,  color: '#3d8054' },
                  { label: 'مدنية', value: global.medinan, color: '#d97706' }
                ]}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* 5) التقسيمات الكلاسيكية */}
      <Section title="التقسيمات الكلاسيكية" subtitle="معلومة تراثية شائعة في علوم القرآن">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <ClassicTile label="السور"   value={CLASSICAL_DIVISIONS.surahs} />
          <ClassicTile label="الأجزاء" value={CLASSICAL_DIVISIONS.juzs} />
          <ClassicTile label="الأحزاب" value={CLASSICAL_DIVISIONS.hizbs} hint="كل جزء = حزبان" />
          <ClassicTile label="الأرباع" value={CLASSICAL_DIVISIONS.quarters} hint="كل حزب = 4 أرباع" />
          <ClassicTile label="الصفحات" value={CLASSICAL_DIVISIONS.pages} />
          <ClassicTile label="المنازل" value={CLASSICAL_DIVISIONS.manzils} hint="لقراءة القرآن في أسبوع" />
        </div>
      </Section>

      {/* 6) الصفحات المشتركة */}
      <Section title="الصفحات المشتركة">
        <div className="bg-white rounded-2xl border border-brand-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-brand-700">
              في المصحف الشريف صفحات تجتمع فيها أكثر من سورة (خصوصاً قصار السور في الجزء الثلاثين).
            </p>
            <p className="text-brand-500 text-sm mt-1">
              مفيد لفهم الحساب الدقيق لأسطر السور القصيرة.
            </p>
          </div>
          <Link
            to="/shared-pages"
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold"
          >
            عرض الخريطة الكاملة ←
          </Link>
        </div>
      </Section>

      {/* 7) جدول السور */}
      <Section title="إحصائيات حسب السورة">
        <div className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
          <div className="bg-brand-50 px-5 py-3 border-b border-brand-100 flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-bold text-brand-800">جدول كامل ({formatNumber(surahs.length)} سورة)</h3>
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
                  <Th>متوسط كلمات/آية</Th>
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
                    <Td>{(s.words_count / s.verses_count).toFixed(1)}</Td>
                    <Td>
                      <Link to={`/surah/${s.number}`} className="text-brand-600 hover:text-brand-800 underline decoration-dotted">
                        التفاصيل ←
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-xl font-bold text-brand-800">{title}</h2>
        {subtitle && <p className="text-sm text-brand-600 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function ClassicTile({ label, value, hint }) {
  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 shadow-sm">
      <p className="text-brand-600 text-sm">{label}</p>
      <p className="text-2xl font-bold text-brand-900 mt-1">{formatNumber(value)}</p>
      {hint && <p className="text-xs text-brand-500 mt-1">{hint}</p>}
    </div>
  );
}

const Th = ({ children }) => (
  <th className="px-4 py-2 text-sm font-bold whitespace-nowrap">{children}</th>
);
const Td = ({ children, className = '' }) => (
  <td className={`px-4 py-2 whitespace-nowrap ${className}`}>{children}</td>
);
