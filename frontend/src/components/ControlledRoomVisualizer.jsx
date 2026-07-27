import { useEffect, useState, useRef } from "react";

export default function ControlledRoomVisualizer({ result }) {
    // 1. HOOK'LAR HER ZAMAN EN ÜSTTE OLMALI (Koşulsuz, engelsiz)
    const [currentAngle, setCurrentAngle] = useState(0);
    const animationRef = useRef(null);
    const startTimeRef = useRef(null);

    // Güvenli float dönüşümleri (result yoksa patlamasın diye korumalı)
    const wFront = parseFloat(result?.width?.front) || 0;
    const wRear = parseFloat(result?.width?.rear) || 0;
    const lengthBase = parseFloat(result?.length) || 0;
    const angleDegMax = parseFloat(result?.angle_deg) || parseFloat(result?.angle) || 0;

    useEffect(() => {
        if (!result) return; // Hook içerisindeki güvenli kontrol

        const duration = 7000;
        const animate = (timestamp) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsed = timestamp - startTimeRef.current;
            const progress = (Math.sin((elapsed / duration) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
            const animateAngle = progress * angleDegMax;
            setCurrentAngle(animateAngle);

            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [angleDegMax, result]);

    // 2. ERKEN DÖNÜŞ (EARLY RETURN) ŞİMDİ GÜVENLE BURAYA GELEBİLİR
    if (!result) return null;

    // --- Geometri ve SVG Hesaplamaları (Geri kalan her şey aynı) ---
    const svgSize = 500;
    const svgWidth = svgSize;
    const svgHeight = svgSize;
    const padding = 60;
    const maxRealDim = Math.max(wRear, lengthBase);
    const scale = (Math.min(svgWidth, svgHeight) - padding * 2) / maxRealDim;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const halfRear = (wRear * scale) / 2;
    const halfLen = (lengthBase * scale) / 2;

    const rLeftTop = { x: centerX - halfRear, y: centerY - halfLen };
    const rRightTop = { x: centerX + halfRear, y: centerY - halfLen };
    const rLeftBot = { x: centerX - halfRear, y: centerY + halfLen };
    const rRightBot = { x: centerX + halfRear, y: centerY + halfLen };

    const currentAngleRad = (currentAngle * Math.PI) / 180;
    const dynamicWFront = wRear - (wRear - wFront) * (currentAngle / (angleDegMax || 1));
    const inwardOffset = lengthBase * Math.tan(currentAngleRad) * scale;
    const targetScaleX = (rRightBot.x - inwardOffset - (rLeftBot.x + inwardOffset)) / (rRightBot.x - rLeftBot.x);

    return (
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center">
            {/* SVG ve alt kartlar buraya gelecek (Önceki JSX yapınızın aynısı) */}
            <div className="relative w-full max-w-[420px] aspect-square bg-slate-900/30 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
                <svg
                    width="82%"
                    height="82%"
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="font-mono text-[11px] fill-slate-400"
                >
                    <defs>
                        <pattern id="visualizer-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(51, 65, 85, 0.2)" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#visualizer-grid)" />

                    <polygon
                        points={`${rLeftTop.x},${rLeftTop.y} ${rRightTop.x},${rRightTop.y} ${rRightBot.x},${rRightBot.y} ${rLeftBot.x},${rLeftBot.y}`}
                        fill="none" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1.5"
                    />

                    <line x1={rLeftTop.x} y1={rLeftTop.y} x2={rRightTop.x} y2={rRightTop.y} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

                    <g transform={`rotate(${-currentAngle}, ${rLeftTop.x}, ${rLeftTop.y})`}>
                        <line x1={rLeftTop.x} y1={rLeftTop.y} x2={rLeftBot.x} y2={rLeftBot.y} stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                    </g>
                    <g transform={`rotate(${currentAngle}, ${rRightTop.x}, ${rRightTop.y})`}>
                        <line x1={rRightTop.x} y1={rRightTop.y} x2={rRightBot.x} y2={rRightBot.y} stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                    </g>
                    <g transform={`translate(${centerX}, ${rLeftBot.y}) scale(${targetScaleX}, 1) translate(${-centerX}, ${-rLeftBot.y})`}>
                        <line x1={rLeftBot.x} y1={rLeftBot.y} x2={rRightBot.x} y2={rRightBot.y} stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                        <circle cx={rLeftBot.x} cy={rLeftBot.y} r="4.5" className="fill-sky-400 stroke-slate-950 stroke-2" />
                        <circle cx={rRightBot.x} cy={rRightBot.y} r="4.5" className="fill-sky-400 stroke-slate-950 stroke-2" />
                    </g>

                    <text x={centerX} y={rLeftTop.y - 15} textAnchor="middle" className="fill-slate-400 font-bold text-[18px]">
                        Width Rear: {wRear.toFixed(2)} m
                    </text>
                    <text
                        x={rLeftTop.x - 20} y={centerY} textAnchor="middle"
                        transform={`rotate(-90 ${rLeftTop.x - 20} ${centerY})`}
                        className="fill-slate-400 text-[18px] font-bold"
                    >
                        Length: {(lengthBase / Math.cos(currentAngleRad)).toFixed(2)} m
                    </text>
                    <text x={centerX} y={rLeftBot.y + 25} textAnchor="middle" className="fill-slate-400 font-bold text-[18px]">
                        Width Front: {dynamicWFront.toFixed(2)} m
                    </text>
                    <text x={rLeftTop.x + 20} y={rLeftTop.y + 35} textAnchor="start" className="fill-sky-400 text-[14px] font-bold">
                        {currentAngle.toFixed(1)}°
                    </text>
                </svg>
            </div>
        </div>
    );
}