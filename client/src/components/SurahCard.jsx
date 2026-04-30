import { Link } from 'react-router-dom';

export default function SurahCard({ surah }) {
  return (
    <Link
      to={`/surah/${surah.number}`}
      className="group bg-white border border-brand-100 hover:border-brand-400 rounded-xl p-4 shadow-sm hover:shadow-md transition flex items-center gap-3"
    >
      <div className="relative shrink-0">
        <svg viewBox="0 0 40 40" className="w-12 h-12 text-brand-500 group-hover:text-brand-700 transition">
          <polygon
            points="20,2 38,20 20,38 2,20"
            fill="currentColor"
            opacity="0.15"
          />
          <polygon
            points="20,2 38,20 20,38 2,20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-bold text-brand-800">
          {surah.number}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-ui font-bold text-xl text-brand-900 truncate">
          {surah.name?.ar}
        </h3>
        <p className="text-sm text-brand-700">
          {surah.revelation_place?.ar} · {surah.verses_count} آيات
        </p>
      </div>
    </Link>
  );
}
