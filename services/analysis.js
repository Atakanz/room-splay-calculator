/**
 * ITU-R BS.1116-3 Standart Oda Oranı Sınır Kontrolü [cite: 14, 67]
 */
export function checkRatio(w_ratio, l_ratio) {
    const is_in_range = (1.1 * w_ratio <= l_ratio) && (l_ratio <= 4.5 * w_ratio - 4); // [cite: 67]
    const is_less_than_3 = (l_ratio < 3 && w_ratio < 3);
    return is_in_range && is_less_than_3;
}

/**
 * Inwardly Splaying: Mevcut odaların duvarlarını içeri doğru açılandırma [cite: 110, 111, 122]
 */
export function splayTheRoom(w, l, h, angle_deg) {
    const angle_rad = (angle_deg * Math.PI) / 180;

    // Yeni boyut hesaplamaları [cite: 132]
    const new_length = l / Math.cos(angle_rad);
    const new_width_short = w - (2 * l * Math.tan(angle_rad));
    const new_width_long = w;

    // 4m hoparlör yerleşim sınır kontrolü [cite: 102, 134, 154]
    const is_under_4m = new_width_short < 4;

    // Ortalama genişlik üzerinden eşdeğer oran hesaplama [cite: 17, 42]
    const avg_w = (new_width_short + new_width_long) / 2;
    const w_ratio = avg_w / h;
    const l_ratio = new_length / h;

    const is_ok = checkRatio(w_ratio, l_ratio);

    if (is_ok) {
        return { status: true, is_under_4m, message: `1:${w_ratio.toFixed(2)}:${l_ratio.toFixed(2)}` };
    } else {
        return { status: false, is_under_4m, message: "RATIO_ERROR" };
    }
}

/**
 * Optimum Açı Tarayıcı Algoritması [cite: 109, 131]
 */
export function calculateTheOptimumRatio(w, l, h) {
    const results = [];
    let limit_reached_warning_printed = false;

    for (let angle = 0; angle < 15; angle++) {
        const { status, is_under_4m, message } = splayTheRoom(w, l, h, angle);

        // 4m uyarısı sınır eşiğinde bir kez tetiklenir [cite: 134, 154]
        if (is_under_4m && !limit_reached_warning_printed) {
            console.log(`\n[!] Dikkat: ${angle} derece itibariyle kısa kenar 4 metreden az oluyor (Yerleşim standart dışı).`);
            limit_reached_warning_printed = true;
        }

        if (status) {
            results.push({ angle, message, warning: is_under_4m ? true : false });
        }
    }

    return results;
}

/**
 * Controlled Splaying: Aynı hedef oran ve mod yapısını koruyarak tersten boyut hesaplama [cite: 112, 186, 188]
 */
export function splayTheRoomWithTheSameRatio(w, l, h, angle_deg) {
    const w_ratio_i = w / h;
    const l_ratio_i = l / h;

    const angle_rad = (angle_deg * Math.PI) / 180;

    // Formül dönüşümleri [cite: 195, 196, 197]
    const w_ratio = w_ratio_i + l_ratio_i * Math.tan(angle_rad);
    const l_ratio = l_ratio_i * Math.cos(angle_rad);

    const h_min = 4 / (w_ratio - 2 * l_ratio * Math.tan(angle_rad));
    const length = l_ratio * h_min;
    const width_front = (w_ratio - 2 * l_ratio * Math.tan(angle_rad)) * h_min;
    const width_rear = w_ratio * h_min;

    const result = { angle_deg, width: { front: width_front.toFixed(2), rear: width_rear.toFixed(2) }, length: length.toFixed(2), height: h_min.toFixed(2) }
    return result
}