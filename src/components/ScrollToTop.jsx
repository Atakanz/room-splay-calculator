import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Her rota (sayfa) değiştiğinde scroll pozisyonunu sıfırla
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}