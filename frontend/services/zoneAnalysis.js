// 📐 Makaledeki Doğrusal Sınır Fonksiyonları
export const ITU_FUNCTIONS = {
    getLeftLine: (Sw) => 4.5 * Sw - 4,
    getMiddleLine: (Sw) => 1.1 * Sw,
    getBottomLine: (Sw) => Sw,
};

// 📊 Grafik Boyama Datası Üretici
export const generateChartData = () => {
    const chartData = [];

    // KURAL GEREĞİ: 3.0 kesinlikle dahil edilemez, bu yüzden döngü 2.99'da biter (< 3)
    for (let Sw = 1.0; Sw < 3.0; Sw += 0.01) {
        const curSw = parseFloat(Sw.toFixed(2));

        // Üst limit kilitleri de 3.0 yerine 2.99'a çekildi
        const leftSL = Math.min(2.99, ITU_FUNCTIONS.getLeftLine(curSw));
        const midSL = Math.min(2.99, ITU_FUNCTIONS.getMiddleLine(curSw));
        const bottomSL = ITU_FUNCTIONS.getBottomLine(curSw);

        // --- MATEMATİKSEL ARALIK KONTROLÜ ---
        let greenBottom = midSL;
        let greenTop = leftSL;

        // Hem sol dar ucu (1.18 - 1.31) kapsayan hem de sağ limit çizgilerini koruyan aralık
        let hasGreen = curSw >= 1.18 && curSw <= 2.71 && greenBottom <= greenTop;

        // Sarı bölge tavanı da kesinlikle 3'ten küçük (2.99) olmalıdır
        let yellowBottom = Math.max(1.32, bottomSL);
        let yellowTop = curSw <= 2.73 ? midSL : 2.99;
        let hasYellow = curSw >= 1.2 && yellowBottom <= yellowTop;

        chartData.push({
            Sw: curSw,
            greenRange: hasGreen ? [parseFloat(greenBottom.toFixed(2)), parseFloat(greenTop.toFixed(2))] : null,
            yellowRange: hasYellow ? [parseFloat(yellowBottom.toFixed(2)), parseFloat(yellowTop.toFixed(2))] : null
        });
    }
    return chartData;
};

// 🎲 Sınırlarda (< 3) Değer Üreten Rastgele Oran Yakalayıcı
export const getProceduralRandomRatio = (targetZone) => {
    const dataPool = generateChartData();
    const validCandidates = [];

    dataPool.forEach(item => {
        if (targetZone === 'green' && item.greenRange) {
            const gMin = Math.min(item.greenRange[0], item.greenRange[1]);
            const gMax = Math.max(item.greenRange[0], item.greenRange[1]);

            if (gMin <= gMax) {
                validCandidates.push({ Sw: item.Sw, minSL: gMin, maxSL: gMax });
            }
        } else if (targetZone === 'yellow' && item.yellowRange) {
            let minSL = Math.min(item.yellowRange[0], item.yellowRange[1]);
            let maxSL = Math.max(item.yellowRange[0], item.yellowRange[1]);

            if (item.greenRange) {
                const gMin = Math.min(item.greenRange[0], item.greenRange[1]);
                if (maxSL > gMin) {
                    maxSL = gMin;
                }
            }

            if (minSL <= maxSL) {
                validCandidates.push({ Sw: item.Sw, minSL, maxSL });
            }
        }

    });

    if (validCandidates.length > 0) {
        const candidate = validCandidates[Math.floor(Math.random() * validCandidates.length)];

        const finalSL = candidate.minSL === candidate.maxSL
            ? candidate.minSL
            : parseFloat((Math.random() * (candidate.maxSL - candidate.minSL) + candidate.minSL).toFixed(2));

        return {

            wRatio: Number(candidate.Sw.toFixed(2)),

            lRatio: Number(finalSL.toFixed(2))

        };
    }

    return targetZone === 'green' ? { wRatio: 1.6, lRatio: 2.2 } : { wRatio: 2.1, lRatio: 1.4 };
};
