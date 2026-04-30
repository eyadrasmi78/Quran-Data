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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
