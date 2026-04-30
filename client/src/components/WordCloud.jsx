import { formatNumber } from '../api/stats.js';

/**
 * Lightweight pseudo-word-cloud — sized by relative frequency, no overlap math.
 * words: [{ word, count }]
 */
export default function WordCloud({ words = [], max = 80 }) {
  if (!words.length) return null;
  const top = words.slice(0, max);
  const peak = top[0].count || 1;
  const palette = ['#1f4029', '#255134', '#2d6541', '#3d8054', '#5e9d72', '#8ebd9b'];

  return (
    <div className="bg-white rounded-2xl border border-brand-200 p-5 shadow-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-1 items-baseline justify-center font-quran" dir="rtl">
        {top.map((w, i) => {
          const ratio = w.count / peak;
          const fontSize = 0.9 + ratio * 2.6; // 0.9rem..3.5rem
          const color = palette[Math.floor((1 - ratio) * (palette.length - 1))];
          return (
            <span
              key={w.word + i}
              title={`${w.word}: ${formatNumber(w.count)}`}
              style={{
                fontSize: `${fontSize}rem`,
                color,
                lineHeight: 1.2,
                opacity: 0.55 + ratio * 0.45
              }}
              className="select-none"
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
