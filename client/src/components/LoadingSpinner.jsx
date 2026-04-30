export default function LoadingSpinner({ label = 'جارٍ التحميل…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-brand-700">
      <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      <p className="mt-4 font-ui text-lg">{label}</p>
    </div>
  );
}
