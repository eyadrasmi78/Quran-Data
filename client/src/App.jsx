import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import SurahPage from './pages/SurahPage.jsx';
import PagesPage from './pages/PagesPage.jsx';
import PageViewerPage from './pages/PageViewerPage.jsx';
import JuzListPage from './pages/JuzListPage.jsx';
import JuzPage from './pages/JuzPage.jsx';
import SajdaPage from './pages/SajdaPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import SharedPagesPage from './pages/SharedPagesPage.jsx';
import LettersPage from './pages/stats/LettersPage.jsx';
import WordsPage from './pages/stats/WordsPage.jsx';
import VersesPage from './pages/stats/VersesPage.jsx';
import PagesDistPage from './pages/stats/PagesDistPage.jsx';
import RevelationPage from './pages/stats/RevelationPage.jsx';
import HizbsPage from './pages/stats/HizbsPage.jsx';
import ComparePage from './pages/ComparePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/surah/:id" element={<SurahPage />} />
        <Route path="/pages" element={<PagesPage />} />
        <Route path="/pages/:page" element={<PageViewerPage />} />
        <Route path="/juz" element={<JuzListPage />} />
        <Route path="/juz/:id" element={<JuzPage />} />
        <Route path="/sajda" element={<SajdaPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/stats/letters"    element={<LettersPage />} />
        <Route path="/stats/words"      element={<WordsPage />} />
        <Route path="/stats/verses"     element={<VersesPage />} />
        <Route path="/stats/pages-dist" element={<PagesDistPage />} />
        <Route path="/stats/revelation" element={<RevelationPage />} />
        <Route path="/stats/hizbs"      element={<HizbsPage />} />
        <Route path="/compare"          element={<ComparePage />} />
        <Route path="/compare/:s1/:s2"  element={<ComparePage />} />
        <Route path="/shared-pages"     element={<SharedPagesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
