export default function ControlledRoomVisualizer({ result }) {
    if (!result) return null;

    // Güvenli float dönüşümleri
    const wFront = parseFloat(result.width.front) || 0;
    const wRear = parseFloat(result.width.rear) || 0;
    const length = parseFloat(result.length) || 0;

    const angleDeg = parseFloat(result.angle_deg) || parseFloat(result.angle) || 0;

    // SVG Alanı Boyutlandırma ve Ölçekleme
    const svgWidth = 500;
    const svgHeight = 400;
    const padding = 60;

    const maxRealDim = Math.max(wRear, length);
    const scale = (Math.min(svgWidth, svgHeight) - padding * 2) / maxRealDim;

    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;

    const halfRear = (wRear * scale) / 2;
    const halfLen = (length * scale) / 2;

    // Orijinal Dikdörtgen Köşeleri
    const rLeftTop = { x: centerX - halfRear, y: centerY - halfLen };
    const rRightTop = { x: centerX + halfRear, y: centerY - halfLen };
    const rLeftBot = { x: centerX - halfRear, y: centerY + halfLen };
    const rRightBot = { x: centerX + halfRear, y: centerY + halfLen };

    // Trigonometrik içe doğru daralma ofseti ve ön duvar ölçeği
    const angleRad = (angleDeg * Math.PI) / 180;
    const inwardOffset = length * Math.tan(angleRad) * scale;
    const targetScaleX = (rRightBot.x - inwardOffset - (rLeftBot.x + inwardOffset)) / (rRightBot.x - rLeftBot.x);

    return (
        <div className="mt-6 p-6 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
            <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-4 self-start font-mono">
                Controlled Room Geometry Visualization
            </p>

            <div className="relative w-full max-w-[500px] aspect-[5/4] bg-slate-900/30 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
                <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="font-mono text-[11px] fill-slate-400">
                    <defs>
                        <pattern id="visualizer-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(51, 65, 85, 0.2)" strokeWidth="1" />
                        </pattern>

                        {/* Senkronize Animasyon CSS Blokları */}
                        <style>{`
                            @keyframes swingLeftInward {
                                0%, 100% { transform: rotate(0deg); }
                                50% { transform: rotate(${-angleDeg}deg); }
                            }
                            @keyframes swingRightInward {
                                0%, 100% { transform: rotate(0deg); }
                                50% { transform: rotate(${angleDeg}deg); }
                            }
                            @keyframes swingFrontInward {
                                0%, 100% { transform: scaleX(1); }
                                50% { transform: scaleX(${targetScaleX}); }
                            }
                            
                            .splay-track-left {
                                transform-origin: ${rLeftTop.x}px ${rLeftTop.y}px;
                                animation: swingLeftInward 3.5s ease-in-out infinite;
                            }
                            .splay-track-right {
                                transform-origin: ${rRightTop.x}px ${rRightTop.y}px;
                                animation: swingRightInward 3.5s ease-in-out infinite;
                            }
                            .splay-track-front {
                                transform-origin: ${centerX}px ${rLeftBot.y}px;
                                animation: swingFrontInward 3.5s ease-in-out infinite;
                            }
                        `}</style>
                    </defs>

                    {/* Izgara */}
                    <rect width="100%" height="100%" fill="url(#visualizer-grid)" />

                    {/* Orijinal Sınır Kılavuzu */}
                    <polygon
                        points={`${rLeftTop.x},${rLeftTop.y} ${rRightTop.x},${rRightTop.y} ${rRightBot.x},${rRightBot.y} ${rLeftBot.x},${rLeftBot.y}`}
                        fill="none"
                        stroke="#1e293b"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                    />

                    {/* Arka Duvar */}
                    <line x1={rLeftTop.x} y1={rLeftTop.y} x2={rRightTop.x} y2={rRightTop.y} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

                    {/* SOL DUVAR KANADI */}
                    <g className="splay-track-left">
                        <line x1={rLeftTop.x} y1={rLeftTop.y} x2={rLeftBot.x} y2={rLeftBot.y} stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                    </g>

                    {/* SAĞ DUVAR KANADI */}
                    <g className="splay-track-right">
                        <line x1={rRightTop.x} y1={rRightTop.y} x2={rRightBot.x} y2={rRightBot.y} stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                    </g>

                    {/* ÖN HAREKETLİ DUVAR */}
                    <g className="splay-track-front">
                        <line x1={rLeftBot.x} y1={rLeftBot.y} x2={rRightBot.x} y2={rRightBot.y} stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                        <circle cx={rLeftBot.x} cy={rLeftBot.y} r="4.5" className="fill-sky-400 stroke-slate-950 stroke-2" />
                        <circle cx={rRightBot.x} cy={rRightBot.y} r="4.5" className="fill-sky-400 stroke-slate-950 stroke-2" />
                    </g>

                    {/* TAM ORTALANMIŞ GENİŞLİK VE UZUNLUK ETİKETLERİ */}
                    {/* w_rear (Yatayda Tam Ortalanmış) */}
                    <text x={centerX} y={rLeftTop.y - 15} textAnchor="middle" className="fill-mist-400 font-bold tracking-wide text-[18px]">
                        Width Rear: {wRear.toFixed(2)} m
                    </text>

                    {/* Length (Dikeyde Tam Ortalanmış - Transform rotasyonu merkez alınarak) */}
                    <text
                        x={rLeftTop.x - 20}
                        y={centerY}
                        textAnchor="middle"
                        transform={`rotate(-90 ${rLeftTop.x - 20} ${centerY})`}
                        className="fill-mist-400 text-[18px] tracking-wide"
                    >
                        Length: {length.toFixed(2)} m
                    </text>

                    {/* w_front (Yatayda Tam Ortalanmış) */}
                    <text x={centerX} y={rLeftBot.y + 22} textAnchor="middle" className="fill-mist-400 font-bold text-[18px] tracking-wide">
                        Width Front: {wFront.toFixed(2)} m
                    </text>




                </svg>
            </div>
            {/* KÖŞELERİN ALTINA YERLEŞTİRİLEN ARALIKLI AÇI ETİKETLERİ */}
            {/* Sol Üst Köşe Altı Açı Yazısı */}
            <text
                x={rLeftTop.x + 15}
                y={rLeftTop.y + 35}
                textAnchor="start"
                className="text-sky-400 text-[12px] font-bold"
            >
                {angleDeg.toFixed(1)}°
            </text>
        </div>

    );
}