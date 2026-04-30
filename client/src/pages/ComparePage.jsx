import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { formatNumber } from '../api/stats.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function ComparePage() {
  const { s1: p1, s2: p2 } = useParams();
  const nav = useNavigate();
  const [allSurahs, setAllSurahs] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { api.surahs().then(setAllSurahs).catch(() => {}); }, []);

  useEffect(() => {
    if (!p1 || !p2) return;
    setData(null);
    setError(null);
    api.stats.compare(p1, p2).then(setData).catch((e) => setError(e.message));
  }, [p1, p2]);

  if (!p1 || !p2) {
    return (
      <SurahPicker allSurahs={allSurahs} onPick={(s1, s2) => nav(`/compare/${s1}/${s2}`)} />
    );
  }
  if (error) return <Err msg={error} />;
  if (!data) return <LoadingSpinner />;

  const rows = [
    ['مكان النزول',          'place'],
    ['عدد الآيات',           'verses'],
    ['عدد الكلمات',          'words'],
    ['عدد الحروف',           'letters'],
    ['الصفحة الأولى',         'startPage'],
    ['الصفحة الأخيرة',        'endPage'],
    ['متوسط كلمات/آية',       'avgWordsPerVerse'],
    ['أطول آية (كلمات)',      'longestVerseWords'],
    ['أقصر آية (كلمات)',      'shortestVerseWords'],
    ['الأجزاء',                'juzs'],
    ['آيات السجدة',           'sajdaCount']
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-800">مقارنة بين سورتين</h1>
        <button
          onClick={() => nav('/compare')}
          className="px-3 py-1.5 rounded-md bg-white border border-brand-200 hover:bg-brand-50 text-sm"
        >
          اختر سورتين أخريين
        </button>
      </header>

      <section className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-3 bg-brand-50 border-b border-brand-100">
          <Header surah={data.a} />
          <div className="text-center py-4 text-sm text-brand-600 font-bold">المقارنة</div>
          <Header surah={data.b} />
        </div>
        <div className="divide-y divide-brand-50">
          {rows.map(([label, key]) => {
            const va = data.a[key];
            const vb = data.b[key];
            const fmt = (v) => Array.isArray(v) ? v.join(', ') : (typeof v === 'number' ? formatNumber(v) : v ?? '—');
            const diff = compare(va, vb);
            return (
              <div key={key} className="grid grid-cols-3 items-center hover:bg-brand-50/40">
                <div className={`px-4 py-3 text-right font-bold ${diff < 0 ? 'text-brand-900' : ''}`}>
                  {fmt(va)}
                </div>
                <div className="text-center text-brand-700 text-sm py-3 border-x border-brand-50">
                  {label}
                </div>
                <div className={`px-4 py-3 text-left font-bold ${diff > 0 ? 'text-brand-900' : ''}`}>
                  {fmt(vb)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Header({ surah }) {
  return (
    <div className="text-center py-4 px-3">
      <p className="text-xs text-brand-600">سورة رقم {surah.number}</p>
      <Link to={`/surah/${surah.number}`} className="text-2xl font-bold text-brand-900 hover:underline font-ui">
        {surah.name}
      </Link>
    </div>
  );
}

function compare(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return 0;
}

function SurahPicker({ allSurahs, onPick }) {
  const [s1, setS1] = useState(2);
  const [s2, setS2] = useState(3);
  if (!allSurahs) return <LoadingSpinner />;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-800">مقارنة بين سورتين</h1>
        <p className="text-brand-700 mt-1">اختر سورتين لعرضهما جنباً إلى جنب.</p>
      </header>
      <div className="bg-white rounded-2xl border border-brand-200 p-6 shadow-sm">
        <div className="grid sm:grid-cols-3 gap-4 items-end">
          <SurahSelect label="السورة الأولى" value={s1} onChange={setS1} list={allSurahs} />
          <div className="text-center text-brand-500 text-2xl">⇔</div>
          <SurahSelect label="السورة الثانية" value={s2} onChange={setS2} list={allSurahs} />
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => onPick(s1, s2)}
            disabled={!s1 || !s2 || s1 === s2}
            className="px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            قارن
          </button>
        </div>
      </div>
    </div>
  );
}

function SurahSelect({ label, value, onChange, list }) {
  return (
    <label className="block">
      <span className="text-sm text-brand-700 block mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full px-3 py-2 border border-brand-200 rounded-md bg-white"
      >
        {list.map((s) => (
          <option key={s.number} value={s.number}>
            {s.number}. {s.name?.ar}
          </option>
        ))}
      </select>
    </label>
  );
}

const Err = ({ msg }) => <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">{msg}</div>;
