import { Link } from 'react-router-dom';
import {
  formatNumber,
  formatDurationAr,
  readingTimes,
  RECITATION_SPEEDS
} from '../api/stats.js';

export default function JuzStats({ stats }) {
  if (!stats) return null;
  const rt = readingTimes(stats.words);

  const rows = [
    { label: 'عدد الآيات',  value: formatNumber(stats.verses) },
    { label: 'عدد الكلمات', value: formatNumber(stats.words) },
    { label: 'عدد الحروف',  value: formatNumber(stats.letters) },
    {
      label: 'الصفحة الأولى',
      value: stats.startPage ? (
        <Link to={`/pages/${stats.startPage}`} className="underline decoration-dotted hover:text-brand-700">
          {formatNumber(stats.startPage)}
        </Link>
      ) : '—'
    },
    {
      label: 'الصفحة الأخيرة',
      value: stats.endPage ? (
        <Link to={`/pages/${stats.endPage}`} className="underline decoration-dotted hover:text-brand-700">
          {formatNumber(stats.endPage)}
        </Link>
      ) : '—'
    },
    { label: 'عدد الصفحات', value: formatNumber(stats.pages) },
    { label: 'عدد السور المختلفة', value: formatNumber(stats.surahsCount) },
    { label: 'آيات السجدة',
      value: stats.sajdaCount > 0 ? formatNumber(stats.sajdaCount) : 'لا يوجد'
    },
    { label: RECITATION_SPEEDS.tarteel.label, value: formatDurationAr(rt.tarteel) },
    { label: RECITATION_SPEEDS.tajweed.label, value: formatDurationAr(rt.tajweed) },
    { label: RECITATION_SPEEDS.hadr.label,    value: formatDurationAr(rt.hadr)    }
  ];

  return (
    <section className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
      <header className="bg-brand-50 px-5 py-3 border-b border-brand-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-800">إحصائيات الجزء</h2>
        <span className="text-sm text-brand-600">جزء {stats.number}</span>
      </header>
      <dl className="divide-y divide-brand-50">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-brand-50/50">
            <dt className="text-brand-700">{r.label}</dt>
            <dd className="font-bold text-brand-900 text-lg">{r.value}</dd>
          </div>
        ))}
      </dl>
      {stats.surahsBreakdown?.length > 0 && (
        <div className="bg-brand-50/40 border-t border-brand-100 px-5 py-3">
          <p className="text-sm font-bold text-brand-700 mb-2">السور في هذا الجزء:</p>
          <div className="flex flex-wrap gap-2">
            {stats.surahsBreakdown.map((s) => (
              <Link
                key={s.number}
                to={`/surah/${s.number}`}
                className="inline-flex items-center gap-1 bg-white border border-brand-200 hover:border-brand-500 rounded-full px-3 py-1 text-sm"
                title={`${s.versesInJuz} آية من ${s.versesTotal}`}
              >
                <span className="text-brand-800 font-bold">{s.name}</span>
                <span className="text-brand-500 text-xs">
                  ({formatNumber(s.versesInJuz)})
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
