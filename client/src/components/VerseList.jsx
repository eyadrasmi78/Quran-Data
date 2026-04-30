import { useEffect } from 'react';

export default function VerseList({ verses, showSurahName = false }) {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-brand-300');
        setTimeout(() => el.classList.remove('ring-4', 'ring-brand-300'), 2200);
      }
    }
  }, [verses]);

  if (!verses?.length) {
    return <p className="text-center text-brand-700 py-10">لا توجد آيات.</p>;
  }

  return (
    <div className="space-y-4">
      {verses.map((v) => {
        const surahNo = v.surahNumber ?? '';
        const verseId = `verse-${surahNo ? `${surahNo}-` : ''}${v.number}`;
        return (
          <article
            key={verseId}
            id={verseId}
            className="bg-white rounded-xl p-5 shadow-sm border border-brand-100"
          >
            <div className="flex items-center justify-between text-sm text-brand-700 mb-3">
              <div className="flex gap-2 items-center">
                {showSurahName && v.surahName && (
                  <span className="px-2 py-0.5 rounded bg-brand-50 border border-brand-200">
                    {v.surahName}
                  </span>
                )}
                <span>الجزء {v.juz}</span>
                <span>·</span>
                <span>الصفحة {v.page}</span>
                {v.sajda && (
                  <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">
                    سجدة
                  </span>
                )}
              </div>
              <span className="verse-number">{v.number}</span>
            </div>
            <p className="font-quran text-right text-brand-900">
              {v.text?.ar}
            </p>
          </article>
        );
      })}
    </div>
  );
}
