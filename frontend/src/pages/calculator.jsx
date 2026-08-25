import { useState, useRef, useEffect } from 'react';
import * as analysis from '../../services/analysis.js';
import * as modalAnalysis from '../../services/modalResponse.js';
import { getProceduralRandomRatio } from '../../services/zoneAnalysis.js';
import { calculateFSI } from '../../services/fsiCalculator.js';
import {
    MdAssessment, MdCheckCircle, MdCancel, MdLayers, MdArchitecture,
    MdExpandMore, MdExpandLess, MdWarning, MdPlayArrow, MdSave, MdDelete
} from 'react-icons/md';
import RoomComplianceChart from '../components/RoomComplianceChart.jsx';
import * as real3DAnalysis from '../../services/real3DAnalysis.js';
import SavedRow from '../components/SavedRow.jsx';
import { exportSavedRunsToExcel } from '../../services/exportAsExcel.js';
import ControlledRoomVisualizer from '../components/ControlledRoomVisualizer.jsx';

export default function Calculator() {
    const [strategyMode, setStrategyMode] = useState('optimum');
    // Splay type state: 'double' | 'single'
    const [splayType, setSplayType] = useState('double');
    const [isChartVisible, setIsChartVisible] = useState(true);
    const [highlightZone, setHighlightZone] = useState(null);
    const [real3DModes, setReal3DModes] = useState([]);
    const [is3DLoading, setIs3DLoading] = useState(false);
    const [last3DAnalysis, setLast3DAnalysis] = useState(null);
    const [runningAngle, setRunningAngle] = useState(null);

    const [saved3DRuns, setSaved3DRuns] = useState([]);

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
    const [initialRoomData, setInitialRoomData] = useState({ modes: [], isItuCompliant: false, areaWarning: null, fsi: null });

    const resultRef = useRef(null);
    const savedTableRef = useRef(null);

    // --- VALIDATION & FALLBACKS ---
    const parsedWRatio = inputs.wRatio !== '' ? Number(inputs.wRatio) : NaN;
    const parsedLRatio = inputs.lRatio !== '' ? Number(inputs.lRatio) : NaN;
    const parsedHeight = inputs.height !== '' ? Number(inputs.height) : NaN;

    const isInputComplete =
        !isNaN(parsedWRatio) &&
        !isNaN(parsedLRatio) &&
        parsedWRatio >= 0.5 &&
        parsedLRatio >= 0.5;

    const safeSw = isInputComplete ? parsedWRatio : 1.23;
    const safeSL = isInputComplete ? parsedLRatio : 1.4;
    const rawInputHeight = !isNaN(parsedHeight) ? Math.max(0.1, parsedHeight) : 2.5;

    const designMetrics = isInputComplete
        ? analysis.calculateDesignPhaseMetrics(safeSw, safeSL, Number(inputs.angle || 0), splayType)
        : null;

    const hMinArea = isInputComplete ? Math.sqrt(20 / (safeSw * safeSL)) : 2.5;
    const optimumMinH = Number(Math.max(2.5, hMinArea).toFixed(2));
    const controlledEffectiveMinH = 2.5;
    const controlledWallLimitH = Number((designMetrics?.hMin || 2.5).toFixed(2));

    const currentHeight = strategyMode === 'controlled'
        ? Math.max(Number(controlledHeight) || controlledEffectiveMinH, controlledEffectiveMinH)
        : rawInputHeight;

    const controlledWallWarning = strategyMode === 'controlled' && currentHeight < controlledWallLimitH;

    let w = currentHeight * safeSw;
    let l = currentHeight * safeSL;

    if (strategyMode === 'controlled' && isInputComplete && designMetrics) {
        w = designMetrics.sPrimeW * currentHeight;
        l = designMetrics.sPrimeL_straight * currentHeight;
    }
    const currentArea = w * l;
    const splayedL = currentHeight * safeSL;

    // MOD DEĞİŞTİĞİNDE 3D FREKANS VE SONUÇLARINI SIFIRLAMA FONKSİYONU
    const handleSwitchStrategyMode = (mode) => {
        setStrategyMode(mode);
        setResult(null);
        setActiveTab(null);
        setSelectedModalData(null);
        setReal3DModes([]);        // 3D Son frekanslar silinir
        setLast3DAnalysis(null);   // 3D Analiz bilgisi silinir
    };

    useEffect(() => {
        if (strategyMode !== 'controlled' || !isInputComplete) return;
        setControlledHeight(prev => Number(Math.max(Number(prev) || controlledEffectiveMinH, controlledEffectiveMinH).toFixed(2)));
    }, [strategyMode, controlledEffectiveMinH, isInputComplete]);

    useEffect(() => {
        if (!isInputComplete) return;
        const modes = modalAnalysis.calculateAllModes(w.toFixed(2), l.toFixed(2), currentHeight);
        const currentRatioW = w / currentHeight;
        const currentRatioL = l / currentHeight;
        const isItuCompliant = analysis.checkRatio(currentRatioW, currentRatioL);

        let areaWarning = null;
        if (strategyMode !== 'controlled') {
            if (currentArea < 20) areaWarning = '< 20m²';
            else if (currentArea > 60) areaWarning = '> 60m²';
        }

        const rawFreqs = modes.map(m => m.freq);
        const fsiVal = calculateFSI(rawFreqs, 25);

        setInitialRoomData({ modes, isItuCompliant, areaWarning, fsi: fsiVal });
    }, [currentHeight, isInputComplete, w, l, currentArea, strategyMode]);

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
                Number(inputs.angle || 0),
                splayType
            );
            setResult(updatedResult);
        }
    }, [inputs.wRatio, inputs.lRatio, controlledHeight, inputs.angle, strategyMode, isInputComplete, splayType]);

    // Invalidate optimization results if geometry changes in optimum mode
    useEffect(() => {
        if (strategyMode === 'optimum') {
            if (result !== null) {
                setResult(null);
                setActiveTab(null);
                setSelectedModalData(null);
                setReal3DModes([]);
                setLast3DAnalysis(null);
            }
        }
    }, [currentHeight, parsedWRatio, parsedLRatio, strategyMode, splayType]);

    // --- 3D SOLVER COPY HANDLERS ---
    const handleCopy3DTable = async () => {
        if (!real3DModes.length) return;
        const tableText = ['Mode\tFrequency (Hz)', ...real3DModes.map((freq, idx) => `${idx + 1}\t${freq}`)].join('\n');
        try { await navigator.clipboard.writeText(tableText); } catch (err) { console.error('Copy failed:', err); }
    };

    const handleCopy3DFrequencyList = async () => {
        if (!real3DModes.length) return;
        try { await navigator.clipboard.writeText(real3DModes.join('\n')); } catch (err) { console.error('Copy failed:', err); }
    };

    // --- RAYLEIGH ANALYTIC COPY HANDLERS ---
    const handleCopyRayleighTable = async (modes) => {
        if (!modes || !modes.length) return;
        const tableText = [
            'Index\tFrequency (Hz)\tType\tLabel\tCluster',
            ...modes.map((m, idx) =>
                `${idx + 1}\t${m.freq}\t${m.type}\t${m.label || ''}\t${m.clustering ? 'Cluster' : ''}`
            )
        ].join('\n');
        try { await navigator.clipboard.writeText(tableText); } catch (err) { console.error('Copy failed:', err); }
    };

    const handleCopyRayleighFrequencyList = async (modes) => {
        if (!modes || !modes.length) return;
        try { await navigator.clipboard.writeText(modes.map(m => m.freq).join('\n')); } catch (err) { console.error('Copy failed:', err); }
    };

const run3DSolver = async (geomData) => {
    setRunningAngle(geomData.angle_deg);
    setIs3DLoading(true);

    const wMin = Math.min(geomData.width.front, geomData.width.rear);
    const wMax = Math.max(geomData.width.front, geomData.width.rear);
    const activeHeight = geomData.height ?? currentHeight;

    // FEM geometry convention:
    // - Double-sided: both longitudinal edges have the same physical length.
    //   The solver receives that common length.
    // - Single-sided: one longitudinal edge is straight (the original
    //   rectangular length) and the opposite edge is splayed. The FEM mesh
    //   uses the straight edge as the x-direction reference length; the
    //   width taper (wMin -> wMax) creates the inclined wall. The two physical
    //   edge lengths are retained only for reporting.
    const lengthStraight =
        geomData.lengthStraight ??
        geomData.lengthEdges?.straight ??
        geomData.length;

    const lengthSplayed =
        geomData.lengthSplayed ??
        geomData.lengthEdges?.splayed ??
        geomData.length;

    const femLength = splayType === 'single'
        ? lengthStraight
        : (geomData.femLength ?? geomData.length);

    try {
        const data = await real3DAnalysis.calculateReal3DModes(
            femLength,
            activeHeight,
            wMin,
            wMax,
            splayType
        );

        if (!data) {
            return;
        }

        if (data.frequencies) {
            const calculatedFemFsi = calculateFSI(data.frequencies, 25);
            setReal3DModes(data.frequencies);
            setLast3DAnalysis({
                widthFront: geomData.width.front,
                widthRear: geomData.width.rear,
                length: femLength,
                lengthStraight,
                lengthSplayed,
                lengthEdgeFront: lengthSplayed,
                lengthEdgeRear: lengthStraight,
                height: activeHeight,
                angle: geomData.angle_deg,
                modeName: geomData.modeName,
                splayType,
                outerRatio: geomData.outerRatio,
                avgRatio: geomData.avgRatio,
                fsi: calculatedFemFsi
            });
        }
    } finally {
        setRunningAngle(null);
        setIs3DLoading(false);
    }
};

const handleCalculate3D = () => {
    if (strategyMode === 'controlled' && result) {
        run3DSolver({
            width: result.width,
            length: result.length,
            lengthStraight: result.lengthEdges?.straight ?? result.length,
            lengthSplayed: result.lengthEdges?.splayed ?? result.length,
            height: currentHeight,
            angle_deg: result.angle_deg,
            modeName: splayType === 'single' ? 'Controlled Single-sided' : 'Controlled Double-sided',
            outerRatio: `1:${parsedWRatio.toFixed(2)}:${parsedLRatio.toFixed(2)}`,
            avgRatio: `1:${result.w_ratio.toFixed(2)}:${result.l_ratio.toFixed(2)}`
        });
    }
};

    const scrollToSavedTable = () => {
        setTimeout(() => {
            savedTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleSave3DResult = () => {
        if (!last3DAnalysis || !real3DModes.length) return;
        const newRecord = {
            id: Date.now(),
            angle: last3DAnalysis.angle,
            modeName: last3DAnalysis.modeName || (strategyMode === 'controlled' ? 'Controlled' : 'Inward'),
            splayType: last3DAnalysis.splayType || splayType,
            outerRatio: last3DAnalysis.outerRatio || `1:${parsedWRatio.toFixed(2)}:${parsedLRatio.toFixed(2)}`,
            avgRatio: last3DAnalysis.avgRatio || 'N/A',
            dimensions: `Wf ${last3DAnalysis.widthFront.toFixed(2)}m / Wr ${last3DAnalysis.widthRear.toFixed(2)}m | Lf ${last3DAnalysis.lengthEdgeFront.toFixed(2)}m / Lr ${last3DAnalysis.lengthEdgeRear.toFixed(2)}m`,
            height: last3DAnalysis.height,
            frequencies: [...real3DModes],
            fsi: last3DAnalysis.fsi
        };
        setSaved3DRuns(prev => [...prev, newRecord]);
        scrollToSavedTable();
    };

    const handleDeleteSaved = (id) => {
        setSaved3DRuns(prev => prev.filter(item => item.id !== id));
    };

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
            setReal3DModes([]);
            setLast3DAnalysis(null);
            return;
        }

        // Enforce ratio limits for direct keyboard input as well as the +/- buttons.
        if (name === 'wRatio' || name === 'lRatio') {
            const numericVal = Number(val);
            if (!Number.isFinite(numericVal)) return;

            const clampedVal = Math.min(3, Math.max(1, numericVal));
            const nextInputs = {
                ...inputs,
                [name]: clampedVal
            };

            setInputs(nextInputs);

            if (strategyMode === 'controlled') {
                setControlledHeight(prev => parseFloat(Math.max(Number(prev) || 2.5, 2.5).toFixed(2)));
            }

            setResult(null);
            setActiveTab(null);
            setSelectedModalData(null);
            setReal3DModes([]);
            setLast3DAnalysis(null);
            return;
        }

        if (name !== 'height') {
            const nextInputs = { ...inputs, [name]: val };
            const currentW = Number(nextInputs.wRatio);
            const currentL = Number(nextInputs.lRatio);
            const isCurrentlyComplete = currentW >= 0.5 && currentL >= 0.5;

            if (isCurrentlyComplete) {
                if (strategyMode === 'controlled') {
                    setInputs(nextInputs);
                    setControlledHeight(prev => parseFloat(Math.max(Number(prev) || 2.5, 2.5).toFixed(2)));
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

    const handleStop3D = () => {
        real3DAnalysis.cancelReal3DCalculation();
    };

    const stepInput = (name, direction, stepValue) => {
        if (name === 'height') {
            if (strategyMode === 'controlled') {
                setControlledHeight(prev => {
                    const currentVal = Number(prev) || controlledEffectiveMinH;
                    const newVal = direction === 'up' ? currentVal + stepValue : currentVal - stepValue;
                    return parseFloat(Math.max(controlledEffectiveMinH, newVal).toFixed(2));
                });
            } else {
                setInputs(prev => {
                    const currentVal = Number(prev.height) || optimumMinH;
                    const newVal = direction === 'up' ? currentVal + stepValue : currentVal - stepValue;
                    return { ...prev, height: parseFloat(Math.max(optimumMinH, newVal).toFixed(2)) };
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
            setInputs(nextInputs);
            setControlledHeight(prev => parseFloat(Math.max(Number(prev) || 2.5, 2.5).toFixed(2)));
        } else {
            setInputs(nextInputs);
        }
    };

    const handleClearAllSaved = () => {
        if (saved3DRuns.length === 0) return;
        if (window.confirm("Kaydedilen tüm 3D analiz raporları silinecek. Emin misiniz?")) {
            setSaved3DRuns([]);
        }
    };

    const handleGenerateRatio = (zone) => {
        setHighlightZone(zone);
        setTimeout(() => setHighlightZone(null), 1800);

        const coords = getProceduralRandomRatio(zone);

        if (strategyMode === 'controlled') {
            setInputs(prev => ({
                ...prev,
                wRatio: Number(coords.wRatio.toFixed(2)),
                lRatio: Number(coords.lRatio.toFixed(2))
            }));
            setControlledHeight(prev => Math.max(Number(prev) || 2.5, 2.5));
        } else {
            setInputs(prev => ({
                ...prev,
                wRatio: Number(coords.wRatio.toFixed(2)),
                lRatio: Number(coords.lRatio.toFixed(2))
            }));
        }

        setResult(null);
        setActiveTab(null);
        setReal3DModes([]);
        setLast3DAnalysis(null);
    };

    const runOptimum = () => {
        if (!isInputComplete) return;

        const safeHeight = !isNaN(parsedHeight) && parsedHeight > 0 ? parsedHeight : currentHeight;

        try {
            const origRes = analysis.calculateTheOptimumRatio(w, l, safeHeight, splayType);

            if (!origRes || !Array.isArray(origRes)) {
                console.error("Optimum ratio calculation returned empty or invalid data.");
                return;
            }

            const enhancedRes = origRes.map(row => {
                const targetW = row.avgWidth;
                const targetL = row.avgLength;
                const targetArea = targetW * targetL;

                const targetModesResult = modalAnalysis.calculateAllModes(targetW, targetL, safeHeight);
                const rawModes = Array.isArray(targetModesResult)
                    ? targetModesResult
                    : (targetModesResult?.modes || []);

                const rayleighFsi = calculateFSI(rawModes.map(m => m?.freq).filter(Boolean), 25);

                const angleRad = (row.angle * Math.PI) / 180;
                const physicalLength = l / Math.cos(angleRad);
                let physicalWidthShort;
                if (splayType === 'single') {
                    physicalWidthShort = w - (l * Math.tan(angleRad));
                } else {
                    physicalWidthShort = w - (2 * l * Math.tan(angleRad));
                }
                const physicalWidthLong = w;

                const totalClusters = targetModesResult?.meta?.totalAxialClusters ?? 0;
                const firstClusterAt = targetModesResult?.meta?.firstClusterFreq ?? 999;

                return {
                    ...row,
                    targetArea,
                    rayleighFsi,
                    totalClusters,
                    firstClusterAt,
                    physicalGeometry: {
                        width: {
                            front: physicalWidthShort,
                            rear: physicalWidthLong
                        },
                        length: physicalLength,
                        lengthStraight: row.length?.straight ?? l,
                        lengthSplayed: row.length?.splayed ?? physicalLength,
                        lengthEdgeFront: row.length?.splayed ?? physicalLength,
                        lengthEdgeRear: row.length?.straight ?? l,
                        height: safeHeight,
                        angle_deg: row.angle,
                        modeName: splayType === 'single' ? 'Inward Single-sided' : 'Inward Double-sided',
                        outerRatio: `1:${parsedWRatio.toFixed(2)}:${parsedLRatio.toFixed(2)}`,
                        avgRatio: row.message
                    }
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
            setReal3DModes([]);
            setLast3DAnalysis(null);
            scrollToResults();

        } catch (err) {
            console.error("Optimum calculation execution error:", err);
        }
    };

    const runControlled = () => {
        if (!isInputComplete) return;
        const res = analysis.splayTheRoomWithTheSameRatio(parsedWRatio, parsedLRatio, controlledHeight, inputs.angle, splayType);
        setActiveTab('controlled');
        setResult(res);
        setSelectedModalData(null);
        setReal3DModes([]);
        setLast3DAnalysis(null);
        scrollToResults();
    };

    const handleCalculateModal = (angle, ratioStr) => {
        const parts = ratioStr.split(':');
        const targetW = currentHeight * parseFloat(parts[1]);
        const targetL = currentHeight * parseFloat(parts[2]);

        const modesResult = modalAnalysis.calculateAllModes(targetW, targetL, currentHeight);
        const rawModes = Array.isArray(modesResult) ? modesResult : (modesResult?.modes || []);
        const fsiVal = calculateFSI(rawModes.map(m => m?.freq).filter(Boolean), 25);

        setSelectedModalData({ angle, ratio: ratioStr, modes: rawModes, fsi: fsiVal });
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans text-slate-800 select-none">

            {/* STRATEGY MODE SELECTION */}
            <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60">
                <button
                    onClick={() => handleSwitchStrategyMode('optimum')}
                    className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs sm:text-sm font-semibold tracking-wide transition-all ${strategyMode === 'optimum' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <MdLayers size={18} className="shrink-0" />
                    <span className="text-center leading-tight">
                        EXISTING ROOM <br className="hidden lg:block" /> (INWARD SPLAY)
                    </span>
                </button>
                <button
                    onClick={() => handleSwitchStrategyMode('controlled')}
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
                    {/* SPLAY TYPE SELECTOR */}
                    <div className="flex flex-col pt-2">
                        <label className="block text-xs mb-1 text-slate-600 font-medium">Splay Type</label>
                        <div className="flex gap-3 items-center">
                            <label className="inline-flex items-center text-xs cursor-pointer">
                                <input
                                    type="radio"
                                    name="splayType"
                                    value="double"
                                    checked={splayType === 'double'}
                                    onChange={() => {
                                        setSplayType('double');
                                        setResult(null);
                                        setActiveTab(null);
                                        setSelectedModalData(null);
                                        setReal3DModes([]);
                                        setLast3DAnalysis(null);
                                    }}
                                    className="accent-indigo-600 mr-1"
                                />
                                Double-sided
                            </label>
                            <label className="inline-flex items-center text-xs cursor-pointer">
                                <input
                                    type="radio"
                                    name="splayType"
                                    value="single"
                                    checked={splayType === 'single'}
                                    onChange={() => {
                                        setSplayType('single');
                                        setResult(null);
                                        setActiveTab(null);
                                        setSelectedModalData(null);
                                        setReal3DModes([]);
                                        setLast3DAnalysis(null);
                                    }}
                                    className="accent-indigo-600 mr-1"
                                />
                                Single-sided
                            </label>
                        </div>
                    </div>

                    {/* INPUT: Width Ratio */}
                    <div>
                        <label className="block text-xs mb-1 text-slate-600">{strategyMode === 'controlled' ? 'Target Width Ratio (Sw)' : 'Width Ratio (Sw)'} </label>
                        <div className="flex items-center rounded border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                            <button type="button" onClick={() => stepInput('wRatio', 'down', 0.01)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors">-</button>
                            <input name="wRatio" max={3} min={1} type="number" step="0.01" value={inputs.wRatio} onChange={handleInputChange} className="w-full p-1.5 text-sm text-center border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            <button type="button" onClick={() => stepInput('wRatio', 'up', 0.01)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors">+</button>
                        </div>
                    </div>

                    {/* INPUT: Length Ratio */}
                    <div>
                        <label className="block text-xs mb-1 text-slate-600">{strategyMode === 'controlled' ? 'Target Length Ratio (SL)' : 'Length Ratio (SL)'}</label>
                        <div className="flex items-center rounded border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                            <button type="button" onClick={() => stepInput('lRatio', 'down', 0.01)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors">-</button>
                            <input name="lRatio" max={3} min={1} type="number" step="0.01" value={inputs.lRatio} onChange={handleInputChange} className="w-full p-1.5 text-sm text-center border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            <button type="button" onClick={() => stepInput('lRatio', 'up', 0.01)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors">+</button>
                        </div>
                    </div>

                    {strategyMode === 'controlled' && (
                        <div className="pt-3 border-t border-slate-200/60 animate-in slide-in-from-top duration-300">
                            <label className="block text-xs mb-1 text-indigo-700 font-medium">Target Splay Angle (Degrees)</label>
                            <div className="flex items-center rounded border border-indigo-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                                <button type="button" onClick={() => stepInput('angle', 'down', 0.5)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-colors">-</button>
                                <input name="angle" type="number" step="0.5" value={inputs.angle} onChange={handleInputChange} className="w-full p-1.5 text-sm text-center border-none outline-none bg-indigo-50/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                <button type="button" onClick={() => stepInput('angle', 'up', 0.5)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-colors">+</button>
                            </div>
                        </div>
                    )}

                    {/* INPUT: Height */}
                    <div className="pt-2 border-t border-slate-200/40 space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs text-slate-600">Height (h) - meters</label>
                            {isInputComplete && strategyMode === 'controlled' && (
                                <span className="text-[10px] font-mono font-bold flex items-center gap-1 px-1.5 py-0.5 rounded shadow-3xs animate-fade-in text-amber-700 bg-amber-50/60">
                                    <MdWarning size={12} />
                                    {controlledWallWarning
                                        ? `4 m wall limit: ${controlledWallLimitH} m — Warning`
                                        : `4 m wall limit: ${controlledWallLimitH} m`}
                                </span>
                            )}
                        </div>

                        <div className={`flex items-center rounded border bg-white overflow-hidden focus-within:ring-2 ${strategyMode === 'controlled' ? 'border-indigo-200 focus-within:ring-indigo-500' : 'border-slate-200 focus-within:ring-blue-500'}`}>
                            <button
                                type="button"
                                disabled={
                                    !isInputComplete ||
                                    (strategyMode === 'controlled' && Number(controlledHeight) <= controlledEffectiveMinH) ||
                                    (strategyMode === 'optimum' && Number(inputs.height) <= optimumMinH)
                                }
                                onClick={() => stepInput('height', 'down', 0.01)}
                                className={`px-3 py-1.5 font-bold transition-colors select-none cursor-pointer
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
                                step="0.01"
                                value={strategyMode === 'controlled' ? controlledHeight : inputs.height}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (strategyMode === 'controlled') {
                                        setControlledHeight(val === '' ? '' : Number(val));
                                    } else {
                                        setInputs({ ...inputs, height: val === '' ? '' : Number(val) });
                                    }
                                }}
                                onBlur={() => {
                                    if (strategyMode === 'controlled') {
                                        setControlledHeight(prev => {
                                            const num = Number(prev);
                                            if (isNaN(num) || num < controlledEffectiveMinH) {
                                                return controlledEffectiveMinH;
                                            }
                                            return parseFloat(num.toFixed(2));
                                        });
                                    } else {
                                        setInputs(prev => {
                                            const num = Number(prev.height);
                                            if (isNaN(num) || num < optimumMinH) {
                                                return { ...prev, height: optimumMinH };
                                            }
                                            return { ...prev, height: parseFloat(num.toFixed(2)) };
                                        });
                                    }
                                }}
                                className="w-full p-1.5 text-sm text-center border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-semibold text-slate-900"
                                placeholder={strategyMode === 'controlled' ? controlledEffectiveMinH.toString() : optimumMinH.toString()}
                            />

                            <button
                                type="button"
                                disabled={!isInputComplete}
                                onClick={() => stepInput('height', 'up', 0.01)}
                                className={`px-3 py-1.5 font-bold transition-colors cursor-pointer ${strategyMode === 'controlled' ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed'}`}
                            >
                                +
                            </button>
                        </div>

                        {isInputComplete && (
                            <div className="pt-1 px-1 animate-fade-in">
                                <input
                                    type="range"
                                    min={strategyMode === 'controlled' ? controlledEffectiveMinH : optimumMinH}
                                    max={strategyMode === 'controlled' ? Math.max(controlledEffectiveMinH + 3, controlledWallLimitH + 3) : 6.0}
                                    step="0.01"
                                    value={strategyMode === 'controlled'
                                        ? (controlledHeight || controlledEffectiveMinH)
                                        : (inputs.height || optimumMinH)}
                                    onChange={(e) => {
                                        const val = parseFloat(Number(e.target.value).toFixed(2));
                                        if (strategyMode === 'controlled') {
                                            setControlledHeight(val);
                                        } else {
                                            setInputs({ ...inputs, height: Math.max(optimumMinH, val) });
                                        }
                                    }}
                                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 focus:outline-none accent-indigo-600`}
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                                    <span>Min: {strategyMode === 'controlled' ? controlledEffectiveMinH : optimumMinH}m</span>
                                    <span>Max: {strategyMode === 'controlled' ? Math.max(controlledEffectiveMinH + 3, controlledWallLimitH + 3).toFixed(2) : 6.0}m</span>
                                </div>
                            </div>
                        )}
                        
                    </div>

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

                {/* ITU COMPLIANCE CHART VISUALIZATION */}
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

            {/* INITIAL ROOM STATE VIEW */}
            {isInputComplete && (
                <div className="mb-6 p-4 bg-slate-900 text-white rounded-xl shadow-md animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-700 pb-2 mb-3 gap-3">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider">
                                {strategyMode === 'controlled' ? 'Pre-Splay Reference Rectangle' : 'Initial Room Response'}
                            </h2>
                            <p className="text-xs text-slate-200 font-mono">Dimensions: {w.toFixed(2)} m x {l.toFixed(2)} m x {currentHeight.toFixed(2)} m</p>
                            <span className="text-slate-400 text-xs">
                                1 : {(w / currentHeight).toFixed(2)} : {(l / currentHeight).toFixed(2)}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {initialRoomData.fsi && (
                                <div className="px-2.5 py-1 bg-indigo-950/80 border border-indigo-700/60 rounded text-xs font-mono text-indigo-300">
                                    FSI: <span className="font-bold text-white">{initialRoomData.fsi}</span>
                                </div>
                            )}

                            {strategyMode === 'controlled' ? (
                                initialRoomData.areaWarning || controlledWallWarning ? (
                                    <span className="text-amber-400 flex items-center gap-1 font-mono text-xs">
                                        <MdWarning size={15} />
                                        Warning
                                        {initialRoomData.areaWarning && ` (Area ${initialRoomData.areaWarning})`}
                                        {controlledWallWarning && ` (4 m wall limit: ${controlledWallLimitH.toFixed(2)} m)`}
                                    </span>
                                ) : (
                                    <span className="text-cyan-100 font-mono flex items-center gap-1 text-sm">
                                        No warning
                                    </span>
                                )
                            ) : (
                                initialRoomData.areaWarning ? (
                                    <span className="text-rose-400 text-[13px] sm:text-xs flex items-center gap-1 font-mono">
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
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 text-sm min-h-[120px]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 pb-1 border-b border-slate-700/50 gap-2">
                            <p className="text-[11px] uppercase text-slate-400 font-bold">Rayleigh Analytic Modes (&lt;200Hz)</p>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => handleCopyRayleighTable(initialRoomData.modes)}
                                    disabled={!initialRoomData.modes?.length}
                                    className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-[10px] font-bold transition-opacity cursor-pointer w-full sm:w-auto"
                                >
                                    COPY TABLE
                                </button>
                                <button
                                    onClick={() => handleCopyRayleighFrequencyList(initialRoomData.modes)}
                                    disabled={!initialRoomData.modes?.length}
                                    className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-[10px] font-bold transition-opacity cursor-pointer w-full sm:w-auto"
                                >
                                    COPY FREQUENCY LIST
                                </button>
                            </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5 font-mono text-xs pr-1 select-text" style={{ userSelect: 'text' }}>
                            {initialRoomData.modes.map((m, idx) => (
                                <div
                                    key={idx}
                                    className="rounded bg-slate-950/60 border border-slate-800/80 text-slate-200 shadow-3xs hover:bg-slate-900/80 transition-colors p-3"
                                >
                                    <div className="hidden md:flex items-center justify-between select-text">
                                        <span className="text-slate-500 text-[11px] w-8 shrink-0">#{idx + 1}</span>
                                        <div className="flex items-center justify-center gap-1.5 flex-1 text-center">
                                            <span className={`font-bold text-sm ${m.type === 'Axial' ? 'text-red-400' : 'text-slate-300'}`}>
                                                {m.freq} Hz
                                            </span>
                                            <span className="text-[10px] font-sans text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                                                {m.type}
                                            </span>
                                        </div>
                                        <span className="text-slate-400 text-[11px] w-20 text-right font-mono shrink-0">
                                            {m.label || ''}
                                        </span>
                                        <div className="w-24 flex justify-end shrink-0 ml-2">
                                            {m.type === 'Axial' && m.clustering ? (
                                                <span className="text-[10px] text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/80 flex items-center gap-1 animate-pulse">
                                                    ⚠️ Cluster
                                                </span>
                                            ) : (
                                                <div className="w-full"></div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="md:hidden space-y-2">
                                        <div className="flex items-start justify-between">
                                            <span className="text-slate-500 text-xs">#{idx + 1}</span>
                                            <span className={`font-bold text-lg ${m.type === 'Axial' ? 'text-red-400' : 'text-slate-200'}`}>
                                                {m.freq} Hz
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs">
                                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                                                {m.type}
                                            </span>
                                            <span className="font-mono text-slate-400">{m.label || '-'}</span>
                                        </div>

                                        {m.type === 'Axial' && m.clustering && (
                                            <div className="text-[11px] text-rose-400 font-bold bg-rose-950/80 px-2 py-1 rounded border border-rose-800/80 inline-flex items-center gap-1">
                                                ⚠️ Cluster
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* RESULTS CONTAINER */}
            {result && isInputComplete && (
                <div ref={resultRef} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                        <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span> {strategyMode === 'controlled'
                            ? `Equivalent Trapezoidal Dimensions (${splayType === 'single' ? 'Single-sided' : 'Double-sided'})`
                            : "Splaying Results"}
                    </h2>

                    {activeTab === 'optimum' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                <div className="lg:col-span-6 max-h-[440px] overflow-y-auto border rounded-xl shadow-inner bg-white">
                                    <table className="w-full text-sm min-w-[400px]">
                                        <thead className="bg-slate-100 sticky top-0 shadow-sm z-10">
                                            <tr>
                                                <th className="p-2 text-left text-xs">Angle</th>
                                                <th className="p-2 text-left text-xs">Ratio Result</th>
                                                <th className="p-2 text-center text-xs">Axial Clusters</th>
                                                <th className="p-2 text-center text-xs">FSI</th>
                                                <th className="p-2 text-center text-xs">First Cluster</th>
                                                <th className="p-2 text-center text-xs">Compliance</th>
                                                <th className="p-2 text-center text-xs">3D Solver</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.map((r, i) => (
                                                <tr
                                                    key={i}
                                                    onClick={() => handleCalculateModal(r.angle, r.message)}
                                                    className={`border-t hover:bg-slate-50 cursor-pointer transition-colors ${selectedModalData?.angle === r.angle ? 'bg-blue-50/80 hover:bg-blue-100/60' : ''}`}
                                                >
                                                    <td className="p-2 font-semibold">{r.angle}°</td>
                                                    <td className="p-2 font-mono text-xs">{r.message}</td>
                                                    <td className="p-2 text-center font-mono text-xs">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.totalClusters === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                            {r.totalClusters}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 text-center font-mono text-xs font-bold text-indigo-600">
                                                        {r.rayleighFsi || 'N/A'}
                                                    </td>
                                                    <td className="p-2 text-center font-mono text-xs text-slate-600">
                                                        {r.firstClusterAt === 999 ? (
                                                            <span className="text-emerald-600 font-sans text-xs font-medium">None</span>
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
                                                    <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                        {runningAngle === r.angle ? (
                                                            <button
                                                                onClick={handleStop3D}
                                                                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                                                            >
                                                                STOP
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => run3DSolver(r.physicalGeometry)}
                                                                disabled={is3DLoading}
                                                                className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                                            >
                                                                <MdPlayArrow size={12} />
                                                                Run 3D
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* SEÇİLEN AÇININ RAYLEIGH MODELİ */}
                                <div className="lg:col-span-6 animate-in fade-in duration-300">
                                    {selectedModalData ? (
                                        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800">
                                            <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
                                                <div>
                                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-400">
                                                        Splayed Averaging Response {selectedModalData.angle}°
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-mono">{selectedModalData.ratio}</p>
                                                </div>
                                                {selectedModalData.fsi && (
                                                    <div className="px-2.5 py-1 bg-indigo-950 border border-indigo-700/60 rounded text-xs font-mono text-indigo-300">
                                                        FSI: <span className="font-bold text-white">{selectedModalData.fsi}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 text-sm min-h-[120px]">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 pb-1 border-b border-slate-700/50 gap-2">
                                                    <p className="text-[11px] uppercase text-slate-400 font-bold">Calculated (&lt;200Hz)</p>
                                                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                                        <button
                                                            onClick={() => handleCopyRayleighTable(selectedModalData.modes)}
                                                            disabled={!selectedModalData.modes?.length}
                                                            className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-[10px] font-bold transition-opacity cursor-pointer w-full sm:w-auto"
                                                        >
                                                            COPY TABLE
                                                        </button>
                                                        <button
                                                            onClick={() => handleCopyRayleighFrequencyList(selectedModalData.modes)}
                                                            disabled={!selectedModalData.modes?.length}
                                                            className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-[10px] font-bold transition-opacity cursor-pointer w-full sm:w-auto"
                                                        >
                                                            COPY FREQUENCY LIST
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5 font-mono text-xs pr-1 select-text" style={{ userSelect: 'text' }}>
                                                    {selectedModalData.modes.map((m, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="rounded bg-slate-950/60 border border-slate-800/80 text-slate-200 shadow-3xs hover:bg-slate-900/80 transition-colors p-3"
                                                        >
                                                            <div className="hidden md:flex items-center justify-between select-text">
                                                                <span className="text-slate-500 text-[11px] w-8 shrink-0">#{idx + 1}</span>
                                                                <div className="flex items-center justify-center gap-1.5 flex-1 text-center">
                                                                    <span className={`font-bold text-sm ${m.type === 'Axial' ? 'text-red-400' : 'text-slate-300'}`}>
                                                                        {m.freq} Hz
                                                                    </span>
                                                                    <span className="text-[10px] font-sans text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                                                                        ({m.type})
                                                                    </span>
                                                                </div>
                                                                <span className="text-slate-400 text-[11px] w-20 text-right font-mono shrink-0">
                                                                    {m.label || ''}
                                                                </span>
                                                                <div className="w-24 flex justify-end shrink-0 ml-2">
                                                                    {m.type === 'Axial' && m.clustering ? (
                                                                        <span className="text-[10px] text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/80 flex items-center gap-1 animate-pulse">
                                                                            ⚠️ Cluster
                                                                        </span>
                                                                    ) : (
                                                                        <div className="w-full"></div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="md:hidden space-y-2">
                                                                <div className="flex items-start justify-between">
                                                                    <span className="text-slate-500 text-xs">#{idx + 1}</span>
                                                                    <span className={`font-bold text-lg ${m.type === 'Axial' ? 'text-red-400' : 'text-slate-200'}`}>
                                                                        {m.freq} Hz
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                                                                        {m.type}
                                                                    </span>
                                                                    <span className="font-mono text-slate-400">{m.label || '-'}</span>
                                                                </div>

                                                                {m.type === 'Axial' && m.clustering && (
                                                                    <div className="text-[11px] text-rose-400 font-bold bg-rose-950/80 px-2 py-1 rounded border border-rose-800/80 inline-flex items-center gap-1">
                                                                        ⚠️ Cluster
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 p-4 text-center bg-slate-50/40">
                                            <MdAssessment size={32} className="text-slate-300 mb-2 animate-pulse" />
                                            <p className="text-xs font-medium">Select any row to visualize analytical Rayleigh modal distributions.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'controlled' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-sm animate-in zoom-in-95 duration-200">
                                <div className="p-3 md:p-2.5 bg-slate-50 border border-slate-100 rounded">
                                    <p className="text-xs md:text-[10px] text-indigo-500 uppercase font-sans tracking-wide">Width Rear</p>
                                    <p className="text-base md:text-sm font-semibold">{result.width.rear.toFixed(2)} m</p>
                                </div>
                                <div className="p-3 md:p-2.5 bg-slate-50 border border-slate-100 rounded">
                                    <p className="text-xs md:text-[10px] text-indigo-500 uppercase font-sans tracking-wide">Width Front</p>
                                    <p className="text-base md:text-sm font-semibold">{result.width.front.toFixed(2)} m</p>
                                </div>
                                <div className="p-3 md:p-2.5 bg-slate-50 border border-slate-100 rounded">
                                    <p className="text-xs md:text-[10px] text-indigo-500 uppercase font-sans tracking-wide">Length Edge 1</p>
                                    <p className="text-base md:text-sm font-semibold">{(result.lengthEdges?.splayed ?? splayedL).toFixed(2)} m</p>
                                </div>
                                <div className="p-3 md:p-2.5 bg-slate-50 border border-slate-100 rounded">
                                    <p className="text-xs md:text-[10px] text-indigo-500 uppercase font-sans tracking-wide">Length Edge 2</p>
                                    <p className="text-base md:text-sm font-semibold">{(result.lengthEdges?.straight ?? splayedL).toFixed(2)} m</p>
                                </div>
                                
                                <div className="p-3 md:p-2.5 bg-slate-50 border border-slate-100 rounded">
                                    <p className="text-xs md:text-[10px] text-indigo-500 uppercase font-sans tracking-wide">Angle</p>
                                    <p className="text-base md:text-sm font-semibold">{result.angle_deg}°</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ORTAK 3D FINITE DIFFERENCE / FEM SOLVER ALANI */}
                    <div className="pt-4 border-t border-slate-200">
                        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800">
                            <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                                    3D FEM Solver Response
                                </h3>
                                {!is3DLoading && last3DAnalysis?.fsi && (
                                    <div className="px-2.5 py-1 bg-cyan-950 border border-cyan-700/60 rounded text-xs font-mono text-cyan-300">
                                        3D FEM FSI: <span className="font-bold text-white">{last3DAnalysis.fsi}</span>
                                    </div>
                                )}
                            </div>

                            {/* DÜZENLENEN VE HİZALANAN BUTON ALANI */}
                            <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                                {strategyMode === 'controlled' && (
                                    is3DLoading ? (
                                        <button
                                            onClick={handleStop3D}
                                            className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
                                        >
                                            STOP
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleCalculate3D}
                                            className="px-3 py-2 rounded bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                                        >
                                            <MdPlayArrow size={14} /> 3D RUN
                                        </button>
                                    )
                                )}

                                <button
                                    onClick={handleCopy3DTable}
                                    disabled={!real3DModes.length}
                                    className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs font-bold transition-opacity cursor-pointer flex items-center justify-center"
                                >
                                    COPY TABLE
                                </button>

                                <button
                                    onClick={handleCopy3DFrequencyList}
                                    disabled={!real3DModes.length}
                                    className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs font-bold transition-opacity cursor-pointer flex items-center justify-center"
                                >
                                    COPY FREQUENCIES
                                </button>

                                <button
                                    onClick={handleSave3DResult}
                                    disabled={!real3DModes.length}
                                    className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                >
                                    <MdSave size={15} /> {saved3DRuns.length > 0 ? 'ADD' : 'SAVE'}
                                </button>
                            </div>

                            {!is3DLoading && last3DAnalysis && (
                                <div className="text-[10px] font-mono text-slate-400 text-right mt-2">
                                    Wf {last3DAnalysis.widthFront.toFixed(2)} m | Wr {last3DAnalysis.widthRear.toFixed(2)} m | Lf {last3DAnalysis.lengthEdgeFront.toFixed(2)} m | Lr {last3DAnalysis.lengthEdgeRear.toFixed(2)} m | H {last3DAnalysis.height.toFixed(2)} m | {last3DAnalysis.angle}° ({last3DAnalysis.modeName}) [{last3DAnalysis.splayType === 'single' ? 'Single-sided' : 'Double-sided'}]
                                </div>
                            )}

                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 text-sm min-h-[120px] mt-2">
                                <p className="text-[11px] uppercase text-slate-400 font-bold mb-2">Calculated 3D Eigenfrequencies</p>

                                {is3DLoading ? (
                                    <div className="flex items-center justify-center py-8 text-xs font-mono text-slate-400 gap-2">
                                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                                        Calculating 3D Grid...
                                    </div>
                                ) : (
                                    <div className="max-h-56 overflow-y-auto flex flex-col gap-2 font-mono text-xs pr-1 select-text" style={{ userSelect: 'text' }}>
                                        {real3DModes.length > 0 ? (
                                            real3DModes.map((freq, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-cyan-300 shadow-3xs select-text">
                                                    <span className="text-slate-500 w-10">#{idx + 1}</span>
                                                    <span className="font-bold flex-1 text-center">{freq} Hz</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-500 py-4 text-center">Run 3D on a configuration to evaluate wave solver modal response.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* KAYDEDİLEN 3D ANALİZLER DİKEY TABLOSU */}
                    {saved3DRuns.length > 0 && (
                        <div ref={savedTableRef} className="pt-6 border-t flex flex-col border-slate-200 animate-in slide-in-from-bottom duration-300 select-text">
                            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4'>
                                <h3 className="text-sm font-bold text-slate-700 tracking-wider flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    SAVED 3D GEOMETRY COMPARISON REPORT
                                </h3>

                                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                                    <button
                                        onClick={handleClearAllSaved}
                                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer"
                                        title="Clear all saved comparison reports"
                                    >
                                        <MdDelete size={16} />
                                        CLEAR ALL
                                    </button>

                                    <button
                                        onClick={() => exportSavedRunsToExcel(saved3DRuns)}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold tracking-wide shadow-3xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM18 20H6V4h7v5h5zm-1.8-7.3-2.7 2.7 2.7 2.7-1.4 1.4-2.7-2.7-2.7 2.7-1.4-1.4 2.7-2.7-2.7-2.7 1.4-1.4 2.7 2.7 2.7-2.7z" />
                                        </svg>
                                        EXPORT
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs bg-white">
                                <table className="w-full text-sm text-left table-fixed min-w-[850px]">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
                                        <tr>
                                            <th className="p-3 w-28">Angle (Mode)</th>
                                            <th className="p-3 w-36">Outer Rectangular Ratio</th>
                                            <th className="p-3 w-36">Average Splayed Ratio</th>
                                            <th className="p-3 w-52">Dimensions (Wf/Wr | Lf/Lr)</th>
                                            <th className="p-3 w-20">Height</th>
                                            <th className="p-3 w-24">3D FEM FSI</th>
                                            <th className="p-3 w-44">3D FEM Frequencies</th>
                                            <th className="p-3 text-center w-24">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {saved3DRuns.map((item) => (
                                            <SavedRow key={item.id} item={item} onDelete={handleDeleteSaved} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}