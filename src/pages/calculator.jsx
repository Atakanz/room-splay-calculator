import { useState, useRef, useEffect } from 'react';
import * as analysis from '../../services/analysis.js';
import * as modalAnalysis from '../../services/modalResponse.js';
import { getProceduralRandomRatio } from '../../services/zoneAnalysis.js';
import { MdAssessment, MdCheckCircle, MdCancel, MdLayers, MdArchitecture, MdExpandMore, MdExpandLess, MdLock, MdWarning } from 'react-icons/md';
import RoomComplianceChart from '../components/RoomComplianceChart.jsx';
import ControlledRoomVisualizer from '../components/ControlledRoomVisualizer.jsx';

export default function Calculator() {
    const [strategyMode, setStrategyMode] = useState('optimum');
    const [isChartVisible, setIsChartVisible] = useState(true);
    const [highlightZone, setHighlightZone] = useState(null);

    const [inputs, setInputs] = useState({
        height: 3,
        wRatio: 1.23,
        lRatio: 1.4,
        angle: 3
    });

    const [controlledHeight, setControlledHeight] = useState(3);
    const [result, setResult] = useState(null);
    const [activeTab, setActiveTab] = useState(null);
    const [selectedModalData, setSelectedModalData] = useState(null);
    const [initialRoomData, setInitialRoomData] = useState({ modes: [], isItuCompliant: false, areaWarning: null });

    const resultRef = useRef(null);

    // --- 1. GÜVENLİK KALKANI VE VALİDASYON ---
    const parsedWRatio = inputs.wRatio !== '' ? Number(inputs.wRatio) : NaN;
    const parsedLRatio = inputs.lRatio !== '' ? Number(inputs.lRatio) : NaN;
    const parsedHeight = inputs.height !== '' ? Number(inputs.height) : NaN;

    const isInputComplete =
        !isNaN(parsedWRatio) &&
        !isNaN(parsedLRatio) &&
        parsedWRatio >= 0.5 &&
        parsedLRatio >= 0.5;

    // Input tamamlanmadıysa servislerin çökmemesi için güvenli fallback değerleri
    const safeSw = isInputComplete ? parsedWRatio : 1.23;
    const safeSL = isInputComplete ? parsedLRatio : 1.4;
    const rawInputHeight = !isNaN(parsedHeight) ? Math.max(0.1, parsedHeight) : 2.5;

    // Geometrik metrikleri sadece girdi geçerliyse hesapla (Tutarsızlık 1 Çözümü)
    const designMetrics = isInputComplete
        ? analysis.calculateDesignPhaseMetrics(safeSw, safeSL, Number(inputs.angle || 0))
        : null;

    const hMinArea = isInputComplete ? Math.sqrt(20 / (safeSw * safeSL)) : 2.5;
    const optimumMinH = Number(Math.max(2.5, hMinArea).toFixed(2));
    const controlledEffectiveMinH = Number(Math.max(designMetrics?.hMin || 2.5, optimumMinH).toFixed(2));

    const currentHeight = strategyMode === 'controlled'
        ? Math.max(controlledHeight, controlledEffectiveMinH)
        : rawInputHeight;

    let w = currentHeight * safeSw;
    let l = currentHeight * safeSL;

    if (strategyMode === 'controlled' && isInputComplete && designMetrics) {
        w = designMetrics.sPrimeW * currentHeight;
        l = designMetrics.sPrimeL * currentHeight;
    }
    const currentArea = w * l;

    const splayedW = currentHeight * safeSw;
    const splayedL = currentHeight * safeSL;
    console.log("avarage", splayedW, splayedL)
    const splayedModes = (strategyMode === 'controlled' && isInputComplete)
        ? modalAnalysis.calculateAllModes(splayedW.toFixed(2), splayedL.toFixed(2), currentHeight)
        : [];

    // Controlled modda hMin sınır takibi
    useEffect(() => {
        if (strategyMode !== 'controlled' || !isInputComplete) return;

        setControlledHeight(prev => {
            const next = Math.max(Number(prev) || 0, controlledEffectiveMinH);
            return Number(next.toFixed(2));
        });
    }, [strategyMode, controlledEffectiveMinH, isInputComplete]);

    // Modal analiz ve ITU uyumluluk takibi (Tutarsızlık 2 Çözümü)
    useEffect(() => {
        // Eğer input tam değilse hesaplama yapma, arayüzü kirletme
        if (!isInputComplete) return;
        console.log("initial", w, l)
        const modes = modalAnalysis.calculateAllModes(w.toFixed(2), l.toFixed(2), currentHeight);
        const currentRatioW = w / currentHeight;
        const currentRatioL = l / currentHeight;
        const isItuCompliant = analysis.checkRatio(currentRatioW, currentRatioL);

        let areaWarning = null;
        if (currentArea < 20) areaWarning = '< 20m²';
        else if (currentArea > 60) areaWarning = '> 60m²';

        setInitialRoomData({ modes, isItuCompliant, areaWarning });
    }, [currentHeight, isInputComplete, w, l, currentArea]);

    // Canlı veri değişim takibi (Tutarsızlık 3 Çözümü)
    useEffect(() => {
        if (strategyMode === 'controlled' && result !== null) {
            if (!isInputComplete) {
                setResult(null);
                return;
            }
            const updatedResult = analysis.splayTheRoomWithTheSameRatio(
                parsedWRatio,
                parsedLRatio,
                controlledHeight,
                Number(inputs.angle || 0)
            );
            setResult(updatedResult);
        }
    }, [inputs.wRatio, inputs.lRatio, controlledHeight, inputs.angle, strategyMode, isInputComplete]);

    const scrollToResults = () => {
        setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        const name = e.target.name;

        if (val === '') {
            setInputs({ ...inputs, [name]: '' });
            setResult(null);
            setActiveTab(null);
            setSelectedModalData(null);
            return;
        }

        if (name !== 'height') {
            const nextInputs = { ...inputs, [name]: val };
            const currentW = Number(nextInputs.wRatio);
            const currentL = Number(nextInputs.lRatio);
            const isCurrentlyComplete = currentW >= 0.5 && currentL >= 0.5;

            if (isCurrentlyComplete) {
                if (strategyMode === 'controlled') {
                    const newHMinArea = Math.sqrt(20 / (currentW * currentL));
                    const newOptimumMinH = parseFloat(Math.max(2.5, newHMinArea).toFixed(2));
                    const newDesignMetrics = analysis.calculateDesignPhaseMetrics(currentW, currentL, Number(nextInputs.angle || 0));
                    const newControlledEffectiveMinH = parseFloat(Math.max(newDesignMetrics?.hMin || 2.5, newOptimumMinH).toFixed(2));

                    setInputs(nextInputs);
                    setControlledHeight(prev => parseFloat(Math.max(Number(prev), newControlledEffectiveMinH).toFixed(2)));
                } else {
                    setInputs(nextInputs);
                }
            } else {
                setInputs(nextInputs);
            }
        } else {
            setInputs({ ...inputs, [name]: val });
        }
    };

    const stepInput = (name, direction, stepValue) => {
        if (name === 'height') {
            if (strategyMode === 'controlled') {
                setControlledHeight(prev => {
                    const currentVal = Number(prev) || 0;
                    const newVal = direction === 'up' ? currentVal + stepValue : currentVal - stepValue;
                    return parseFloat(Math.max(controlledEffectiveMinH, newVal).toFixed(2));
                });
            } else {
                setInputs(prev => {
                    const currentVal = Number(prev.height) || 0;
                    const newVal = direction === 'up' ? currentVal + stepValue : currentVal - stepValue;
                    return { ...prev, height: parseFloat(Math.max(0.1, newVal).toFixed(2)) };
                });
            }
            return;
        }

        const currentVal = Number(inputs[name]) || 0;
        const decimalPlaces = stepValue.toString().split('.')[1]?.length || 0;
        const newVal = direction === 'up' ? currentVal + stepValue : currentVal - stepValue;
        const safeVal = name === 'angle' ? newVal : Math.max(0.1, newVal);
        const finalVal = parseFloat(safeVal.toFixed(decimalPlaces));

        const nextInputs = { ...inputs, [name]: finalVal };

        if (strategyMode === 'controlled') {
            const newSafeSw = Math.max(0.1, Number(nextInputs.wRatio) || 0.1);
            const newSafeSL = Math.max(0.1, Number(nextInputs.lRatio) || 0.1);
            const newHMinArea = Math.sqrt(20 / (newSafeSw * newSafeSL));
            const newOptimumMinH = parseFloat(Math.max(2.5, newHMinArea).toFixed(2));
            const newDesignMetrics = analysis.calculateDesignPhaseMetrics(newSafeSw, newSafeSL, Number(nextInputs.angle || 0));
            const newControlledEffectiveMinH = parseFloat(Math.max(newDesignMetrics?.hMin || 2.5, newOptimumMinH).toFixed(2));

            setInputs(nextInputs);
            setControlledHeight(prev => parseFloat(Math.max(Number(prev), newControlledEffectiveMinH).toFixed(2)));
        } else {
            setInputs(nextInputs);
        }
    };

    const handleGenerateRatio = (zone) => {
        setHighlightZone(zone);
        setTimeout(() => setHighlightZone(null), 1800);

        const coords = getProceduralRandomRatio(zone);

        if (strategyMode === 'controlled') {
            const newHMinArea = Math.sqrt(20 / (coords.wRatio * coords.lRatio));
            const newOptimumMinH = parseFloat(Math.max(2.5, newHMinArea).toFixed(2));
            const newDesignMetrics = analysis.calculateDesignPhaseMetrics(coords.wRatio, coords.lRatio, inputs.angle);
            const newControlledEffectiveMinH = parseFloat(Math.max(newDesignMetrics?.hMin || 2.5, newOptimumMinH).toFixed(2));

            setInputs(prev => ({
                ...prev,
                wRatio: Number(coords.wRatio.toFixed(2)),
                lRatio: Number(coords.lRatio.toFixed(2))
            }));
            setControlledHeight(prev => Math.max(prev, newControlledEffectiveMinH));
        } else {
            setInputs(prev => ({
                ...prev,
                wRatio: Number(coords.wRatio.toFixed(2)),
                lRatio: Number(coords.lRatio.toFixed(2))
            }));
        }

        setResult(null);
        setActiveTab(null);
    };

    const runOptimum = () => {
        if (!isInputComplete) return;
        const origRes = analysis.calculateTheOptimumRatio(w, l, inputs.height);
        const enhancedRes = origRes.map(row => {
            const parts = row.message.split(':');
            const targetW = inputs.height * parseFloat(parts[1]);
            const targetL = inputs.height * parseFloat(parts[2]);
            const targetArea = targetW * targetL;
            const targetModes = modalAnalysis.calculateAllModes(targetW, targetL, inputs.height);
            return {
                ...row,
                targetArea,
                totalClusters: targetModes.meta.totalAxialClusters,
                firstClusterAt: targetModes.meta.firstClusterFreq
            };
        });

        const safeCandidates = enhancedRes.filter(row => !row.warning && row.targetArea >= 20 && row.targetArea <= 60);
        let bestSplayAngle = null;
        let minClusters = Infinity;
        let maxSafeFreq = -1;

        safeCandidates.forEach(row => {
            if (row.totalClusters < minClusters) {
                minClusters = row.totalClusters;
                maxSafeFreq = row.firstClusterAt;
                bestSplayAngle = row.angle;
            } else if (row.totalClusters === minClusters) {
                if (row.firstClusterAt > maxSafeFreq) {
                    maxSafeFreq = row.firstClusterAt;
                    bestSplayAngle = row.angle;
                }
            }
        });

        const finalMatrix = enhancedRes.map(row => ({ ...row, isOptimizedTarget: row.angle === bestSplayAngle }));
        setActiveTab('optimum');
        setResult(finalMatrix);
        setSelectedModalData(null);
        scrollToResults();
    };

    const runControlled = () => {
        if (!isInputComplete) return;
        const res = analysis.splayTheRoomWithTheSameRatio(parsedWRatio, parsedLRatio, controlledHeight, inputs.angle);
        setActiveTab('controlled');
        setResult(res);
        setSelectedModalData(null);
        scrollToResults();
    };

    const handleCalculateModal = (angle, ratioStr) => {
        const parts = ratioStr.split(':');
        const targetW = currentHeight * parseFloat(parts[1]);
        const targetL = currentHeight * parseFloat(parts[2]);
        const modes = modalAnalysis.calculateAllModes(targetW, targetL, currentHeight);
        setSelectedModalData({ angle, ratio: ratioStr, modes });
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans text-slate-800 select-none">

            {/* STRATEGY MODE SELECTION */}
            <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60">
                <button
                    onClick={() => { setStrategyMode('optimum'); setResult(null); setActiveTab(null); }}
                    className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs sm:text-sm font-semibold tracking-wide transition-all ${strategyMode === 'optimum' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <MdLayers size={18} className="shrink-0" />
                    <span className="text-center leading-tight">
                        EXISTING ROOM <br className="hidden lg:block" /> (INWARD SPLAY)
                    </span>
                </button>
                <button
                    onClick={() => { setStrategyMode('controlled'); setResult(null); setActiveTab(null); }}
                    className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs sm:text-sm font-semibold tracking-wide transition-all ${strategyMode === 'controlled' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <MdArchitecture size={18} className="shrink-0" />
                    <span className="text-center leading-tight">
                        DESIGN PHASE <br className="hidden lg:block" /> (CONTROLLED SPLAY)
                    </span>
                </button>
            </div>

            {/* INPUT & CHART PANEL */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6 items-start">
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 md:col-span-2">

                    {/* INPUT: Width Ratio */}
                    <div>
                        <label className="block text-xs mb-1 text-slate-600">Width Ratio (Sw)</label>
                        <div className="flex items-center rounded border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                            <button type="button" onClick={() => stepInput('wRatio', 'down', 0.01)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors">-</button>
                            <input name="wRatio" type="number" step="0.01" value={inputs.wRatio} onChange={handleInputChange} className="w-full p-1.5 text-sm text-center border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            <button type="button" onClick={() => stepInput('wRatio', 'up', 0.01)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors">+</button>
                        </div>
                    </div>

                    {/* INPUT: Length Ratio */}
                    <div>
                        <label className="block text-xs mb-1 text-slate-600">Length Ratio (SL)</label>
                        <div className="flex items-center rounded border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                            <button type="button" onClick={() => stepInput('lRatio', 'down', 0.01)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors">-</button>
                            <input name="lRatio" type="number" step="0.01" value={inputs.lRatio} onChange={handleInputChange} className="w-full p-1.5 text-sm text-center border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            <button type="button" onClick={() => stepInput('lRatio', 'up', 0.01)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors">+</button>
                        </div>
                    </div>

                    {strategyMode === 'controlled' && (
                        <div className="pt-3 border-t border-slate-200/60 animate-in slide-in-from-top duration-300">
                            <label className="block text-xs mb-1 text-indigo-700 font-medium">Splay Angle (Degrees)</label>
                            <div className="flex items-center rounded border border-indigo-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                                <button type="button" onClick={() => stepInput('angle', 'down', 0.5)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-colors">-</button>
                                <input name="angle" type="number" step="0.5" value={inputs.angle} onChange={handleInputChange} className="w-full p-1.5 text-sm text-center border-none outline-none bg-indigo-50/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                <button type="button" onClick={() => stepInput('angle', 'up', 0.5)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-colors">+</button>
                            </div>
                        </div>
                    )}

                    {/* INPUT: Height */}
                    <div className="pt-2 border-t border-slate-200/40">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs text-slate-600">Height (h) - meters</label>
                            {isInputComplete && strategyMode === 'controlled' && (
                                <span className="text-[10px] font-mono font-bold flex items-center gap-1 px-1.5 py-0.5 rounded shadow-3xs animate-fade-in text-indigo-600 bg-indigo-50/60">
                                    <MdLock size={12} />
                                    {`Min: ${controlledEffectiveMinH}m (${controlledEffectiveMinH === 2.5 ? 'Arch. Limit' : 'Wfront 4 m limit'})`}
                                </span>
                            )}
                        </div>
                        <div className={`flex items-center rounded border bg-white overflow-hidden focus-within:ring-2 ${strategyMode === 'controlled' ? 'border-indigo-200 focus-within:ring-indigo-500' : 'border-slate-200 focus-within:ring-blue-500'}`}>
                            <button
                                type="button"
                                disabled={
                                    !isInputComplete ||
                                    (strategyMode === 'controlled' && controlledHeight <= controlledEffectiveMinH) ||
                                    (strategyMode === 'optimum' && Number(inputs.height) <= 0.1)
                                }
                                onClick={() => stepInput('height', 'down', 0.01)}
                                className={`px-3 py-1.5 font-bold transition-colors select-none
                                    ${strategyMode === 'controlled'
                                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:bg-indigo-50/30 disabled:text-indigo-400/50 disabled:cursor-not-allowed'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400/50 disabled:cursor-not-allowed'
                                    }`}
                            >
                                -
                            </button>
                            <input
                                name="height"
                                type="number"
                                step="0.1"
                                value={strategyMode === 'controlled' ? controlledHeight : inputs.height}
                                onChange={handleInputChange}
                                className={`w-full p-1.5 text-sm text-center border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${strategyMode === 'controlled' ? 'bg-indigo-50/40 text-indigo-900 font-semibold cursor-not-allowed' : ''}`}
                            />
                            <button type="button" disabled={!isInputComplete} onClick={() => stepInput('height', 'up', 0.01)} className={`px-3 py-1.5 font-bold transition-colors ${strategyMode === 'controlled' ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed'}`}>+</button>
                        </div>
                    </div>

                    {/* BÖLGE TABANLI GENERATOR KONTROLLERİ */}
                    <div className="pt-3 border-t border-slate-200/80 space-y-2">
                        {strategyMode === 'optimum' ? (
                            <div className="flex w-full gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleGenerateRatio('green')}
                                    className="flex items-center justify-center gap-1.5 p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold tracking-wide transition shadow-3xs"
                                >
                                    GENERATE COMPLIANT RATIO
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleGenerateRatio('yellow')}
                                    className="flex items-center justify-center gap-1.5 p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold tracking-wide transition shadow-3xs"
                                >
                                    GENERATE RECOVERABLE RATIO
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleGenerateRatio('green')}
                                className="w-full flex items-center justify-center gap-1.5 p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold tracking-wide transition shadow-3xs"
                            >
                                GENERATE COMPLIANT RATIO
                            </button>
                        )}
                    </div>

                    <div className="pt-1">
                        {strategyMode === 'optimum' ? (
                            <button onClick={runOptimum} disabled={!isInputComplete} className="w-full p-2.5 bg-slate-900 hover:bg-slate-950 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold tracking-wider shadow-xs transition">
                                CALCULATE OPTIMUM ANGLES
                            </button>
                        ) : (
                            <button onClick={runControlled} disabled={!isInputComplete} className="w-full p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold tracking-wider shadow-xs transition">
                                EXECUTE CONTROLLED GEOMETRY
                            </button>
                        )}
                    </div>
                </div>

                {/* AKILLI GRAFİK ALANI */}
                <div className="md:col-span-3 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden max-w-2xl w-full mx-auto md:mx-0">
                    <button
                        onClick={() => setIsChartVisible(!isChartVisible)}
                        className="w-full p-3 bg-slate-50/80 border-b border-slate-200/60 flex justify-between items-center text-xs font-bold text-slate-500 tracking-wider hover:bg-slate-100 transition-colors pointer-events-auto md:pointer-events-none select-none"
                    >
                        <span>ITU COMPLIANCE CHART VISUALIZATION</span>
                        <div className="md:hidden">
                            {isChartVisible ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                        </div>
                    </button>

                    <div className={`${isChartVisible ? 'block' : 'hidden'} md:block p-4 h-[350px] md:h-[450px] flex flex-col justify-center animate-in fade-in duration-300 overflow-hidden`}>
                        <RoomComplianceChart inputs={inputs} highlightZone={highlightZone} outputs={{
                            updatedSw: isInputComplete ? inputs.wRatio : 1.23,
                            updatedSL: isInputComplete ? inputs.lRatio : 1.4,
                            w_ratio: (strategyMode === 'controlled' && isInputComplete) ? result?.w_ratio : null,
                            l_ratio: (strategyMode === 'controlled' && isInputComplete) ? result?.l_ratio : null,
                            zone: initialRoomData.isItuCompliant ? 'COMPLIANT_GREEN' : 'RECOVERABLE_YELLOW',
                            status: result?.status,
                            error: result?.is_under_4m
                        }} />
                    </div>
                </div>
            </div>

            {/* INITIAL ROOM STATE VIEW WITH COMPLIANCE BADGE */}
            {isInputComplete && (
                <div className="mb-6 p-4 bg-slate-900 text-white rounded-xl shadow-md animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-700 pb-2 mb-3 gap-3">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-shadow-olive-100">
                                {strategyMode === 'controlled' ? 'Initial Rectangular Dimensions' : 'Initial Room Response'}
                            </h2>
                            <p className="text-xs text-slate-200 font-mono">Dimensions: {w.toFixed(2)} m x {l.toFixed(2)} m x {currentHeight} m</p>
                            <span className="text-slate-400 text-xs">
                                1 : {(w / currentHeight).toFixed(2)} : {(l / currentHeight).toFixed(2)}
                            </span>
                        </div>

                        {strategyMode === 'controlled' ? (
                            initialRoomData.areaWarning ? (
                                <span className="text-rose-400 flex items-center gap-1 font-mono">
                                    <MdWarning size={15} /> Warning (Area {initialRoomData.areaWarning})
                                </span>
                            ) : (
                                <span className="text-cyan-100 font-mono flex items-center gap-1 text-sm">
                                    No warning
                                </span>
                            )
                        ) : (
                            initialRoomData.areaWarning ? (
                                <span className="text-rose-400 flex items-center gap-1 font-mono">
                                    <MdWarning size={15} /> Non-Compliant (Area {initialRoomData.areaWarning})
                                </span>
                            ) : initialRoomData.isItuCompliant ? (
                                <span className="text-emerald-400 flex items-center gap-1 font-mono">
                                    <MdCheckCircle size={15} /> Compliant
                                </span>
                            ) : (
                                <span className="text-rose-400 flex items-center gap-1 font-mono">
                                    <MdCancel size={15} /> Non-Compliant (Ratio)
                                </span>
                            )
                        )}
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 text-sm min-h-[120px]">
                        <p className="text-[11px] uppercase text-slate-400 font-bold mb-2">(&lt;200Hz)</p>
                        <div className="max-h-44 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs pr-1">
                            {initialRoomData.modes.map((m, idx) => (
                                <div key={idx} className="flex flex-col p-1.5 rounded bg-slate-900/50 border border-slate-700/60 justify-between">
                                    <div className="flex justify-between items-center">
                                        <span className={m.type === 'Axial' ? 'text-red-400 font-bold' : 'text-slate-400'}>
                                            {m.freq} Hz <span className="text-[9px] font-sans opacity-70">({m.type[0]})</span>
                                        </span>
                                        <span className="text-slate-500 text-[10px]">{m.label}</span>
                                    </div>
                                    {m.type === 'Axial' && m.clustering && (
                                        <div className="text-[9px] text-rose-400 mt-1 bg-rose-950/40 px-1 py-0.5 rounded border border-rose-900/50 truncate" title={m.clusteringDetails}>
                                            ⚠️ Axial Cluster (±5%)
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* RESULTS CONTAINER */}
            {result && isInputComplete && (
                <div ref={resultRef} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                        <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span> {strategyMode === 'controlled' ? "Initial Rectangular Dimensions" : "Splaying Results"}
                    </h2>

                    {activeTab === 'optimum' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                                <div className="lg:col-span-5 max-h-[440px] overflow-y-auto border rounded-xl shadow-inner bg-white">
                                    <table className="w-full text-sm min-w-[360px]">
                                        <thead className="bg-slate-100 sticky top-0 shadow-sm z-10">
                                            <tr>
                                                <th className="p-2 text-left text-xs">Angle</th>
                                                <th className="p-2 text-left text-xs">Ratio Result</th>
                                                <th className="p-2 text-center text-xs">Axial Clusters</th>
                                                <th className="p-2 text-center text-xs">First Cluster</th>
                                                <th className="p-2 text-center text-xs w-[65px]">ITU</th>
                                                <th className="p-2 text-center text-xs">View</th>
                                                <th className="p-2 text-center text-xs">Optimization</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.map((r, i) => (
                                                <tr key={i} onClick={() => handleCalculateModal(r.angle, r.message)} className={`border-t hover:bg-slate-50 cursor-pointer transition-colors ${selectedModalData?.angle === r.angle ? 'bg-blue-50/80 hover:bg-blue-100/60' : ''}`}>
                                                    <td className="p-2 flex items-center justify-between gap-1">
                                                        <span className="font-semibold">{r.angle}°</span>
                                                    </td>
                                                    <td className="p-2 font-mono text-xs">{r.message}</td>
                                                    <td className="p-2 text-center font-mono text-xs">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.totalClusters === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                            {r.totalClusters}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 text-center font-mono text-xs text-slate-600">
                                                        {r.firstClusterAt === 999 ? (
                                                            <span className="text-emerald-600 font-sans text-xs font-medium">None (Clean)</span>
                                                        ) : (
                                                            <span>{r.firstClusterAt} Hz</span>
                                                        )}
                                                    </td>
                                                    <td className="p-2 flex flex-col items-center justify-center text-[10px] gap-0.5">
                                                        {r.warning && <span className="text-amber-600 font-bold bg-amber-50 px-1 rounded border border-amber-200">⚠️ &lt;4m</span>}
                                                        {r.targetArea < 20 && <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded border border-rose-200">⚠️ &lt;20m²</span>}
                                                        {r.targetArea > 60 && <span className="text-amber-600 font-bold bg-amber-50 px-1 rounded border border-amber-200">⚠️ &gt;60m²</span>}
                                                        {!r.warning && r.targetArea >= 20 && r.targetArea <= 60 && <span className="text-emerald-600 font-medium text-xs">✅</span>}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <MdAssessment className={`inline ${selectedModalData?.angle === r.angle ? 'text-indigo-600' : 'text-slate-400'}`} size={18} />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        {r.isOptimizedTarget ? (
                                                            r.totalClusters === 0 ? (
                                                                <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 text-[10px] tracking-wide animate-pulse inline-block shadow-xs font-bold">
                                                                    ✨ PERFECT SETUP
                                                                </span>
                                                            ) : (
                                                                <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 text-[10px] tracking-wide animate-pulse inline-block shadow-xs font-semibold">
                                                                    ✨ OPTIMIZED
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="lg:col-span-7 animate-in fade-in duration-300">
                                    {selectedModalData ? (
                                        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800">
                                            <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
                                                <div>
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                                                        Target Angle Response ({selectedModalData.angle}° Splay)
                                                    </h3>
                                                    <p className="text-xs text-slate-400 font-mono">{selectedModalData.ratio}</p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 text-sm min-h-[120px]">
                                                <p className="text-[11px] uppercase text-slate-400 font-bold mb-2">Calculated (&lt;200Hz)</p>
                                                <div className="max-h-56 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs pr-1">
                                                    {selectedModalData.modes.map((m, idx) => (
                                                        <div key={idx} className="flex flex-col p-1.5 rounded bg-slate-900/50 border border-slate-700/60 justify-between">
                                                            <div className="flex justify-between items-center">
                                                                <span className={m.type === 'Axial' ? 'text-red-400 font-bold' : 'text-slate-400'}>
                                                                    {m.freq} Hz <span className="text-[9px] font-sans opacity-70">({m.type[0]})</span>
                                                                </span>
                                                                <span className="text-slate-500 text-[10px]">{m.label}</span>
                                                            </div>
                                                            {m.type === 'Axial' && m.clustering && (
                                                                <div className="text-[9px] text-rose-400 mt-1 bg-rose-950/40 px-1 py-0.5 rounded border border-rose-900/50 truncate">
                                                                    ⚠️ Axial Cluster (±5%)
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 p-4 text-center bg-slate-50/40">
                                            <MdAssessment size={32} className="text-slate-300 mb-2 animate-pulse" />
                                            <p className="text-xs font-medium">Select any row to visualize potential modal distributions.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'controlled' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-sm animate-in zoom-in-95 duration-200">
                                <div className="p-3 md:p-2.5 bg-slate-50 border border-slate-100 rounded">
                                    <p className="text-xs md:text-[10px] text-indigo-500 uppercase font-sans tracking-wide">Width</p>
                                    <p className="text-base md:text-sm font-semibold">{result.width.rear.toFixed(2)} m</p>
                                </div>
                                <div className="p-3 md:p-2.5 bg-slate-50 border border-slate-100 rounded">
                                    <p className="text-xs md:text-[10px] text-indigo-500 uppercase font-sans tracking-wide">Length</p>
                                    <p className="text-base md:text-sm font-semibold">{result.length.toFixed(2)} m</p>
                                </div>
                                <div className="p-3 md:p-2.5 bg-slate-50 border border-slate-100 rounded">
                                    <p className="text-xs md:text-[10px] text-indigo-500 uppercase font-sans tracking-wide">Angle</p>
                                    <p className="text-base md:text-sm font-semibold">{result.angle_deg}°</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                                <div className="lg:col-span-7 animate-in fade-in duration-300">
                                    <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800">
                                        <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
                                            <div>
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                                                    Splayed Model Response
                                                </h3>
                                                <p className="text-xs text-slate-400 font-mono">
                                                    Averaged Dimensions: {splayedW.toFixed(2)} m x {splayedL.toFixed(2)} m x {currentHeight} m
                                                </p>
                                                <span className="text-slate-500 text-sm">
                                                    1 : {safeSw.toFixed(2)} : {safeSL.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 text-sm min-h-[120px]">
                                            <p className="text-[11px] uppercase text-slate-400 font-bold mb-2">(&lt;200Hz)</p>
                                            <div className="max-h-56 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs pr-1">
                                                {splayedModes?.map((m, idx) => (
                                                    <div key={idx} className="flex flex-col p-1.5 rounded bg-slate-900/50 border border-slate-700/60 justify-between">
                                                        <div className="flex justify-between items-center">
                                                            <span className={m.type === 'Axial' ? 'text-red-400 font-bold' : 'text-slate-400'}>
                                                                {m.freq} Hz <span className="text-[9px] font-sans opacity-70">({m.type[0]})</span>
                                                            </span>
                                                            <span className="text-slate-500 text-[10px]">{m.label}</span>
                                                        </div>
                                                        {m.type === 'Axial' && m.clustering && (
                                                            <div className="text-[9px] text-rose-400 mt-1 bg-rose-950/40 px-1 py-0.5 rounded border border-rose-900/50 truncate">
                                                                ⚠️ Axial Cluster (±5%)
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-5 bg-slate-50/50 rounded-xl border border-slate-100 shadow-inner">
                                    <ControlledRoomVisualizer result={result} />
                                </div>

                            </div>
                            <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span> Result - Splayed Model Dimensions
                            </h2>
                            <div className="grid grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-sm animate-in zoom-in-95 duration-200">
                                <div className="p-3 md:p-2.5 bg-slate-50 border border-slate-100 rounded">
                                    <p className="text-xs md:text-[10px] text-indigo-500 uppercase font-sans tracking-wide">Width Rear</p>
                                    <p className="text-base md:text-sm font-semibold">{result.width.rear.toFixed(2)} m</p>
                                </div>
                                <div className="p-3 md:p-2.5 bg-slate-50 border border-slate-100 rounded">
                                    <p className="text-xs md:text-[10px] text-indigo-500 uppercase font-sans tracking-wide">Width Front</p>
                                    <p className="text-base md:text-sm font-semibold">{result.width.front.toFixed(2)} m</p>
                                </div>
                                <div className="p-3 md:p-2.5 bg-slate-50 border border-slate-100 rounded">
                                    <p className="text-xs md:text-[10px] text-indigo-500 uppercase font-sans tracking-wide">Length</p>
                                    <p className="text-base md:text-sm font-semibold">{splayedL.toFixed(2)} m</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}