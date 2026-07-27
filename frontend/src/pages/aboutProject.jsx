import {
    BookOpen,
    Layers,
    Cpu,
    FileText,
} from 'lucide-react';

export default function AboutProject() {
    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 lg:p-12 font-sans text-slate-800">
            <div className="max-w-4xl mx-auto bg-white border border-slate-300 shadow-sm rounded-sm">

                {/* DOCUMENT HEADER */}
                <header className="border-b-4 border-sky-600 bg-slate-50 p-6 md:p-10">
                    <div className="flex items-center gap-2 text-sky-700 font-mono text-xs uppercase tracking-widest mb-3 font-bold">
                        <FileText size={16} />
                        <span>ICSV32 Istanbul - International Congress on Sound and Vibration</span>
                    </div>

                    {/* NEW TITLE */}
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 leading-tight">
                        Computational Framework for Symmetric Double-Sided Wall Splaying in ITU-Compliant Listening Rooms
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-sm">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1">Researchers</p>
                            <p className="font-semibold text-slate-800">Atakan Zerafet</p>
                            <p className="text-xs text-slate-600">Art & Design, Dokuz Eylul University</p>
                            <p className="font-semibold mt-2 text-slate-800">Suat Vergili, Feridun Öziş</p>
                            <p className="text-xs text-slate-600">Music Technology, Dokuz Eylul University</p>
                        </div>
                    </div>
                </header>

                <div className="p-6 md:p-10 space-y-10">

                    {/* 1. RESEARCH MOTIVATION */}
                    <section>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">
                            <BookOpen className="text-sky-600" size={20} />
                            1. Research Motivation
                        </h2>
                        <div className="text-slate-700 text-sm leading-relaxed space-y-3">
                            <p>
                                ITU-R BS.1116 define dimensional recommendations for critical listening rooms and encourage the use of non-parallel walls. However, a computational framework for systematically transforming standardized rectangular room ratios into symmetric double-sided splayed geometries has not been established.
                            </p>
                            <p className="bg-sky-50 border-l-4 border-sky-600 p-3 text-slate-800 text-xs font-medium leading-normal">
                                This project presents a computational framework for generating symmetric double-sided splayed listening-room geometries while preserving the dimensional constraints defined by ITU-R BS.1116.
                            </p>
                        </div>
                    </section>

                    {/* 2. CURRENT SCOPE */}
                    <section>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 border-b border-slate-200 pb-3 mb-3">
                            <Layers className="text-sky-600" size={20} />
                            2. Current Scope
                        </h2>
                        <div className="bg-sky-900 text-white p-5 rounded-md shadow-inner">
                            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-sky-300 mb-3">
                                Current Implementation
                            </h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-medium">
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0"></span>
                                    Symmetric double-sided wall splaying
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0"></span>
                                    ITU geometric transformation
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0"></span>
                                    Rayleigh modal-frequency calculations
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0"></span>
                                    Python-based finite element modelling
                                </li>
                                <li className="flex items-center gap-2 md:col-span-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0"></span>
                                    Modal analysis using scikit-fem
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* 3. IMPLEMENTED METHODS */}
                    <section>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
                            <Cpu className="text-sky-600" size={20} />
                            3. Implemented Methods
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4 text-xs">
                            <div className="border border-slate-200 p-4 bg-slate-50/50 rounded">
                                <h3 className="font-bold text-slate-800 mb-1.5 text-sm">Geometric Transformation</h3>
                                Generates symmetric double-sided splayed listening-room geometries while preserving the dimensional constraints defined by ITU-R BS.1116.
                            </div>

                            <div className="border border-slate-200 p-4 bg-slate-50/50 rounded">
                                <h3 className="font-bold text-slate-800 mb-1.5 text-sm">Analytical Modal Analysis</h3>
                                Computes room eigenfrequencies using the Rayleigh approximation, enabling rapid comparison between candidate listening-room geometries.
                            </div>

                            <div className="border border-slate-200 p-4 bg-slate-50/50 rounded">
                                <h3 className="font-bold text-slate-800 mb-1.5 text-sm">Python-based Finite Element Analysis</h3>
                                Automatically generates finite element models using Python and performs modal analyses with the scikit-fem library for comparison with the analytical predictions.
                            </div>

                            <div className="border border-slate-200 p-4 bg-slate-50/50 rounded">
                                <h3 className="font-bold text-slate-800 mb-1.5 text-sm">ITU Compliance Assessment</h3>
                                Evaluates whether the generated room geometries satisfy the dimensional limits adopted by ITU-R BS.1116 after applying symmetric double-sided wall splaying.
                            </div>
                        </div>
                    </section>



                </div>
            </div>
        </div>
    );
}