import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Loading from './components/Loading.jsx';
import Footer from './components/Footer.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

function App() {
  const [globalLoading, setGlobalLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handlePageLoad = () => {
      setTimeout(() => {
        setGlobalLoading(false);
      }, 800);
    };

    if (document.readyState === 'complete') {
      handlePageLoad();
    } else {
      window.addEventListener('load', handlePageLoad);
      return () => window.removeEventListener('load', handlePageLoad);
    }
  }, []);

  // 🚦 2. Etap: Sayfa her değiştiğinde hortumun anlık tetiklenmesi
  useEffect(() => {
    // 🧠 ÇÖZÜM: Senkron çağrıyı engellemek için state değişimini asenkron bir callback'e sarmalıyoruz
    const timer = setTimeout(() => {
      setGlobalLoading(true);

      // Sayfa içeriğinin yüklenmesi simülasyonu bittiğinde loading'i kapat
      setTimeout(() => setGlobalLoading(false), 600);
    }, 0); // 0ms olsa bile asenkron kuyruğa girdiği için React artık kızmaz

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="w-full min-h-screen bg-white text-black font-sans antialiased relative">
      <ScrollToTop />
      {/* 🌀 Eğer globalLoading true ise senin hazırladığın o şık component devreye giriyor */}
      {globalLoading && <Loading />}

      {/* 🧩 GLOBAL LAYOUT ELEMANLARI */}
      <Navbar />

      <main className="w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;