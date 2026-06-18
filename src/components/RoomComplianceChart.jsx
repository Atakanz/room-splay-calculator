import { useMemo } from 'react';
import {
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Area,
    Scatter,
    Cell,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

// 📐 Makaledeki Doğrusal Sınır Fonksiyonları
const ITU_FUNCTIONS = {
    getLeftLine: (Sw) => 4.5 * Sw - 4,   // Sol sınır (Mavi çizgi)
    getMiddleLine: (Sw) => 1.1 * Sw,     // Orta sınır (Mavi çizgi)
    getBottomLine: (Sw) => Sw,            // Alt sınır (Kırmızı çizgi)
};

const generateChartData = () => {
    const chartData = [];

    // Pürüzsüz alan boyaması için 1.0 ile 3.0 arasını 0.01 adımlarla çok sıkı tarıyoruz
    for (let Sw = 1.0; Sw <= 3.0; Sw += 0.01) {
        const curSw = parseFloat(Sw.toFixed(2));

        const leftSL = Math.min(3.0, ITU_FUNCTIONS.getLeftLine(curSw));
        const midSL = Math.min(3.0, ITU_FUNCTIONS.getMiddleLine(curSw));
        const bottomSL = ITU_FUNCTIONS.getBottomLine(curSw);

        // 🟢 1. YEŞİL BÖLGE (Overlap Önleyici Yeni Sınırlama)
        // Sol kesişim noktası olan 1.18'den başlar, orta çizginin tavan yaptığı 2.73'e kadar gider.
        let greenBottom = Math.max(bottomSL, leftSL);
        let greenTop = Math.min(3.0, midSL);
        let hasGreen = curSw >= 1.18 && curSw <= 2.73 && greenBottom > greenTop;

        // 🟡 2. SARI BÖLGE (Üst Üste Binmeyi Sıfırlayan Bıçak Kesimi Sınır)
        // Yeşil alanın var olduğu dikey şeritlerde (Sw <= 2.73) sarı alan ASLA yeşilin arkasına sızamaz.
        // Sw <= 2.73 iken: Sarı alan kırmızı çizgiden başlar, yeşilin bittiği orta çizgide (midSL) DURUR.
        // Sw > 2.73 iken (Yeşil alan tamamen bittiğinde): Sarı alan kırmızı çizgiden başlar, TAVANA (3.0) kadar uzanır.
        let yellowBottom = Math.max(1.32, bottomSL);
        let yellowTop = curSw <= 2.73 ? midSL : 3.0;

        // Makaledeki gibi sarı alanın sol dip başlangıcını 1.18'e kilitliyoruz
        let hasYellow = curSw >= 1.2 && yellowBottom < yellowTop;

        chartData.push({
            Sw: curSw,
            // Recharts Area bileşenleri için izole edilmiş dikey aralık paketleri [alt_limit, üst_limit]
            greenRange: hasGreen ? [parseFloat(greenBottom.toFixed(2)), parseFloat(greenTop.toFixed(2))] : null,
            yellowRange: hasYellow ? [parseFloat(yellowBottom.toFixed(2)), parseFloat(yellowTop.toFixed(2))] : null
        });
    }
    return chartData;
};

const generateTicks = () => {
    const ticks = [];
    for (let i = 1.0; i <= 3.01; i += 0.2) {
        ticks.push(parseFloat(i.toFixed(1)));
    }
    return ticks;
};

export default function RoomComplianceChart({ inputs, outputs }) {
    const chartData = useMemo(() => generateChartData(), []);
    const axisTicks = useMemo(() => generateTicks(), []);

    // Dinamik İşaretçi (Marker) Koordinat Senkronizasyonu
    const markerSw = parseFloat(outputs?.updatedSw || outputs?.w_ratio || inputs?.wRatio || 1.6);
    const markerSL = parseFloat(outputs?.updatedSL || outputs?.l_ratio || inputs?.lRatio || 2.2);

    // Nokta Renk Analizi
    const isError = outputs?.error || outputs?.is_under_4m || (outputs?.status === false);
    const isGreen = outputs?.zone === 'COMPLIANT_GREEN' || outputs?.status === true;

    let markerColor = '#ef4444'; // Uyumsuz: Canlı Kırmızı
    if (isGreen && !isError) {
        markerColor = '#10b981'; // ITU Uyumlu: Yeşil
    } else if (outputs?.zone === 'RECOVERABLE_YELLOW' || (!isGreen && !isError && outputs?.status !== false)) {
        markerColor = '#f59e0b'; // Kurtarılabilir: Sarı
    }

    return (
        <div className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative aspect-square select-none font-sans">

            {/* Üst Legend Göstergeleri */}
            <div className="absolute top-4 left-6 z-10 flex gap-4 text-[10px] font-bold tracking-wider text-slate-500">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-[#a7f3d0] border border-[#34d399] rounded-sm block"></span>
                    ITU COMPLIANT (YEŞİL)
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-[#fef08a] border border-[#fde047] rounded-sm block"></span>
                    RECOVERABLE ZONE (SARI)
                </div>
            </div>

            <div className="w-full h-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 20, right: 15, bottom: 25, left: -15 }}
                    >
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />

                        <XAxis
                            dataKey="Sw"
                            type="number"
                            domain={[1.0, 3.0]}
                            ticks={axisTicks}
                            stroke="#94a3b8"
                            fontSize={10}
                            fontFamily="monospace"
                            dy={10}
                            label={{ value: 'Sw (Width / Height)', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                        />

                        <YAxis
                            type="number"
                            domain={[1.0, 3.0]}
                            ticks={axisTicks}
                            stroke="#94a3b8"
                            fontSize={10}
                            fontFamily="monospace"
                            dx={-5}
                            label={{ value: 'SL (Length / Height)', position: 'insideLeft', offset: 5, angle: -90, fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                        />

                        🟡 SARI ALAN (Alttaki Alanı Tamamen Doldurur)
                        <Area
                            dataKey="yellowRange"
                            stroke="none"
                            fill="#fef08a"
                            fillOpacity={0.5} // Renklerin çiğ kalmaması için opaklık artırıldı
                            activeDot={false}
                        />

                        {/* 🟢 YEŞİL ALAN (Sarı alanla çakışmadan onun sol üst boşluğunu milimetrik kapatır) */}
                        <Area
                            dataKey="greenRange"
                            stroke="none"
                            fill="#a7f3d0"
                            fillOpacity={0.4}
                            activeDot={false}
                        />

                        {/* İnce Kılavuz Odak Çizgileri */}
                        <ReferenceLine x={markerSw} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.5} />
                        <ReferenceLine y={markerSL} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.5} />

                        {/* Canlı Canlı Hareket Eden Nokta */}
                        <Scatter data={[{ Sw: markerSw, SL: markerSL }]} dataKey="SL">
                            <Cell
                                fill={markerColor}
                                r={7.5}
                                stroke="#ffffff"
                                strokeWidth={2}
                                className="transition-all duration-300 drop-shadow-[0_3px_5px_rgba(0,0,0,0.3)] pointer-events-none"
                            />
                        </Scatter>

                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Sağ Alt Koordinat Penceresi */}
            <div className="absolute bottom-4 right-6 bg-slate-950 text-white font-mono text-[9px] px-2 py-0.5 rounded shadow-sm">
                [{markerSw.toFixed(2)}, {markerSL.toFixed(2)}]
            </div>
        </div>
    );
}