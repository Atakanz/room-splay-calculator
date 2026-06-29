import {
    Cpu,
    Layers,
    Gauge,
    Sliders,
    Activity,
    Compass,
    Ruler,
    Maximize2
} from 'lucide-react';
import FilteredModalTable from '../components/FilteredModalChart';
import Room1 from '../data/room1.json';

export default function AnsysResult() {
    // Core room geometry parameters given by the controlled framework
    const roomSpecs = [
        { label: "Target Room Ratios", value: "1 : 2.12 : 2.59", icon: <Ruler size={18} className="text-sky-600" />, category: "Geometry" },
        { label: "Ceiling Height (H)", value: "3.32 m", icon: <Maximize2 size={18} className="text-sky-600" />, category: "Geometry" },
        { label: "Splay Angle (α)", value: "4° (Controlled)", icon: <Compass size={18} className="text-sky-600" />, category: "Framework" },
    ];

    // ANSYS FEA simulation boundaries
    const simulationParams = [
        { label: "Analysis Module", value: "Modal Acoustics", icon: <Cpu size={18} className="text-sky-600" />, category: "FEA Setup" },
        { label: "Fluid Medium", value: "Air (ρ = 1.21 kg/m³)", icon: <Gauge size={18} className="text-sky-600" />, category: "Material" },
        { label: "Speed of Sound (c)", value: "343 m/s", icon: <Activity size={18} className="text-sky-600" />, category: "Material" },
        { label: "Mesh Element Size", value: "0.2 m (Body Sizing)", icon: <Layers size={18} className="text-sky-600" />, category: "Mesh Grid" },
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
                        "Acoustic Simulation Data & Room Analysis"                    </h1>
                    <p className="text-sm text-slate-600 max-w-4xl leading-relaxed text-justify">
                        "This section presents the test results of our trapezoidal listening room model. We compared the room shape created by our Controlled Wall Splaying framework with 3D Finite Element Analysis (FEA) results from ANSYS Workbench to check its accuracy."                    </p>
                </header>

                <div className="p-8 md:p-12 space-y-12">



                    {/* 2. SIMULATION PARAMETERS */}
                    <section>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-6">
                            <Sliders className="text-sky-600" size={20} />
                            ANSYS Mesh & Splay Boundary Conditions
                        </h2>


                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {simulationParams.map((param, index) => (
                                <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded shadow-sm flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-2">
                                        {param.icon}
                                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">{param.label}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 font-mono pl-6">
                                        {param.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Technical Note Block */}
                        <div className="mt-6 bg-sky-50 border-l-4 border-sky-500 p-4 text-slate-800 italic text-xs leading-relaxed text-justify">
                            "Mesh Grid and Frequency Settings: To get accurate results at high frequencies, we used a mesh size of 0.2 m. This means we have 6 mesh elements for each sound wave at the highest frequency limit. This setup follows the standard rules (minimum 5 elements) and gives very accurate calculations up to 285 Hz."                        </div>
                    </section>
                    {/* 1. ROOM GEOMETRY & FRAMEWORK SPECIFICATIONS */}
                    <section>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-2">
                            <Ruler className="text-sky-600" size={20} />
                            Target Room Geometric Profiles
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {roomSpecs.map((spec, index) => (
                                <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded shadow-sm flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-1">
                                        {spec.icon}
                                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">{spec.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 font-mono pl-2">
                                        {spec.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                    {/* 3. ORIGINAL DATA COMPLIANCE TABLE CONTAINER */}
                    <section>
                        {/* 📊 Original Dark Component Injection */}
                        <div className="w-full">
                            <FilteredModalTable rawData={Room1} />
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}