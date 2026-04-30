import { Link } from 'react-router-dom';
import { formatNumber } from '../api/stats.js';

/**
 * BarChart — رسم شريطي عمودي بعرض كامل، RTL-aware.
 * data: [{ label, value, href? }]
 */
export function BarChart({ data, max, height = 220, format = formatNumber, color = '#3d8054' }) {
  if (!data?.length) return null;
  const top = max ?? Math.max(...data.map((d) => d.value));
  const cw = 36;
  const gap = 8;
  const width = data.length * (cw + gap);
  const chartH = height - 36;

  return (
    <div className="overflow-x-auto scroll-shadow">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="xMinYMid meet" style={{ minWidth: 320 }}>
        {/* baseline */}
        <line x1="0" y1={chartH} x2={width} y2={chartH} stroke="#dcecdf" strokeWidth="1" />
        {data.map((d, i) => {
          const h = top > 0 ? Math.max(2, (d.value / top) * (chartH - 4)) : 0;
          const x = i * (cw + gap) + gap / 2;
          const y = chartH - h;
          const bar = (
            <g key={d.label + i}>
              <title>{`${d.label}: ${format(d.value)}`}</title>
              <rect x={x} y={y} width={cw} height={h} rx="4" fill={color} opacity="0.85" />
              <text
                x={x + cw / 2}
                y={chartH + 14}
                fontSize="10"
                textAnchor="middle"
                fill="#255134"
                style={{ fontFamily: 'Cairo,sans-serif' }}
              >
                {d.label}
              </text>
              <text
                x={x + cw / 2}
                y={y - 4}
                fontSize="10"
                textAnchor="middle"
                fill="#1f4029"
                style={{ fontFamily: 'Cairo,sans-serif' }}
              >
                {format(d.value)}
              </text>
            </g>
          );
          return d.href ? <a href={d.href} key={i}>{bar}</a> : bar;
        })}
      </svg>
    </div>
  );
}

/**
 * PieChart بسيطة بـ SVG لمقارنة قيمتين أو ثلاث.
 * data: [{ label, value, color }]
 */
export function PieChart({ data, size = 180 }) {
  if (!data?.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;
  const arcs = data.map((d, i) => {
    const startA = (acc / total) * 2 * Math.PI;
    acc += d.value;
    const endA = (acc / total) * 2 * Math.PI;
    const large = endA - startA > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.sin(startA);
    const y1 = cy - r * Math.cos(startA);
    const x2 = cx + r * Math.sin(endA);
    const y2 = cy - r * Math.cos(endA);
    const dPath = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
    return <path key={i} d={dPath} fill={d.color} stroke="white" strokeWidth="2" />;
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs}
      </svg>
      <ul className="flex flex-wrap gap-3 justify-center text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
            <span className="text-brand-700">
              {d.label}: <span className="font-bold text-brand-900">{formatNumber(d.value)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * RankingCard — قائمة أعلى/أدنى N سور مع شريط نسبي.
 */
export function RankingCard({ title, subtitle, items, valueKey = 'verses_count' }) {
  if (!items?.length) return null;
  const max = Math.max(...items.map((s) => s[valueKey] || 0));
  return (
    <div className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
      <header className="bg-brand-50 px-4 py-2.5 border-b border-brand-100">
        <h3 className="font-bold text-brand-800">{title}</h3>
        {subtitle && <p className="text-xs text-brand-600 mt-0.5">{subtitle}</p>}
      </header>
      <ul className="divide-y divide-brand-50">
        {items.map((s, i) => {
          const v = s[valueKey] || 0;
          const pct = max > 0 ? (v / max) * 100 : 0;
          return (
            <li key={s.number} className="px-4 py-2.5 hover:bg-brand-50/40">
              <div className="flex items-center justify-between gap-3 text-sm mb-1">
                <Link
                  to={`/surah/${s.number}`}
                  className="flex items-center gap-2 min-w-0 flex-1 hover:text-brand-700"
                >
                  <span className="text-brand-500 font-mono text-xs w-5">{i + 1}.</span>
                  <span className="font-bold text-brand-900 truncate">{s.name?.ar}</span>
                </Link>
                <span className="font-bold text-brand-700 shrink-0">{formatNumber(v)}</span>
              </div>
              <div className="h-1.5 bg-brand-50 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
