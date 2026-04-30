import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { formatNumber } from '../../api/stats.js';
import Histogram from '../../components/Histogram.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function VersesPage() {
  const [dist, setDist] = useState(null);
  const [extremes, setExtremes] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.stats.distribution(), api.stats.extremes()])
      .then(([d, e]) => { setDist(d); setExtremes(e); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Err msg={error} />;
  if (!dist || !extremes) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-800">إحصائيات الآيات</h1>
        <p className="text-brand-700 mt-1">
          توزيع طول الآيات (بالكلمات)، أطول وأقصر آية في كل سورة.
        </p>
      </header>

      <section className="grid lg:grid-cols-2 gap-3">
        <Card>
          <p className="text-brand-600 text-sm mb-1">أطول آية في القرآن</p>
          <p className="text-xl font-bold text-brand-900">
            <Link to={`/surah/${dist.longest.surahNumber}#verse-${dist.longest.surahNumber}-${dist.longest.number}`} className="hover:underline">
              {dist.longest.surahName} — آية {dist.longest.number}
            </Link>
          </p>
          <p className="text-brand-700 text-sm mt-1">{formatNumber(dist.longest.words)} كلمة (آية الدّيْن)</p>
        </Card>
        <Card>
          <p className="text-brand-600 text-sm mb-1">أقصر آية في القرآن</p>
          <p className="text-xl font-bold text-brand-900">
            <Link to={`/surah/${dist.shortest.surahNumber}#verse-${dist.shortest.surahNumber}-${dist.shortest.number}`} className="hover:underline">
              {dist.shortest.surahName} — آية {dist.shortest.number}
            </Link>
          </p>
          <p className="text-brand-700 text-sm mt-1 font-quran">{dist.shortest.text}</p>
        </Card>
      </section>

      <section className="bg-white rounded-2xl border border-brand-200 p-5 shadow-sm">
        <h2 className="font-bold text-brand-800 mb-3">
          توزيع طول الآيات — مجموع {formatNumber(dist.totalVerses)} آية
        </h2>
        <Histogram
          buckets={dist.buckets.map((b) => ({ label: String(b.words), count: b.count }))}
          height={240}
        />
        <p className="text-xs text-brand-500 mt-2">
          المحور الأفقي: عدد الكلمات في الآية. آخر شريط هو "50+".
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
        <header className="bg-brand-50 px-5 py-3 border-b border-brand-100">
          <h2 className="font-bold text-brand-800">أطول وأقصر آية لكل سورة</h2>
        </header>
        <div className="overflow-x-auto scroll-shadow">
          <table className="w-full text-right">
            <thead className="bg-brand-50/50 text-brand-700">
              <tr>
                <th className="px-4 py-2 text-sm">#</th>
                <th className="px-4 py-2 text-sm">السورة</th>
                <th className="px-4 py-2 text-sm">الآيات</th>
                <th className="px-4 py-2 text-sm">متوسط كلمات/آية</th>
                <th className="px-4 py-2 text-sm">أطول آية</th>
                <th className="px-4 py-2 text-sm">أقصر آية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {extremes.map((s) => (
                <tr key={s.number} className="hover:bg-brand-50/40">
                  <td className="px-4 py-2 font-bold">{s.number}</td>
                  <td className="px-4 py-2">
                    <Link to={`/surah/${s.number}`} className="text-brand-700 hover:underline font-bold">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{formatNumber(s.verses)}</td>
                  <td className="px-4 py-2">{s.avgWordsPerVerse}</td>
                  <td className="px-4 py-2 text-brand-700">آية {s.longest?.number} ({s.longest?.words} كلمة)</td>
                  <td className="px-4 py-2 text-brand-700">آية {s.shortest?.number} ({s.shortest?.words} كلمة)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const Card = ({ children }) => <div className="bg-white border border-brand-200 rounded-xl p-4 shadow-sm">{children}</div>;
const Err = ({ msg }) => <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">{msg}</div>;
