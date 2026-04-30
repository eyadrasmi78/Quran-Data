import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const TOTAL = 604;

export default function PageViewerPage() {
  const { page } = useParams();
  const n = parseInt(page, 10);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setInfo(null);
    setError(null);
    api.pages({ page: n }).then((r) => setInfo(r?.[0])).catch((e) => setError(e.message));
  }, [n]);

  if (error)
    return (
      <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">
        تعذّر تحميل الصفحة: {error}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-4 border border-brand-200 shadow-sm">
        <h1 className="text-xl font-bold text-brand-800">صفحة {n}</h1>
        <div className="flex gap-2">
          {n > 1 && (
            <Link to={`/pages/${n - 1}`} className="px-3 py-2 rounded-md bg-brand-50 border border-brand-200 hover:bg-brand-100">
              ← السابقة
            </Link>
          )}
          <Link to="/pages" className="px-3 py-2 rounded-md bg-brand-50 border border-brand-200 hover:bg-brand-100">
            كل الصفحات
          </Link>
          {n < TOTAL && (
            <Link to={`/pages/${n + 1}`} className="px-3 py-2 rounded-md bg-brand-50 border border-brand-200 hover:bg-brand-100">
              التالية →
            </Link>
          )}
        </div>
      </div>

      {!info ? (
        <LoadingSpinner />
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-brand-100 p-3 shadow-sm">
            <img
              src={info.image?.url}
              alt={`صفحة ${n}`}
              className="w-full h-auto rounded-lg"
              loading="eager"
            />
          </div>
          <div className="bg-white rounded-2xl border border-brand-100 p-5 shadow-sm space-y-3">
            <h2 className="font-bold text-brand-800 text-lg">معلومات الصفحة</h2>
            <InfoRow label="بداية" data={info.start} />
            <InfoRow label="نهاية" data={info.end} />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, data }) {
  if (!data) return null;
  return (
    <div className="border-t border-brand-100 pt-2">
      <p className="text-sm text-brand-600">{label}</p>
      <p className="font-ui font-bold text-brand-900">
        <Link to={`/surah/${data.surah_number}`} className="hover:underline">
          {data.name?.ar}
        </Link>{' '}
        — آية {data.verse}
      </p>
    </div>
  );
}
