import { useMemo } from 'react';
import { ComposedChart, XAxis, YAxis, CartesianGrid, Area, Scatter, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';
import { generateChartData, ITU_FUNCTIONS } from '../../services/zoneAnalysis';

const generateTicks = () => {
    const ticks = [];
    for (let i = 1.0; i <= 3.01; i += 0.2) {
        ticks.push(parseFloat(i.toFixed(1)));
    }
    return ticks;
};

export default function RoomComplianceChart({ inputs, outputs, highlightZone }) {
    const chartData = useMemo(() => generateChartData(), []);
    const axisTicks = useMemo(() => generateTicks(), []);

    const markerSw = parseFloat(outputs?.updatedSw || outputs?.w_ratio || inputs?.wRatio || 1.6);
    const markerSL = parseFloat(outputs?.updatedSL || outputs?.l_ratio || inputs?.lRatio || 2.2);

    const isError = outputs?.error || outputs?.is_under_4m || outputs?.status === false;

    // 🚀 KOORDİNATLARA GÖRE GERÇEK BÖLGE HESAPLAMASI
    const leftSL = ITU_FUNCTIONS.getLeftLine(markerSw);
    const midSL = ITU_FUNCTIONS.getMiddleLine(markerSw);
    const bottomSL = ITU_FUNCTIONS.getBottomLine(markerSw);

    let isGreen = false;
    let isYellow = false;

    // Nokta matematiksel olarak Yeşil bölge sınırları içinde mi?
    if (markerSw >= 1.18 && markerSw <= 2.71 && markerSL >= midSL && markerSL <= leftSL && markerSL < 3 && markerSw < 3) {
        isGreen = true;
    }
    // Nokta matematiksel olarak Sarı bölge sınırları içinde mi?
    else if (markerSw >= 1.2 && markerSw < 3 && markerSL >= Math.max(1.32, bottomSL) && markerSL <= (markerSw <= 2.73 ? midSL : 2.99) && markerSL < 3) {
        isYellow = true;
    }

    // RENK BELİRLEME MANTIĞI
    let markerColor = '#ff0000'; // Varsayılan Kırmızı (Dışarıda)

    if (isError) {
        markerColor = '#ff0000'; // Hata varsa (Alan/Genişlik ihlali) direkt kırmızı
    } else if (isGreen) {
        markerColor = '#10b981'; // ITU Uyumlu (Yeşil)
    } else if (isYellow) {
        markerColor = '#f59e0b'; // Kurtarılabilir Bölge (Sarı)
    }

    return (
        <div className="w-full h-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative select-none font-sans">
            <style>{`
                @keyframes zoneBlink {
                    0%, 100% { fill-opacity: 0.4; }
                    50% { fill-opacity: 0.9; filter: drop-shadow(0 0 4px rgba(255,255,255,0.6)); }
                }
                .blink-green { animation: zoneBlink 0.6s ease-in-out 3; }
                .blink-yellow { animation: zoneBlink 0.6s ease-in-out 3; }
            `}</style>

            <div className="absolute top-4 left-6 z-10 flex gap-4 text-[10px] font-bold tracking-wider text-slate-500">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-[#a7f3d0] border border-[#34d399] rounded-sm block"></span>
                    ITU COMPLIANT
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-[#fef08a] border border-[#fde047] rounded-sm block"></span>
                    RECOVERABLE ZONE
                </div>
            </div>

            <div className="w-full h-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 25, left: 10 }}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                        <XAxis
                            dataKey="Sw"
                            type="number"
                            domain={[1.0, 3.0]}
                            ticks={axisTicks}
                            stroke="#94a3b8"
                            fontSize={10}
                            fontFamily="monospace"
                            dy={5}
                            label={{ 
                                value: 'Sw (Width / Height)', 
                                position: 'insideBottom', 
                                offset: -15, 
                                fill: '#64748b', 
                                fontSize: 11, 
                                fontWeight: 'bold' 
                            }}
                        />
                        <YAxis
                            type="number"
                            domain={[1.0, 3.0]}
                            ticks={axisTicks}
                            stroke="#94a3b8"
                            fontSize={10}
                            fontFamily="monospace"
                            dx={-2}
                            label={{
                                value: 'SL (Length / Height)',
                                angle: -90,
                                position: 'insideLeft',
                                offset: 5,
                                fill: '#64748b',
                                fontSize: 11,
                                fontWeight: 'bold',
                                style: { textAnchor: 'middle' }
                            }}
                        />

                        <Area
                            dataKey="yellowRange"
                            stroke="none"
                            fill="#fef08a"
                            fillOpacity={0.5}
                            className={highlightZone === 'yellow' ? 'blink-yellow' : ''}
                            activeDot={false}
                        />

                        <Area
                            dataKey="greenRange"
                            stroke="none"
                            fill="#a7f3d0"
                            fillOpacity={0.4}
                            className={highlightZone === 'green' ? 'blink-green' : ''}
                            activeDot={false}
                        />

                        <ReferenceLine x={markerSw} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.5} />
                        <ReferenceLine y={markerSL} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.5} />

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

            <div className="absolute bottom-4 right-6 bg-slate-950 text-white font-mono text-[9px] px-2 py-0.5 rounded shadow-sm">
                [{markerSw.toFixed(2)}, {markerSL.toFixed(2)}]
            </div>
        </div>
    );
}