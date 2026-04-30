import { Link } from 'react-router-dom';

export default function JuzListPage() {
  const juzs = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-800 mb-6">الأجزاء — 30 جزءاً</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {juzs.map((j) => (
          <Link
            key={j}
            to={`/juz/${j}`}
            className="bg-white border border-brand-100 hover:border-brand-500 rounded-xl p-4 text-center shadow-sm hover:shadow transition"
          >
            <div className="text-3xl font-bold text-brand-700">{j}</div>
            <div className="text-sm text-brand-600 mt-1">الجزء</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
