import {
    Cpu,
    Layers,
    Sliders,
    Activity,
    Compass,
    Ruler,
    Maximize2,
    CheckCircle2
} from 'lucide-react';
import FilteredModalTable from '../components/FilteredModalChart';
import Room1 from '../data/room1.json';
import SquareRoom from '../data/squareRoom.json';
import SquareRoom7 from '../data/square7.json';

export default function AnsysResult() {
    // SECTION 1: Controlled Wall Splaying Parameters
    const controlledGeometry = [
        { label: "Target Room Ratios", value: "1 : 2.12 : 2.59", icon: <Ruler size={18} className="text-sky-600" /> },
        { label: "Ceiling Height (H)", value: "3.32 m", icon: <Maximize2 size={18} className="text-sky-600" /> },
        { label: "Splay Angle (α)", value: "4° (Controlled)", icon: <Compass size={18} className="text-sky-600" /> },
    ];

    const controlledMeshParams = [
        { label: "Analysis Module", value: "Modal Acoustics", icon: <Cpu size={18} className="text-sky-600" /> },
        { label: "Mesh Element Size", value: "0.2 m (Body Sizing)", icon: <Layers size={18} className="text-sky-600" /> },
        { label: "Advanced Mesh Control", value: "0.1 m Proximity/Curvature", icon: <Sliders size={18} className="text-amber-600" /> },
        { label: "Speed of Sound (c)", value: "343 m/s", icon: <Activity size={18} className="text-sky-600" /> },
    ];

    // SECTION 2: Inwardly Splaying Parameters (Square Room Base)
    const squareInitialGeometry = [
        { label: "Initial Room Ratios", value: "1 : 2 : 2 (Square)", icon: <Ruler size={18} className="text-indigo-600" /> },
        { label: "Ceiling Height (H)", value: "3.00 m", icon: <Maximize2 size={18} className="text-indigo-600" /> },
    ];

    const squareFinalSplayedGeometry = [
        { label: "Optimized Ratio", value: "1 : 1.75 : 2.02", icon: <Ruler size={18} className="text-emerald-600" /> },
        { label: "Splay Angle (α)", value: "7° (Inward splayed)", icon: <Compass size={18} className="text-emerald-600" /> },
        { label: "Target Zone", value: "Recoverable Region", icon: <CheckCircle2 size={18} className="text-emerald-600" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 lg:p-12 font-sans text-slate-800">
            <div className="max-w-5xl mx-auto bg-white border border-slate-300 shadow-sm">

                {/* DOCUMENT HEADER */}
                <header className="border-b-4 border-sky-600 bg-slate-50 p-8 md:p-12">
                    <div className="flex items-center gap-2 text-sky-700 font-mono text-xs uppercase tracking-widest mb-4 font-bold">
                        <Cpu size={16} />
                        <span>Finite Element Method (FEM) Verification</span>
                    </div>
                    <h1 className="text-xl md:text-3xl font-bold text-slate-900 mb-4 leading-tight">
                        Acoustic Simulation Data & Room Analysis
                    </h1>
                    <p className="text-sm text-slate-600 max-w-4xl leading-relaxed text-justify">
                        This section presents the verification of our listening room models. We check the accuracy of our geometric framework by comparing theoretical calculations with 3D Finite Element Analysis (FEA) results from ANSYS Workbench.
                    </p>
                </header>

                <div className="p-8 md:p-12 space-y-16">

                    {/* ==================== FRAMEWORK 1 ==================== */}
                    <section className="border-l-4 border-sky-500 pl-4 md:pl-6 space-y-6">
                        <div className="bg-sky-900 text-white px-4 py-2 text-xs font-mono inline-block uppercase tracking-wider font-bold rounded-sm">
                            Approach 01: Controlled Wall Splaying
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">
                                Controlled Trapezoidal Room Geometry
                            </h2>
                            <p className="text-xs text-slate-600 text-justify leading-relaxed">
                                In this approach, we start with ideal acoustic room ratios and splay the side walls by 4 degrees. Because the trapezoidal shape is complex, we used advanced mesh settings in ANSYS to maintain high calculation accuracy near the angled walls.
                            </p>
                        </div>

                        {/* Geometry Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {controlledGeometry.map((spec, index) => (
                                <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded shadow-sm flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-1">
                                        {spec.icon}
                                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">{spec.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 font-mono pl-2">{spec.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Mesh Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {controlledMeshParams.map((param, index) => (
                                <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded shadow-sm flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-2">
                                        {param.icon}
                                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">{param.label}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 font-mono pl-2">{param.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Technical Note */}
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-slate-800 italic text-xs leading-relaxed text-justify">
                            <strong>Mesh & Discretization Error Note:</strong> In non-rectangular rooms, standard mesh grids lose their perfect square shapes at the corners. To capture the wall angles perfectly, a <strong>0.1 m Capture Proximity & Curvature</strong> setting was applied. Due to this geometric complexity, the calculation error shows small variations compared to simple rectangular rooms.
                        </div>

                        {/* Table 1 */}
                        <div className="pt-2">
                            <FilteredModalTable rawData={Room1} />
                        </div>
                    </section>


                    {/* ==================== FRAMEWORK 2 ==================== */}
                    <section className="border-l-4 border-indigo-500 pl-4 md:pl-6 space-y-6 pt-4">
                        <div className="bg-indigo-900 text-white px-4 py-2 text-xs font-mono inline-block uppercase tracking-wider font-bold rounded-sm">
                            Approach 02: Inwardly Splaying Framework
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">
                                Optimization & Splaying of Square Room Geometry
                            </h2>
                            <p className="text-xs text-slate-600 text-justify leading-relaxed">
                                This approach starts with a poor acoustic profile: a perfect square room ratio ($1:2:2$). First, we analyze the basic rectangular structure where the simulation matches theoretical data perfectly. Then, we apply a 7-degree inward wall splay to push the room dimensions into a much better acoustic region (Recoverable Zone).
                            </p>
                        </div>

                        {/* Step A: Initial Cubic/Square Profile */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                                <span>Stage A: Initial Square Room Data (Rectangular Grid)</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {squareInitialGeometry.map((spec, index) => (
                                    <div key={index} className="p-4 bg-indigo-50/40 border border-indigo-100 rounded shadow-sm flex flex-col justify-between">
                                        <div className="flex items-center gap-2 mb-1">
                                            {spec.icon}
                                            <span className="text-[10px] font-mono font-bold text-indigo-600/80 uppercase tracking-wide">{spec.label}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 font-mono pl-2">{spec.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 text-slate-800 italic text-[11px] leading-relaxed">
                                💡 <strong>Low Error Rate Explanation:</strong> As shown in the table below, the simulation grid aligns perfectly with the straight, parallel walls. Because there are no complex angles yet, the discretization error is extremely low ($\sim0.0002\%$).
                            </div>

                            <div className="pt-1">
                                <FilteredModalTable rawData={SquareRoom} />
                            </div>
                        </div>

                        {/* Step B: 7-Degree Splayed Profile */}
                        <div className="space-y-3 pt-4">
                            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                                <span>Stage B: Final 7° Splayed Geometry (Recoverable Zone)</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {squareFinalSplayedGeometry.map((spec, index) => (
                                    <div key={index} className="p-4 bg-emerald-50/40 border border-emerald-100 rounded shadow-sm flex flex-col justify-between">
                                        <div className="flex items-center gap-2 mb-1">
                                            {spec.icon}
                                            <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wide">{spec.label}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 font-mono pl-2">{spec.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-1">
                                <FilteredModalTable rawData={SquareRoom7} />
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}