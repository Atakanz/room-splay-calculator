import { Link } from 'react-router-dom';

export default function Footer() {

    const currentYear = new Date().getFullYear();
    const handleScrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };


    return (
        <footer className="w-full bg-white border-t border-neutral-200/80 pt-12 md:pt-16 pb-8 px-4 sm:px-6 md:px-8 xl:px-12 overflow-hidden">

            {/* 🔮 ELEGANT DÖNEN DAİRE ANIMASYON MOTORU */}
            <style>{`
                @keyframes footerElegantSpin {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }

                .footer-circle-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 32px;
                    height: 32px;
                    border: 1px solid #e5e5e5;
                    border-top-color: #171717;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 0;
                    animation: footerElegantSpin 4s linear infinite;
                }
            `}</style>

            <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-10 md:gap-12">

                {/* 🌌 ÜST ALAN (Mobil/Tablette Flex Sütun, Masaüstünde 3'lü Eşit Grid) */}
                <div className="flex flex-col md:grid md:grid-cols-3 gap-10 md:gap-6 lg:gap-12 items-start text-center">

                    {/* BLOK 1: İsim ve Açıklama */}
                    <div className="flex flex-col gap-3 w-full items-center md:text-left min-w-0">
                        <a
                            style={{ fontFamily: "base-font, sans-serif" }}
                            className="text-3xl sm:text-4xl text-black font-light tracking-tight cursor-pointer select-none"
                            href="/"
                        >
                            DEU
                        </a>
                    </div>

                    {/* BLOK 2: Link Merkezi (İç Bölümler ve İletişim) */}
                    <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full max-w-md mx-auto justify-center">
                        {/* Navigasyon */}
                        <div className="flex flex-col gap-4 items-center">
                            <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest select-none">SECTIONS</p>
                            <ul className="flex flex-col gap-2.5 text-xs sm:text-sm font-light text-neutral-600 items-center">

                                <li><Link to="/kategoriler" className="hover:text-black transition-colors duration-200">About Project</Link></li>
                                <li><Link to="/blog" className="hover:text-black transition-colors duration-200">Calculator</Link></li>
                            </ul>
                        </div>

                    </div>


                </div>

                {/* ────────────── RELEF ÇİZGİSİ ────────────── */}
                <div className="w-full h-[1px] bg-neutral-200/60" />

                {/* 🔒 ALT ALAN */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] sm:text-xs font-mono text-neutral-400">
                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
                        <span>© {currentYear} ATAKAN ZERAFET.</span>
                        <span className="hidden sm:inline text-neutral-200">|</span>
                        <span className="text-[9px] sm:text-[10px] tracking-tight text-neutral-400/80">TÜM HAKLARI SAKLIDIR.</span>
                    </div>

                    <button
                        onClick={handleScrollToTop}
                        className="group flex items-center gap-1 hover:text-black transition-colors duration-200 uppercase tracking-wider text-[10px] cursor-pointer pb-2 sm:pb-0"
                    >
                        <span>[ BAŞA DÖN ]</span>
                        <span className="group-hover:-translate-y-0.5 transition-transform duration-200">↑</span>
                    </button>
                </div>

            </div>
        </footer>
    );
}