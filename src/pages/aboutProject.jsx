import {
    BookOpen,
    Settings2,
    Activity,
    AlertCircle,
    Maximize,
    FileText,
    LocateFixed
} from 'lucide-react';

export default function AboutProject() {
    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 lg:p-12 font-sans text-slate-800">
            <div className="max-w-5xl mx-auto bg-white border border-slate-300 shadow-sm">

                {/* DOCUMENT HEADER */}
                <header className="border-b-4 border-sky-600 bg-slate-50 p-8 md:p-12">
                    <div className="flex items-center gap-2 text-sky-700 font-mono text-xs uppercase tracking-widest mb-4 font-bold">
                        <FileText size={16} />
                        <span>Research Documentation &bull; ICSV32 Istanbul</span>
                    </div>
                    <p className="text-xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                        A Geometric Framework for Controlled Wall Splaying In ITU-Compliant Listening Room Design
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-1">Researchers</p>
                            <p className="font-semibold text-slate-800">Atakan Zerafet</p>
                            <p className="text-sm text-slate-600">Art & Design, Dokuz Eylul University</p>
                            <p className="font-semibold mt-1 text-slate-800">Suat Vergili, Feridun Öziş</p>
                            <p className="text-sm text-slate-600">Music Technology, Dokuz Eylul University</p>
                        </div>
                        <div>

                        </div>
                    </div>
                </header>

                <div className="p-8 md:p-12 space-y-16">

                    {/* 1. THE SCIENTIFIC GAP */}
                    <section>
                        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
                            <BookOpen className="text-sky-600" size={24} />
                            1. The Standardization Gap
                        </h2>
                        <div className="text-slate-700 leading-relaxed space-y-4 text-justify">
                            <p>
                                International acoustic standards, specifically ITU-R BS.1116-3, provide strict dimensional room ratios for critical listening environments and suggest the use of trapezoidal geometries. However, while the standard offers these ratios, it provides no mathematical formulas or established methodologies to implement them in non-parallel architectural footprints.
                            </p>
                            <p className="bg-sky-50 border-l-4 border-sky-500 p-4 text-slate-800 italic text-sm text-justify">
                                There is a distinct lack of quantitative design guidelines for trapezoidal models. This framework establishes a mathematical bridge, ensuring non-parallel wall geometries can be objectively evaluated against standardized rectangular criteria.
                            </p>
                        </div>
                    </section>

                    {/* 2. SPLAYING METHODOLOGIES */}
                    <section>
                        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-6">
                            <Settings2 className="text-sky-600" size={24} />
                            2. Splaying Methodologies
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="border border-slate-200 p-6 bg-slate-50">
                                <h3 className="font-mono font-bold text-sky-700 mb-3 text-sm uppercase tracking-wide">Inward Splaying</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mb-4 text-justify">
                                    Usable for existing rooms. This methodology applies angled acoustic boundaries <em>inside</em> an established room to remediate periodic reflections.
                                </p>
                                <ul className="text-xs text-slate-500 space-y-2">
                                    <li className="flex gap-2"><span className="text-sky-500">&bull;</span> Reduces effective volume dynamically.</li>
                                    <li className="flex gap-2"><span className="text-sky-500">&bull;</span> Utilizes reverse-engineering to keep the minimized geometry within the ITU compliant zone.</li>
                                </ul>
                            </div>

                            <div className="border border-slate-200 p-6 bg-slate-50">
                                <h3 className="font-mono font-bold text-sky-700 mb-3 text-sm uppercase tracking-wide">Controlled Splaying</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mb-4 text-justify">
                                    Implemented during the architectural stage. Geometry is generated outward based on target splay angles rather than shrinking an existing room.
                                </p>
                                <ul className="text-xs text-slate-500 space-y-2">
                                    <li className="flex gap-2"><span className="text-sky-500">&bull;</span> Dynamically adjusts height and width parameters.</li>
                                    <li className="flex gap-2"><span className="text-sky-500">&bull;</span> Locks the primary listener width boundary (4 m) to standardized values.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 3. THE ACOUSTIC ENGINE (CALCULATOR LOGIC) */}
                    <section>
                        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-6">
                            <Activity className="text-sky-600" size={24} />
                            3. Computational Acoustic Engine
                        </h2>
                        <p className="text-slate-700 mb-6 text-sm text-justify">
                            The project utilizes a custom React-based acoustic calculator. This engine continuously monitors physical inputs and processes modal responses in real-time, enforcing ITU-R limitations on asymmetric shapes.
                        </p>

                        <div className="grid md:grid-cols-3 gap-4">
                            {/* Feature 1 */}
                            <div className="bg-slate-900 text-slate-300 p-5 shadow-inner border-t-4 border-sky-500">
                                <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                                    <Activity size={16} className="text-sky-400" />
                                    Modal Density
                                </h3>
                                <p className="text-xs leading-relaxed opacity-90 text-justify">
                                    Scans all possible room ratios generated across each splaying angle. This enables a detailed observation of modal frequency distributions, allowing for the precise determination of the most optimal splay angle.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-slate-900 text-slate-300 p-5 shadow-inner border-t-4 border-amber-500">
                                <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                                    <AlertCircle size={16} className="text-amber-400" />
                                    Axial Cluster Detection
                                </h3>
                                <p className="text-xs leading-relaxed opacity-90 text-justify">
                                    The optimizer looks for the minimum number of clusters and, among those candidates, selects the setup where the first cluster formation occurs at the highest possible frequency region as the ideal splay angle."
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-slate-900 text-slate-300 p-5 shadow-inner border-t-4 border-purple-500">
                                <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                                    <Maximize size={16} className="text-purple-400" />
                                    Physical Constraints
                                </h3>
                                <p className="text-xs leading-relaxed opacity-90">
                                    Strictly enforces physical compliance limits. The engine restricts area outputs outside the <strong>20 – 60 m²</strong> range and triggers immediate visual warnings if the front speaker wall (Wfront) drops below the safe <strong>4.0m</strong> threshold.
                                </p>
                            </div>

                            <div className="bg-slate-900 text-slate-300 p-5 shadow-inner border-t-4 border-emerald-600">
                                <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                                    <LocateFixed size={16} className="text-emerald-400" />
                                    Recoverable Zone
                                </h3>
                                <p className="text-xs leading-relaxed opacity-90 text-justify">
                                    By applying precise angular splaying, the framework shifts some geometries, pulling them back into the ITU-standardized performance region and expanding the functional boundaries of traditional acoustic ratio charts.
                                </p>
                            </div>
                        </div>
                    </section>



                </div>

            </div>
        </div>
    );
}