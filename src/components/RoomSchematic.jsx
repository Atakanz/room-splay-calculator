
export default function RoomSchematic({ method, inputs, outputs }) {
    // SVG Görselleştirme Alanı Sabitleri (Canvas Ölçüleri)
    const width = 400;
    const height = 300;
    const padding = 50;

    // Giriş ve çıkışlardan gelen verileri güvenli sayısal tipe (float) çeviriyoruz
    const currentHeight = parseFloat(inputs?.height || 3);
    const initialWRatio = parseFloat(inputs?.wRatio || 1.6);
    const initialLRatio = parseFloat(inputs?.lRatio || 2.2);

    // Servis çıktı yapılarındaki (dims veya doğrudan anahtar) farklılıklara karşı güvenli fallback zinciri
    const rawLength = outputs?.length || outputs?.dims?.length || (initialLRatio * currentHeight);
    const rawWFront = outputs?.width_front || outputs?.wFront || outputs?.dims?.short || (initialWRatio * currentHeight);
    const rawWRear = outputs?.width_rear || outputs?.wRear || outputs?.dims?.long || (initialWRatio * currentHeight);

    const roomLength = parseFloat(rawLength);
    const roomWFront = parseFloat(rawWFront);
    const roomWRear = parseFloat(rawWRear);

    // Çizim ölçeklendirme katsayısı (Ölçüleri pixel alanına sığdırır)
    const maxRoomDim = Math.max(roomWRear, roomLength);
    const scale = (width - padding * 2) / (maxRoomDim || 1);

    // Merkez koordinatları
    const cx = width / 2;
    const cy = height / 2;

    // Fiziksel boyutların pixel karşılıkları
    const pLength = roomLength * scale;
    const pWFront = roomWFront * scale;
    const pWRear = roomWRear * scale;

    // Trapezoid Köşe Koordinatları
    // Odada hoparlörler sol tarafta (W_front), dinleyici sağ tarafta (W_rear) konumlanır [cite: 101, 121]
    const xLeft = cx - pLength / 2;
    const xRight = cx + pLength / 2;

    const yLeftTop = cy - pWFront / 2;
    const yLeftBottom = cy + pWFront / 2;

    const yRightTop = cy - pWRear / 2;
    const yRightBottom = cy + pWRear / 2;

    // SVG Çizim Yolu (Polygon Path)
    const roomPath = `M ${xLeft} ${yLeftTop} L ${xRight} ${yRightTop} L ${xRight} ${yRightBottom} L ${xLeft} ${yLeftBottom} Z`;

    // Hoparlör ve Dinleyici Konumlandırma oranları
    const speakerSize = 14;
    const sp1X = xLeft + 35;
    const sp1Y = yLeftTop + (pWFront * 0.25);

    const sp2X = xLeft + 35;
    const sp2Y = yLeftTop + (pWFront * 0.75);

    const listenerX = xRight - 45;
    const listenerY = cy;

    // Uyum durumu rengi ve flag kontrolleri
    const isError = outputs?.error || outputs?.is_under_4m || roomWFront < 4;
    const displaySw = outputs?.updatedSw || outputs?.w_ratio || initialWRatio;
    const displaySL = outputs?.updatedSL || outputs?.l_ratio || initialLRatio;

    return (
        <div className="w-full bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col items-center select-none">
            <div className="w-full flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">Canlı Oda Geometrisi (2D Plan)</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors duration-300 ${isError ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {method === 'splay' ? 'INWARD SPLAY' : 'CONTROLLED RATIO'}
                </span>
            </div>

            {/* CANLI SVG ÇİZİM ALANI */}
            <div className="w-full bg-slate-950/60 rounded-xl border border-slate-800/80 relative overflow-hidden flex items-center justify-center p-2">
                <svg width={width} height={height} className="overflow-visible">
                    {/* Grid Arka Planı */}
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" className="opacity-30" />

                    {/* Duvarlar (Oda Sınırları) */}
                    <path
                        d={roomPath}
                        fill="#0f172a"
                        stroke={isError ? '#f43f5e' : '#10b981'}
                        strokeWidth="3"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                    />

                    {/* Hoparlör 1 (Sol Üst) */}
                    <rect
                        x={sp1X - speakerSize / 2}
                        y={sp1Y - speakerSize / 2}
                        width={speakerSize}
                        height={speakerSize}
                        rx="2"
                        fill="#38bdf8"
                        transform={`rotate(15 ${sp1X} ${sp1Y})`}
                    />
                    {/* Hoparlör 2 (Sol Alt) */}
                    <rect
                        x={sp2X - speakerSize / 2}
                        y={sp2Y - speakerSize / 2}
                        width={speakerSize}
                        height={speakerSize}
                        rx="2"
                        fill="#38bdf8"
                        transform={`rotate(-15 ${sp2X} ${sp2Y})`}
                    />

                    {/* Dinleyici (Sağ Merkez) [cite: 89] */}
                    <circle cx={listenerX} cy={listenerY} r="7" fill="#fbbf24" />

                    {/* Stereo Akustik Odak Çikgileri [cite: 85] */}
                    <line x1={sp1X} y1={sp1Y} x2={listenerX} y2={listenerY} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                    <line x1={sp2X} y1={sp2Y} x2={listenerX} y2={listenerY} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

                    {/* BOYUT ETİKETLERİ */}
                    {/* Ön Duvar Genişliği (W_front) */}
                    <line x1={xLeft - 15} y1={yLeftTop} x2={xLeft - 15} y2={yLeftBottom} stroke="#475569" strokeWidth="1" />
                    <text x={xLeft - 24} y={cy} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle" transform={`rotate(-90 ${xLeft - 24} ${cy})`}>
                        W_f: {roomWFront.toFixed(2)}m
                    </text>

                    {/* Arka Duvar Genişliği (W_rear) */}
                    <line x1={xRight + 15} y1={yRightTop} x2={xRight + 15} y2={yRightBottom} stroke="#475569" strokeWidth="1" />
                    <text x={xRight + 24} y={cy} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle" transform={`rotate(90 ${xRight + 24} ${cy})`}>
                        W_r: {roomWRear.toFixed(2)}m
                    </text>

                    {/* Oda Boyu (Length) */}
                    <line x1={xLeft} y1={Math.max(yLeftBottom, yRightBottom) + 15} x2={xRight} y2={Math.max(yLeftBottom, yRightBottom) + 15} stroke="#475569" strokeWidth="1" />
                    <text x={cx} y={Math.max(yLeftBottom, yRightBottom) + 28} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                        L: {roomLength.toFixed(2)}m
                    </text>
                </svg>
            </div>

            {/* Mini Metrik Bilgilendirmesi */}
            <div className="w-full grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono text-slate-400">
                <div>Eşdeğer Sw Oranı: <span className="text-white font-bold">{parseFloat(displaySw).toFixed(2)}</span></div>
                <div className="text-right">Eşdeğer SL Oranı: <span className="text-white font-bold">{parseFloat(displaySL).toFixed(2)}</span></div>
            </div>
        </div>
    );
}