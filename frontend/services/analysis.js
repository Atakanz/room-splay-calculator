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
export function splayTheRoom(w, l, h, angle_deg, splayType = 'double') {
    const angle_rad = (angle_deg * Math.PI) / 180;

    if (splayType === 'single') {
        // One longitudinal wall is splayed inward. Its physical edge is longer
        // than the opposite straight edge, while the width reduction is the
        // horizontal projection L*tan(theta).
        const lengthStraight = l;
        const lengthSplayed = l / Math.cos(angle_rad);
        const new_width_short = w - (l * Math.tan(angle_rad));
        const new_width_long = w;

        const is_under_4m = new_width_short < 4;
        const avg_w = (new_width_short + new_width_long) / 2;
        const avg_length = (lengthSplayed + lengthStraight) / 2;
        const w_ratio = avg_w / h;
        const l_ratio = avg_length / h;
        const is_ok = checkRatio(w_ratio, l_ratio);

        if (is_ok) {
            return {
                status: true,
                is_under_4m,
                message: `1:${w_ratio.toFixed(2)}:${l_ratio.toFixed(2)}`,
                avgWidth: avg_w,
                avgLength: avg_length,
                w_ratio,
                l_ratio,
                length: {
                    splayed: lengthSplayed,
                    straight: lengthStraight
                },
                width: {
                    front: new_width_short,
                    rear: new_width_long
                },
                splayType
            };
        }

        return {
            status: false,
            is_under_4m,
            message: "RATIO_ERROR",
            length: {
                splayed: lengthSplayed,
                straight: lengthStraight
            },
            width: {
                front: new_width_short,
                rear: new_width_long
            },
            splayType
        };
    }

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
            l_ratio,
            length: {
                splayed: new_length,
                straight: new_length
            },
            width: {
                front: new_width_short,
                rear: new_width_long
            },
            splayType
        };
    }

    return {
        status: false,
        is_under_4m,
        message: "RATIO_ERROR",
        length: {
            splayed: new_length,
            straight: new_length
        },
        width: {
            front: new_width_short,
            rear: new_width_long
        },
        splayType
    };
}

export function calculateTheOptimumRatio(w, l, h, splayType = 'double') {
    const results = [];
    for (let angle = 0; angle < 15; angle++) {
        const { status, is_under_4m, message, avgWidth, avgLength, w_ratio, l_ratio, length, width } =
            splayTheRoom(w, l, h, angle, splayType);
        if (status) {
            results.push({
                angle,
                message,
                warning: is_under_4m,
                avgWidth,
                avgLength,
                w_ratio,
                l_ratio,
                length,
                width,
                splayType
            });
        }
    }
    return results;
}

/**
 * Controlled Splaying (Design Phase Formülleri)
 */
export function calculateDesignPhaseMetrics(wRatio, lRatio, angle_deg, splayType = 'double') {
    const angle_rad = (angle_deg * Math.PI) / 180;

    let sPrimeW;
    let sPrimeL;
    let sPrimeL_splayed;
    let sPrimeL_straight;

    if (splayType === 'single') {
        // Single-sided geometry:
        // The straight longitudinal edge is the original rectangular-room
        // length. The splayed edge is the geometric extension of that same
        // length because it is inclined by the splay angle.
        sPrimeL_straight = lRatio;
        sPrimeL_splayed = sPrimeL_straight / Math.cos(angle_rad);
        sPrimeL = (sPrimeL_straight + sPrimeL_splayed) / 2;

        // The outer/fixed width is sPrimeW. The splayed side moves inward by
        // the horizontal projection of the original straight length.
        sPrimeW = wRatio + (sPrimeL_straight * Math.tan(angle_rad)) / 2;
    } else {
        // Double-sided splaying: both longitudinal edges have the same length.
        sPrimeW = wRatio + (lRatio * Math.tan(angle_rad));
        sPrimeL = lRatio * Math.cos(angle_rad);
        sPrimeL_splayed = sPrimeL;
        sPrimeL_straight = sPrimeL;
    }

    const denominator = sPrimeW - (2 * sPrimeL * Math.tan(angle_rad));
    const hMinFormula = denominator > 0 ? (4 / denominator) : 2.5;
    const hMin = parseFloat(Math.max(2.5, hMinFormula).toFixed(2));

    return {
        sPrimeW,
        sPrimeL,
        sPrimeL_splayed,
        sPrimeL_straight,
        hMin,
        splayType
    };
}

/**
 * Belirli bir tavan yüksekliği (h) kullanarak fiziksel stüdyo boyutlarını türetir
 */
export function splayTheRoomWithTheSameRatio(wRatio, lRatio, h, angle_deg, splayType = 'double') {
    const metrics = calculateDesignPhaseMetrics(wRatio, lRatio, angle_deg, splayType);
    const angle_rad = (angle_deg * Math.PI) / 180;

    let width_front;
    let width_rear;
    let length;
    let length_splayed;
    let length_straight;

    if (metrics.splayType === 'single') {
        // Preserve the two physical longitudinal edges separately.
        length_splayed = metrics.sPrimeL_splayed * h;
        length_straight = metrics.sPrimeL_straight * h;
        length = (length_splayed + length_straight) / 2;

        // Rear/fixed side remains at the outer width. The opposite side moves
        // inward by the projected straight-edge length*tan(theta).
        width_rear = metrics.sPrimeW * h;
        width_front = (metrics.sPrimeW - (metrics.sPrimeL_straight * Math.tan(angle_rad))) * h;
    } else {
        length = metrics.sPrimeL * h;
        length_splayed = length;
        length_straight = length;

        width_front = (metrics.sPrimeW - (2 * metrics.sPrimeL * Math.tan(angle_rad))) * h;
        width_rear = metrics.sPrimeW * h;
    }

    return {
        angle_deg,
        width: {
            front: width_front,
            rear: width_rear,
        },
        length,
        lengthEdges: {
            splayed: length_splayed,
            straight: length_straight
        },
        w_ratio: metrics.sPrimeW,
        l_ratio: metrics.sPrimeL,
        splayType
    };
}