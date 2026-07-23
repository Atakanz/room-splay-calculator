import { MdDelete } from 'react-icons/md';

export default function SavedRow({ item, onDelete }) {
    return (
        <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 font-mono text-xs">
            {/* Angle & Mode Name */}
            <td className="p-3 font-semibold text-slate-800">
                {item.angle}° <span className="text-[10px] text-slate-500 font-sans">({item.modeName})</span>
            </td>

            {/* Outer Ratio */}
            <td className="p-3 text-slate-600">{item.outerRatio}</td>

            {/* Average Ratio */}
            <td className="p-3 text-slate-600">{item.avgRatio}</td>

            {/* Dimensions */}
            <td className="p-3 text-slate-700">{item.dimensions}</td>

            {/* Height */}
            <td className="p-3 text-slate-700">{item.height} m</td>

            {/* YENİ: 3D FEM FSI DEĞERİ */}
            <td className="p-3 font-bold text-cyan-600 bg-cyan-50/30">
                {item.fsi ? item.fsi : 'N/A'}
            </td>

            {/* Frequencies Preview */}
            <td className="p-3 text-slate-500 truncate max-w-[200px]" title={item.frequencies?.join(', ')}>
                {item.frequencies?.slice(0, 5).join(', ')}... ({item.frequencies?.length} modes)
            </td>

            {/* Action Delete */}
            <td className="p-3 text-center">
                <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                    title="Delete record"
                >
                    <MdDelete size={16} />
                </button>
            </td>
        </tr>
    );
}