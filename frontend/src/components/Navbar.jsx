import { useState, useEffect, useRef } from 'react';
// Logoyu import ediyoruz
import logo from '../assets/project_logo_2.png';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrollingUp, setIsScrollingUp] = useState(false);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;

            if (isScrollingUp) {
                if (currentY <= 5) {
                    setIsScrollingUp(false);
                }
                lastScrollY.current = currentY;
                return;
            }

            if (currentY > lastScrollY.current + 7 && isOpen && currentY > 50) {
                setIsOpen(false);
            }

            lastScrollY.current = currentY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isOpen, isScrollingUp]);

    // 🚀 HIZI AYARLANABİLİR ÖZEL SCROLL FONKSİYONU
    const smoothScrollToTop = (duration) => {
        const start = window.scrollY;
        const startTime = performance.now();

        const animateScroll = (currentTime) => {
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);

            // 🎨 Easing Fonksiyonu (easeInOutCubic)
            const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            window.scrollTo(0, start * (1 - ease));

            if (timeElapsed < duration) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    };

    // 🛠️ Burger Butonu Tetikleyicisi
    const handleBurgerClick = () => {
        if (window.scrollY > 50) {
            setIsScrollingUp(true);
            smoothScrollToTop(200);
            setIsOpen(true);
        } else {
            setIsOpen(!isOpen);
        }
    };

    // 🛠️ Mühendislik Tasarımına Uygun Yeni Klasör Sınıfı (Yazı tipi ve boşluk dengesi optimize edildi)
    const navLinkClass = "relative text-slate-700 font-semibold tracking-wider uppercase text-xs md:text-[13px] transition-colors duration-300 ease-in-out hover:text-slate-950 after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-[-8px] after:w-full after:h-[1.5px] after:bg-slate-950 after:scale-x-0 after:origin-center hover:after:scale-x-100 after:transition-transform after:duration-300 block py-4 md:py-0 text-center cursor-pointer select-none";

    return (
        <div className="sticky top-0 z-50">
            <nav className="bg-white/70 backdrop-blur-xl px-6 md:px-12 py-3 border-b border-slate-100/80 select-none transition-all duration-300">
                <style>{`
                    @keyframes elegantSpin {
                        0% { transform: translate(-50%, -50%) rotate(0deg); }
                        100% { transform: translate(-50%, -50%) rotate(360deg); }
                    }
                    .elegant-circle-ring {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        width: 36px;
                        height: 36px;
                        border: 1px solid #e5e5e5;
                        border-top-color: #171717;
                        border-radius: 50%;
                        pointer-events: none;
                        z-index: 0;
                        animation: elegantSpin 4s linear infinite;
                    }
                `}</style>

                <div className="flex items-center justify-between max-w-7xl mx-auto relative">

                    {/* SOL TARAFTAKİ LOGO */}
                    <div className={`flex items-center transition-all duration-300 ${isOpen ? 'opacity-0 md:opacity-100 pointer-events-none' : 'opacity-100'}`}>
                        <a href="/" className="flex items-center">
                            <img src={logo} alt="Project Logo" className="h-14 md:h-16 w-auto object-contain" />
                        </a>
                    </div>

                    {/* ORTADAKİ LOGO (Mobil) */}
                    <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                        <a href="/" className="flex items-center">
                            <img src={logo} alt="Project Logo" className="h-14 w-auto object-contain" />
                        </a>
                    </div>

                    <button type="button" onClick={handleBurgerClick} className={`md:hidden flex flex-col justify-center items-center w-10 h-10 z-50 relative outline-none ml-auto cursor-pointer rounded-full transition-transform duration-500 bg-neutral-50/20 ${isOpen ? 'rotate-180' : 'rotate-0'}`} aria-label="Menüyü Aç/Kapat">
                        <div className="relative w-5 h-5 flex flex-col justify-center items-center">
                            <span className={`w-5 h-[2px] rounded-full transition-all duration-500 ease-in-out absolute origin-center ${isOpen ? 'rotate-45 bg-gradient-to-r from-[#36d7b7] to-[#1da1a1]' : 'bg-black -translate-y-1.5'}`} />
                            <span className={`w-5 h-[2px] rounded-full transition-all duration-500 ease-in-out absolute origin-center bg-black ${isOpen ? 'opacity-0 scale-x-0' : 'opacity-100'}`} />
                            <span className={`w-5 h-[2px] rounded-full transition-all duration-500 ease-in-out absolute origin-center ${isOpen ? '-rotate-45 bg-gradient-to-r from-[#36d7b7] to-[#4ade80]' : 'bg-black translate-y-1.5'}`} />
                        </div>
                    </button>

                    {/* MASAÜSTÜ LİNKLER - Gap mesafeleri ve hizalama sadeleştirildi */}
                    <div className="hidden md:flex items-center ml-auto gap-8">
                        <a href="/" style={{ fontFamily: "base-font" }} onClick={() => setIsOpen(false)} className={navLinkClass}>PROJECT</a>
                        <a href="/calculator" style={{ fontFamily: "base-font" }} onClick={() => setIsOpen(false)} className={navLinkClass}>CALCULATOR</a>
                        <a href="/fsi-calculator" style={{ fontFamily: "base-font" }} onClick={() => setIsOpen(false)} className={navLinkClass}>FSI CALCULATOR</a>
                    </div>
                </div>

                {/* MOBİL MENÜ LİNKLERİ */}
                <div className={`md:hidden transition-all duration-500 ease-in-out ${isOpen ? 'block mt-4 border-t border-neutral-100/70' : 'hidden'}`}>
                    <div className={`w-full px-2 pt-6 pb-4 flex flex-col gap-1 transition-all duration-500 ease-in-out origin-top ${isScrollingUp ? 'bg-white/10 backdrop-blur-3xl blur-[4px] opacity-40 scale-y-95 pointer-events-none' : 'bg-white/80 backdrop-blur-xl opacity-100 scale-y-100'}`}>
                        <a href="/" style={{ fontFamily: "base-font" }} onClick={() => setIsOpen(false)} className={navLinkClass}>ABOUT PROJECT</a>
                        <a href="/calculator" style={{ fontFamily: "base-font" }} onClick={() => setIsOpen(false)} className={navLinkClass}>CALCULATOR</a>
                        <a href="/fsi-calculator" style={{ fontFamily: "base-font" }} onClick={() => setIsOpen(false)} className={navLinkClass}>FSI CALCULATOR</a>
                    </div>
                </div>
            </nav>
        </div>
    );
}