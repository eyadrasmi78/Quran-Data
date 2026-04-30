import { Link } from 'react-router-dom';
import { formatNumber } from '../api/stats.js';

export default function SurahStats({ stats }) {
  if (!stats) return null;

  const rows = [
    { label: 'مكان النزول', value: stats.revelationPlace || '—' },
    { label: 'عدد الآيات', value: formatNumber(stats.versesCount) },
    { label: 'عدد الكلمات', value: formatNumber(stats.wordsCount) },
    { label: 'عدد الحروف', value: formatNumber(stats.lettersCount) },
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
    {
      label: 'عدد الصفحات',
      value: formatNumber(stats.pagesCount),
      hint: stats.sharedPages > 0 ? `منها ${formatNumber(stats.sharedPages)} مشتركة مع سور مجاورة` : null
    },
    {
      label: 'عدد الأسطر التقريبي',
      value: formatNumber(stats.approxLines),
      hint: `15 سطراً/صفحة − ${formatNumber(stats.headerLines)} لزخرفة بداية السورة (مصحف المدينة)`
    },
    {
      label: 'الأجزاء',
      value:
        stats.juzs?.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {stats.juzs.map((j) => (
              <Link
                key={j}
                to={`/juz/${j}`}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-800 text-xs font-bold hover:bg-brand-200"
                title={`الجزء ${j}`}
              >
                {j}
              </Link>
            ))}
          </span>
        ) : '—'
    },
    {
      label: 'آيات السجدة',
      value: stats.sajdaCount > 0 ? (
        <span className="inline-flex items-center gap-1">
          <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-300 text-sm font-bold">
            {formatNumber(stats.sajdaCount)}
          </span>
        </span>
      ) : 'لا يوجد'
    }
  ];

  return (
    <section className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
      <header className="bg-brand-50 px-5 py-3 border-b border-brand-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-800">إحصائيات السورة</h2>
        <span className="text-sm text-brand-600">سورة رقم {stats.number}</span>
      </header>
      <dl className="divide-y divide-brand-50">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-brand-50/50"
          >
            <dt className="text-brand-700">
              {r.label}
              {r.hint && <span className="block text-xs text-brand-500 mt-0.5">{r.hint}</span>}
            </dt>
            <dd className="font-bold text-brand-900 text-lg">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
