import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { formatNumber } from '../../api/stats.js';
import WordCloud from '../../components/WordCloud.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function WordsPage() {
  const [top, setTop] = useState(null);
  const [hapax, setHapax] = useState(null);
  const [definite, setDefinite] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('top');

  useEffect(() => {
    Promise.all([
      api.stats.words(200),
      api.stats.hapax(100),
      api.stats.definite()
    ]).then(([w, h, d]) => { setTop(w); setHapax(h); setDefinite(d); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Err msg={error} />;
  if (!top || !hapax || !definite) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-800">تحليل الكلمات</h1>
        <p className="text-brand-700 mt-1">
          الكلمات الأكثر تكراراً، الكلمات الفريدة، ونسبة التعريف بـ "ال".
        </p>
      </header>

      <nav className="flex gap-2 flex-wrap">
        <Tab id="top"      current={tab} set={setTab}>الأكثر تكراراً</Tab>
        <Tab id="cloud"    current={tab} set={setTab}>سحابة الكلمات</Tab>
        <Tab id="hapax"    current={tab} set={setTab}>الكلمات الفريدة (hapax)</Tab>
        <Tab id="definite" current={tab} set={setTab}>أداة التعريف "ال"</Tab>
      </nav>

      {tab === 'top' && (
        <section className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
          <header className="bg-brand-50 px-5 py-3 border-b border-brand-100">
            <h2 className="font-bold text-brand-800">أعلى 200 كلمة (نسخة موحّدة بدون تشكيل)</h2>
            <p className="text-xs text-brand-600 mt-0.5">
              تم توحيد الأشكال (إ/أ/آ/ٱ ← ا، ى/ئ ← ي، ؤ ← و، ة ← ه) لتفادي تكرار جذور واحدة بأشكال مختلفة.
            </p>
          </header>
          <div className="overflow-x-auto scroll-shadow">
            <table className="w-full text-right">
              <thead className="bg-brand-50/50 text-brand-700">
                <tr>
                  <th className="px-4 py-2 text-sm">#</th>
                  <th className="px-4 py-2 text-sm">الكلمة</th>
                  <th className="px-4 py-2 text-sm">التكرار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {top.map((w, i) => (
                  <tr key={i} className="hover:bg-brand-50/40">
                    <td className="px-4 py-2 text-brand-500">{i + 1}</td>
                    <td className="px-4 py-2 font-quran text-xl text-brand-900">{w.word}</td>
                    <td className="px-4 py-2 font-bold">{formatNumber(w.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'cloud' && (
        <section>
          <p className="text-brand-600 text-sm mb-3">
            حجم كل كلمة يعكس تكرارها — كلمات أكبر = أكثر شيوعاً.
          </p>
          <WordCloud words={top} max={80} />
        </section>
      )}

      {tab === 'hapax' && (
        <section className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
          <header className="bg-brand-50 px-5 py-3 border-b border-brand-100">
            <h2 className="font-bold text-brand-800">كلمات تظهر في سورة واحدة فقط ({formatNumber(hapax.length)} كلمة)</h2>
            <p className="text-xs text-brand-600 mt-0.5">قد تكون مع تكرار داخل نفس السورة، لكن لا تظهر في أي سورة أخرى.</p>
          </header>
          <div className="overflow-x-auto scroll-shadow">
            <table className="w-full text-right">
              <thead className="bg-brand-50/50 text-brand-700">
                <tr>
                  <th className="px-4 py-2 text-sm">#</th>
                  <th className="px-4 py-2 text-sm">الكلمة</th>
                  <th className="px-4 py-2 text-sm">التكرار</th>
                  <th className="px-4 py-2 text-sm">السورة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {hapax.map((w, i) => (
                  <tr key={i} className="hover:bg-brand-50/40">
                    <td className="px-4 py-2 text-brand-500">{i + 1}</td>
                    <td className="px-4 py-2 font-quran text-xl text-brand-900">{w.word}</td>
                    <td className="px-4 py-2 font-bold">{formatNumber(w.count)}</td>
                    <td className="px-4 py-2">
                      <a href={`/surah/${w.surahNumber}`} className="text-brand-700 hover:underline">
                        {w.surahName}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'definite' && (
        <section className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Stat label="إجمالي الكلمات"      value={formatNumber(definite.totalWords)} />
            <Stat label="كلمات بـ &laquo;ال&raquo;" value={formatNumber(definite.totalDefinite)} />
            <Stat label="النسبة"               value={`${definite.overallPercent}%`} />
          </div>
          <div className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
            <header className="bg-brand-50 px-5 py-3 border-b border-brand-100">
              <h2 className="font-bold text-brand-800">نسبة التعريف لكل سورة</h2>
            </header>
            <div className="overflow-x-auto scroll-shadow max-h-[600px]">
              <table className="w-full text-right">
                <thead className="bg-brand-50/50 text-brand-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-sm">#</th>
                    <th className="px-4 py-2 text-sm">السورة</th>
                    <th className="px-4 py-2 text-sm">الكلمات</th>
                    <th className="px-4 py-2 text-sm">بـ "ال"</th>
                    <th className="px-4 py-2 text-sm">النسبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {[...definite.perSurah].sort((a, b) => b.percent - a.percent).map((s) => (
                    <tr key={s.number} className="hover:bg-brand-50/40">
                      <td className="px-4 py-2 font-bold">{s.number}</td>
                      <td className="px-4 py-2"><a href={`/surah/${s.number}`} className="text-brand-700 hover:underline font-bold">{s.name}</a></td>
                      <td className="px-4 py-2">{formatNumber(s.words)}</td>
                      <td className="px-4 py-2">{formatNumber(s.definite)}</td>
                      <td className="px-4 py-2 text-brand-700 font-bold">{s.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Tab({ id, current, set, children }) {
  const active = id === current;
  return (
    <button
      onClick={() => set(id)}
      className={`px-4 py-2 rounded-lg font-bold transition ${
        active ? 'bg-brand-600 text-white' : 'bg-white border border-brand-200 text-brand-700 hover:bg-brand-50'
      }`}
    >
      {children}
    </button>
  );
}
function Stat({ label, value }) {
  return (
    <div className="bg-white border border-brand-200 rounded-xl p-4">
      <p className="text-brand-600 text-sm">{label}</p>
      <p className="text-2xl font-bold text-brand-900 mt-1">{value}</p>
    </div>
  );
}
const Err = ({ msg }) => (
  <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">{msg}</div>
);
