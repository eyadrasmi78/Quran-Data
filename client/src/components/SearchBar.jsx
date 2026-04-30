import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const nav = useNavigate();
  const [surah, setSurah] = useState('');
  const [verse, setVerse] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const s = parseInt(surah, 10);
    if (!s || s < 1 || s > 114) return;
    if (verse) {
      nav(`/surah/${s}#verse-${parseInt(verse, 10)}`);
    } else {
      nav(`/surah/${s}`);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-center gap-2 bg-white/90 border border-brand-200 rounded-xl px-3 py-2 shadow-sm"
    >
      <span className="text-brand-700 font-bold">قفز إلى:</span>
      <input
        type="number"
        min="1"
        max="114"
        placeholder="السورة"
        value={surah}
        onChange={(e) => setSurah(e.target.value)}
        className="w-24 px-2 py-1 rounded-md border border-brand-200 focus:outline-none focus:border-brand-500 text-center"
      />
      <span className="text-brand-500">:</span>
      <input
        type="number"
        min="1"
        placeholder="الآية"
        value={verse}
        onChange={(e) => setVerse(e.target.value)}
        className="w-24 px-2 py-1 rounded-md border border-brand-200 focus:outline-none focus:border-brand-500 text-center"
      />
      <button
        type="submit"
        className="px-4 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-bold transition"
      >
        اذهب
      </button>
    </form>
  );
}
