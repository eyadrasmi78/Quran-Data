import { NavLink, Link } from 'react-router-dom';
import SearchBar from './SearchBar.jsx';

const navItems = [
  { to: '/', label: 'السور', end: true },
  { to: '/juz', label: 'الأجزاء' },
  { to: '/pages', label: 'المصحف' },
  { to: '/sajda', label: 'السجدات' },
  { to: '/stats', label: 'الإحصائيات' }
];

export default function Layout({ children }) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-gradient-to-l from-brand-700 via-brand-600 to-brand-500 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center gap-4">
          <Link to="/" className="flex items-center gap-3 font-bold text-2xl">
            <img src="/favicon.svg" alt="" className="w-9 h-9" />
            <span>القرآن الكريم</span>
          </Link>
          <nav className="flex flex-wrap gap-1 me-auto">
            {navItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-bold transition ${
                    isActive
                      ? 'bg-white text-brand-700'
                      : 'hover:bg-white/15 text-white/90'
                  }`
                }
              >
                {it.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <SearchBar />
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>

      <footer className="bg-brand-900 text-brand-100 text-center py-4 text-sm">
        <p>
          واجهة عربية لمشروع{' '}
          <a
            href="https://github.com/rn0x/Quran-Data"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-white"
          >
            Quran-Data
          </a>{' '}
          — جميع البيانات محلية على Docker
        </p>
      </footer>
    </div>
  );
}
