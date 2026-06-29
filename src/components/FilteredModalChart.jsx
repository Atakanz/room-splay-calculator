import { useState, useMemo } from 'react';

export default function FilteredModalTable({ rawData }) {
    // Filtreleme State'i varsayılan olarak tümünü gösterir (1-50)
    const [rangeFilter, setRangeFilter] = useState('all');

    // Filtrelenmiş veri hesaplaması
    const filteredData = useMemo(() => {
        if (!rawData) return [];
        if (rangeFilter === 'all') return rawData;
        const [min, max] = rangeFilter.split('-').map(Number);
        return rawData.filter(item => item.mod >= min && item.mod <= max);
    }, [rangeFilter, rawData]);

    return (
        <div className="w-full mt-12 max-w-6xl mx-auto p-6 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800/80">

            {/* Üst Alan: Başlık ve Dropdown */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
                <div>
                    <h3 className="text-lg font-bold text-sky-500 tracking-wide">FEM VERIFICATION RESULTS</h3>
                </div>

                {/* Dropdown Tasarımı */}
                <div className="flex items-center gap-3 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-700/60">
                    <label htmlFor="table-mod-select" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        MODE RANGE
                    </label>
                    <select
                        id="table-mod-select"
                        value={rangeFilter}
                        onChange={(e) => setRangeFilter(e.target.value)}
                        className="bg-slate-800 text-slate-200 text-xs font-bold rounded-lg border border-slate-600 px-3 py-1.5 pr-8 cursor-pointer outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    >
                        <option value="all">All Modes (1 - 50)</option>
                        <option value="1-25">Mode 1 - 25</option>
                        <option value="26-50">Mode 26 - 50</option>
                    </select>
                </div>
            </div>

            {/* Excel Tarzı Dengelenmiş Tablo Alanı */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[550px] scrollbar-thin scrollbar-thumb-slate-800">
                <table className="w-full border-collapse text-xs tracking-wide table-fixed">

                    {/* Tablo Başlığı - Genişlikler Excel oranlarına göre sabitlendi */}
                    <thead className="bg-slate-800/90 text-slate-400 uppercase sticky top-0 z-10 border-b border-slate-700">
                        <tr>
                            <th className="w-[12%] py-3.5 px-4 font-bold text-center border-r border-slate-700/50">MODE</th>
                            <th className="w-[28%] py-3.5 px-6 font-bold text-center border-r border-slate-700/50">FEM ANALYSIS</th>
                            <th className="w-[28%] py-3.5 px-6 font-bold text-center border-r border-slate-700/50">NUMERIC ANALYSIS</th>
                            <th className="w-[32%] py-3.5 px-6 font-bold text-center">DISCRETIZATION ERROR %</th>
                        </tr>
                    </thead>

                    {/* Tablo Gövdesi - Hücre içi hizalamalar kusursuzlaştırıldı */}
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/20 font-mono text-slate-300">
                        {filteredData.map((row) => (
                            <tr
                                key={row.mod}
                                className="hover:bg-slate-800/40 transition-colors duration-100"
                            >
                                {/* MOD Sütunu: Tam Ortalanmış */}
                                <td className="py-3 px-4 bg-slate-800/10 font-bold text-slate-400 text-center border-r border-slate-800">
                                    {row.mod}
                                </td>

                                {/* ANSYS Sütunu: Başlıkla aynı hizada sola yaslı */}
                                <td className="py-3 px-6 text-slate-300 border-r border-slate-800/50 text-center align-middle">
                                    {row.ansys.toFixed(3)}
                                </td>

                                {/* NUMERIC Sütunu: Başlıkla aynı hizada sola yaslı */}
                                <td className="py-3 px-6 font-semibold text-slate-200 border-r border-slate-800/50 text-center align-middle">
                                    {row.numeric.toFixed(2)}
                                </td>

                                {/* ERROR Sütunu: Başlıkla aynı hizada sağa kilitli */}
                                <td className="py-3 px-6 text-center align-middle">
                                    <div className="flex items-center justify-center gap-2.5 w-full">
                                        <span className="text-rose-400/90 font-semibold">
                                            %{row.error.toFixed(5)}
                                        </span>
                                        <span className="inline-flex items-center justify-center text-[10px] font-sans font-bold bg-slate-800 text-slate-400 border border-slate-700 w-5 h-5 rounded shadow-sm shrink-0 uppercase">
                                            {row.type}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}