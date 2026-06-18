import { useState } from 'react';
import * as analysis from '../../services/analysis.js';
import { MdCalculate } from 'react-icons/md';
import RoomComplianceChart from '../components/RoomComplianceChart.jsx';
// import RoomSchematic from '../components/RoomSchematic.jsx';

export default function Calculator() {

    const [inputs, setInputs] = useState({
        height: 3,
        wRatio: 1.6,
        lRatio: 2.2,
        angle: 5
    });

    // Sonuç State'leri
    const [result, setResult] = useState(null);
    const [activeTab, setActiveTab] = useState(null);

    const handleInputChange = (e) => {
        setInputs({ ...inputs, [e.target.name]: parseFloat(e.target.value) || 0 });
    };

    const w = inputs.height * inputs.wRatio;
    const l = inputs.height * inputs.lRatio;

    // İşlemler
    const runCheck = () => {
        const ok = analysis.checkRatio(inputs.wRatio, inputs.lRatio);
        setActiveTab('check');
        setResult(ok ? "Uyumlu: Oda oranları ITU standartlarına uygun." : "Uyumsuz: Oranlar limitlerin dışında.");
    };

    const runSplay = () => {
        const res = analysis.splayTheRoom(w, l, inputs.height, inputs.angle);
        setActiveTab('splay');
        setResult(res);
    };

    const runOptimum = () => {
        const res = analysis.calculateTheOptimumRatio(w, l, inputs.height);
        setActiveTab('optimum');
        setResult(res);
        console.log(res)
    };

    const runControlled = () => {
        const res = analysis.splayTheRoomWithTheSameRatio(w, l, inputs.height, inputs.angle);
        setActiveTab('controlled');
        setResult(res);
    };

    const handleFixTheRoom = (angle) => {
        setInputs(prev => ({ ...prev, angle }));
        setActiveTab('controlled');

        const res = analysis.splayTheRoomWithTheSameRatio(
            w,
            l,
            inputs.height,
            angle
        );

        setResult(res);
    }

    return (
        <div className="p-8 max-w-4xl mx-auto font-sans text-slate-800">
            <h1 className="text-3xl font-bold mb-8 border-b pb-4">Acoustic Room Calculator</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* INPUT PANELİ */}
                <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h2 className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Oda Parametreleri</h2>
                    <div>
                        <label className="block text-sm mb-1">Yükseklik (h) - metre</label>
                        <input name="height" type="number" step="0.1" value={inputs.height} onChange={handleInputChange} className="w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Genişlik Oranı (Sw)</label>
                        <input name="wRatio" type="number" step="0.01" value={inputs.wRatio} onChange={handleInputChange} className="w-full p-2 rounded border" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Uzunluk Oranı (SL)</label>
                        <input name="lRatio" type="number" step="0.01" value={inputs.lRatio} onChange={handleInputChange} className="w-full p-2 rounded border" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Splay Açısı (Derece)</label>
                        <input name="angle" type="number" step="0.5" value={inputs.angle} onChange={handleInputChange} className="w-full p-2 rounded border" />
                    </div>
                </div>

                {/* BUTONLAR PANELİ */}
                <RoomComplianceChart inputs={inputs} outputs={{
                    // 'splay' sekmesindeysek splayTheRoom'dan dönen verileri, yoksa ilk oranları pasla
                    updatedSw: activeTab === 'splay' ? parseFloat(result?.ratio?.split(':')[1]) : inputs.wRatio,
                    updatedSL: activeTab === 'splay' ? parseFloat(result?.ratio?.split(':')[2]) : inputs.lRatio,

                    // 'controlled' sekmesindeysek veya 'Fix' butonuna basıldıysa yeni oranları hedef göster
                    w_ratio: activeTab === 'controlled' ? result?.w_ratio : null,
                    l_ratio: activeTab === 'controlled' ? result?.l_ratio : null,

                    // Durum bildirimleri
                    zone: analysis.checkRatio(inputs.wRatio, inputs.lRatio) ? 'COMPLIANT_GREEN' : 'RECOVERABLE_YELLOW',
                    status: result?.status,
                    error: result?.is_under_4m
                }} />
                <div className="flex flex-col gap-3 justify-center">
                    <button
                        onClick={runCheck}
                        className={`p-3 rounded-lg transition font-medium ${activeTab === 'check'
                            ? 'bg-blue-700 text-white ring-4 ring-blue-200 scale-[1.02]'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        Oran Kontrolü
                    </button>

                    <button
                        onClick={runSplay}
                        className={`p-3 rounded-lg transition font-medium ${activeTab === 'splay'
                            ? 'bg-slate-900 text-white ring-4 ring-slate-200 scale-[1.02]'
                            : 'bg-slate-800 text-white hover:bg-slate-900'
                            }`}
                    >
                        Odayı Açılandır (Inward)
                    </button>

                    <button
                        onClick={runOptimum}
                        className={`p-3 rounded-lg transition font-medium ${activeTab === 'optimum'
                            ? 'bg-slate-900 text-white ring-4 ring-slate-200 scale-[1.02]'
                            : 'bg-slate-800 text-white hover:bg-slate-900'
                            }`}
                    >
                        Optimum Açıyı Bul
                    </button>

                    <button
                        onClick={runControlled}
                        className={`p-3 rounded-lg transition font-medium ${activeTab === 'controlled'
                            ? 'bg-indigo-700 text-white ring-4 ring-indigo-200 scale-[1.02]'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                    >
                        Aynı Oranlı Açılandır (Controlled)
                    </button>
                </div>
            </div>

            {/* SONUÇ ALANI */}
            {result && (
                <div className="mt-8 p-6 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full"></span> Sonuçlar
                    </h2>

                    {activeTab === 'check' && <p className="text-lg">{result}</p>}

                    {activeTab === 'splay' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-xs text-slate-400">Yeni Oran</p>
                                <p className="font-mono text-xl">{result.message}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-xs text-slate-400">Uyum Durumu</p>
                                <p className={result.status ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                                    {result.status ? "UYUMLU" : "UYUMSUZ"}
                                </p>
                            </div>
                            {result.is_under_4m && <p className="col-span-2 text-rose-500 text-sm">⚠️ Uyarı: Kısa kenar 4 metrenin altında!</p>}
                        </div>
                    )}

                    {activeTab === 'optimum' && (
                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 sticky top-0">
                                    <tr><th className="p-2 text-left">Açı</th><th className="p-2 text-left">Oran</th><th className="p-2 text-left">Durum</th></tr>
                                </thead>
                                <tbody>
                                    {result.map((r, i) => (
                                        <tr key={i} className="border-t">
                                            <td className="p-2 flex items-center justify-between">
                                                <div>
                                                    {r.angle}°
                                                </div>{r.warning && (
                                                    <MdCalculate size={25} onClick={() => handleFixTheRoom(r.angle)} />
                                                )
                                                }</td>
                                            <td className="p-2 font-mono">{r.message}</td>
                                            <td className="p-2 flex items-center justify-between">
                                                {r.warning ? "⚠️ <4m" : "✅"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'controlled' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono">
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded">
                                <p className="text-[10px] text-indigo-400 uppercase">Angle</p>
                                <p>{result.angle_deg}°</p>
                            </div>
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded">
                                <p className="text-[10px] text-indigo-400 uppercase">Height</p>
                                <p>{result.height} m</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded">
                                <p className="text-[10px] text-slate-400 uppercase">Width Front</p>
                                <p>{result.width.front} m</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded">
                                <p className="text-[10px] text-slate-400 uppercase">Width Rear</p>
                                <p>{result.width.rear} m</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded">
                                <p className="text-[10px] text-slate-400 uppercase">Length</p>
                                <p>{result.length} m</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}