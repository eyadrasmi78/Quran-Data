import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="bg-white rounded-2xl border border-brand-100 p-10 text-center">
      <h1 className="text-3xl font-bold text-brand-800 mb-2">الصفحة غير موجودة</h1>
      <p className="text-brand-700 mb-6">لم نتمكن من إيجاد الصفحة المطلوبة.</p>
      <Link to="/" className="inline-block px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-bold">
        العودة إلى السور
      </Link>
    </div>
  );
}
