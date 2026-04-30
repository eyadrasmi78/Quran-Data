import { useState, useMemo } from 'react';

export default function AudioPlayer({ tracks }) {
  const [selectedId, setSelectedId] = useState(tracks?.[0]?.id ?? null);

  const current = useMemo(
    () => tracks?.find((t) => t.id === selectedId) || tracks?.[0],
    [tracks, selectedId]
  );

  if (!tracks?.length) {
    return (
      <div className="bg-white border border-brand-100 rounded-xl p-4 text-brand-700">
        لا توجد تسجيلات صوتية.
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-200 rounded-xl p-4 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3 min-w-0">
        <label className="font-bold text-brand-800 shrink-0">القارئ:</label>
        <select
          value={current?.id}
          onChange={(e) => setSelectedId(parseInt(e.target.value, 10))}
          className="flex-1 min-w-0 max-w-full px-3 py-2 border border-brand-200 rounded-md bg-brand-50 focus:outline-none focus:border-brand-500 truncate"
        >
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.reciter?.ar} {t.rewaya?.ar ? `— ${t.rewaya.ar}` : ''}
            </option>
          ))}
        </select>
      </div>
      <audio
        key={current?.link}
        controls
        className="w-full"
        src={current?.link}
      >
        المتصفح لا يدعم تشغيل الصوت.
      </audio>
    </div>
  );
}
