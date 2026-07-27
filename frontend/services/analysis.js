export function checkRatio(w_ratio, l_ratio) {

    const EPS = 0.0001;

    const isGreenRegion =

        w_ratio >= 1.18 - EPS &&

        w_ratio <= 2.71 + EPS &&

        l_ratio >= (1.1 * w_ratio) - EPS &&

        l_ratio <= (4.5 * w_ratio - 4) + EPS;

    const isLessThan3 =

        w_ratio < 3 - EPS &&

        l_ratio < 3 - EPS;

    return isGreenRegion && isLessThan3;

}

/**
 * Inwardly Splaying: Existing Room Modu Hesaplaması
 */
export function splayTheRoom(w, l, h, angle_deg) {
    const angle_rad = (angle_deg * Math.PI) / 180;

    const new_length = l / Math.cos(angle_rad);
    const new_width_short = w - (2 * l * Math.tan(angle_rad));
    const new_width_long = w;

    const is_under_4m = new_width_short < 4;

    const avg_w = (new_width_short + new_width_long) / 2;
    const w_ratio = avg_w / h;
    const l_ratio = new_length / h;

    const is_ok = checkRatio(w_ratio, l_ratio);

    if (is_ok) {
        return {
            status: true,
            is_under_4m,
            message: `1:${w_ratio.toFixed(2)}:${l_ratio.toFixed(2)}`,
            avgWidth: avg_w,
            avgLength: new_length,
            w_ratio,
            l_ratio
        };
    } else {
        return { status: false, is_under_4m, message: "RATIO_ERROR" };
    }
}

export function calculateTheOptimumRatio(w, l, h) {
    const results = [];
    for (let angle = 0; angle < 15; angle++) {
        const { status, is_under_4m, message, avgWidth, avgLength, w_ratio, l_ratio } = splayTheRoom(w, l, h, angle);
        if (status) {
            results.push({ angle, message, warning: is_under_4m, avgWidth, avgLength, w_ratio, l_ratio });
        }
    }
    return results;
}

/**
 * Controlled Splaying (Design Phase Formülleri)
 */
export function calculateDesignPhaseMetrics(wRatio, lRatio, angle_deg) {
    const angle_rad = (angle_deg * Math.PI) / 180;

    const sPrimeW = wRatio + (lRatio * Math.tan(angle_rad));
    const sPrimeL = lRatio * Math.cos(angle_rad);

    const denominator = sPrimeW - (2 * sPrimeL * Math.tan(angle_rad));
    const hMinFormula = denominator > 0 ? (4 / denominator) : 2.5;
    const hMin = parseFloat(Math.max(2.5, hMinFormula));

    return { sPrimeW, sPrimeL, hMin };
}

/**
 * Belirli bir tavan yüksekliği (h) kullanarak fiziksel stüdyo boyutlarını türetir
 */
export function splayTheRoomWithTheSameRatio(wRatio, lRatio, h, angle_deg) {
    const metrics = calculateDesignPhaseMetrics(wRatio, lRatio, angle_deg);
    const angle_rad = (angle_deg * Math.PI) / 180;

    const length = metrics.sPrimeL * h;
    const width_front = (metrics.sPrimeW - (2 * metrics.sPrimeL * Math.tan(angle_rad))) * h;
    const width_rear = metrics.sPrimeW * h;

    return {
        angle_deg,
        width: {
            front: width_front,
            rear: width_rear,
        },
        length: length,
        w_ratio: metrics.sPrimeW,
        l_ratio: metrics.sPrimeL
    };
}