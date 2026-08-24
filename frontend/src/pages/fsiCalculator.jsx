import { useState } from 'react';
import { calculateFSI } from '../../services/fsiCalculator';

export default function FSICalculatorPage() {
    const [inputText, setInputText] = useState('');
    const [modeLimit, setModeLimit] = useState(25);
    const [fsiResult, setFsiResult] = useState(null);
    const [validFrequencies, setValidFrequencies] = useState([]);
    const [usedFrequencies, setUsedFrequencies] = useState([]);

    const parseFrequencies = (text) => {
        // Split by newlines, spaces, tabs, commas, or semicolons
        const tokens = text.split(/[\n\s,;]+/);
        const nums = tokens
            .map(t => t.trim())
            .filter(t => t !== '')
            .map(Number)
            .filter(n => !isNaN(n));
        return nums;
    };

    const handleCalculate = () => {
        const freqs = parseFrequencies(inputText);
        setValidFrequencies(freqs);
        const limit = Math.max(1, Math.floor(modeLimit));
        setUsedFrequencies(freqs.slice().sort((a,b) => a - b).slice(0, limit));
        const fsi = calculateFSI(freqs, limit);
        setFsiResult(fsi);
    };

    const handleClear = () => {
        setInputText('');
        setFsiResult(null);
        setValidFrequencies([]);
        setUsedFrequencies([]);
        setModeLimit(25);
    };

    const displayedFsi = (validFrequencies.length < 3 || fsiResult === null) ? 'N/A' : fsiResult.toFixed(2);
    const usedCount = Math.min(validFrequencies.length, Math.max(0, Math.floor(modeLimit)));

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-slate-50 rounded-lg shadow p-4 mb-6">
                <label htmlFor="freqInput" className="block font-medium mb-2 text-slate-700">
                    Enter Frequencies
                </label>
                <textarea
                    id="freqInput"
                    className="w-full h-40 p-3 border border-slate-300 rounded-md resize-none text-sm font-mono"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                />

                <div className="flex flex-wrap items-center gap-3 mt-4">
                    <label className="flex items-center gap-2 text-slate-700 font-medium">
                        <span>Mode Limit</span>
                        <input
                            type="number"
                            min="1"
                            className="w-20 p-2 rounded border border-slate-300 text-center text-sm"
                            value={modeLimit}
                            onChange={e => setModeLimit(e.target.value)}
                        />
                    </label>

                    <button
                        onClick={handleCalculate}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded shadow-sm transition"
                    >
                        CALCULATE FSI
                    </button>

                    <button
                        onClick={handleClear}
                        className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold py-2 px-4 rounded shadow-sm transition"
                    >
                        CLEAR
                    </button>
                </div>
            </div>

            {fsiResult !== null && (
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-xl font-extrabold text-indigo-700 mb-4">
                        FSI: {displayedFsi}
                    </div>

                    {usedFrequencies.length > 0 && (
                        <div>
                            <div className="font-semibold text-slate-600 mb-2">
                                Frequencies  ({usedCount})
                            </div>
                            <ul className="flex flex-wrap gap-2 text-xs font-mono text-slate-700">
                                {usedFrequencies.map((freq, idx) => (
                                    <li
                                        key={idx}
                                        className="bg-indigo-100 rounded px-2 py-1"
                                    >
                                        {freq.toFixed(2)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
