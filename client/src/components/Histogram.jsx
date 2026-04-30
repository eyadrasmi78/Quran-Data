import { formatNumber } from '../api/stats.js';

/**
 * Histogram — buckets prop: [{ label, count }]
 */
export default function Histogram({ buckets, height = 220, color = '#3d8054' }) {
  if (!buckets?.length) return null;
  const max = Math.max(...buckets.map((b) => b.count));
  const cw = 18, gap = 2;
  const width = buckets.length * (cw + gap);
  const chartH = height - 28;

  return (
    <div className="overflow-x-auto scroll-shadow">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="xMinYMid meet" style={{ minWidth: 320 }}>
        <line x1="0" y1={chartH} x2={width} y2={chartH} stroke="#dcecdf" />
        {buckets.map((b, i) => {
          const h = max > 0 ? Math.max(1, (b.count / max) * (chartH - 4)) : 0;
          const x = i * (cw + gap);
          const y = chartH - h;
          return (
            <g key={i}>
              <title>{`${b.label}: ${formatNumber(b.count)}`}</title>
              <rect x={x} y={y} width={cw} height={h} rx="2" fill={color} opacity="0.85" />
              {(i % Math.max(1, Math.ceil(buckets.length / 12)) === 0 || i === buckets.length - 1) && (
                <text
                  x={x + cw / 2}
                  y={chartH + 14}
                  fontSize="9"
                  textAnchor="middle"
                  fill="#255134"
                  style={{ fontFamily: 'Cairo,sans-serif' }}
                >
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
