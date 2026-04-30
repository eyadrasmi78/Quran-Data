import { Link } from 'react-router-dom';
import { useState } from 'react';

const TOTAL_PAGES = 604;

export default function PagesPage() {
  const [jump, setJump] = useState('');

  const pages = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-brand-800">المصحف — 604 صفحة</h1>
        <form
          className="me-auto flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseInt(jump, 10);
            if (n >= 1 && n <= TOTAL_PAGES) {
              window.location.assign(`/pages/${n}`);
            }
          }}
        >
          <input
            type="number"
            min="1"
            max={TOTAL_PAGES}
            placeholder="رقم الصفحة"
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            className="px-3 py-2 border border-brand-200 rounded-md bg-white w-32 text-center"
          />
          <button className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-bold">
            افتح
          </button>
        </form>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {pages.map((p) => (
          <Link
            key={p}
            to={`/pages/${p}`}
            className="aspect-[2/3] bg-white rounded-lg border border-brand-100 hover:border-brand-500 hover:shadow flex items-center justify-center font-bold text-brand-800 transition"
          >
            {p}
          </Link>
        ))}
      </div>
    </div>
  );
}
