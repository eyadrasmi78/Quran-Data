export default function StatTile({ label, value, icon, accent = 'brand' }) {
  const palette = {
    brand: 'from-brand-500 to-brand-700 text-white',
    sand:  'from-amber-400 to-amber-600 text-white',
    night: 'from-slate-700 to-slate-900 text-white',
    soft:  'from-brand-50 to-brand-100 text-brand-900 border border-brand-200'
  }[accent] || 'from-brand-500 to-brand-700 text-white';

  return (
    <div className={`bg-gradient-to-br ${palette} rounded-2xl p-5 shadow-sm flex items-start gap-3 min-h-[110px]`}>
      {icon && <div className="text-3xl opacity-80">{icon}</div>}
      <div className="flex-1">
        <div className="text-3xl font-bold leading-none">{value}</div>
        <div className="text-sm opacity-90 mt-2">{label}</div>
      </div>
    </div>
  );
}
