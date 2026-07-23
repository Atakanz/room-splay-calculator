// src/services/modalResponse.js

const SPEED_OF_SOUND = 343; // m/s

/**
 * Rayleigh denklemi kullanarak 200Hz altındaki TÜM modları hesaplar.
 * %5 yakınlık analizi SADECE AXIAL (Eksenel) modlar arasında yapılır.
 * Ek olarak, odanın genel cluster profilini çıkaran meta veriler hesaplar.
 */
export function calculateAllModes(width, length, height) {
    const modes = [];
    const maxFreq = 200;

    const maxIndex = Math.ceil((maxFreq * 2 * Math.max(width, length, height)) / SPEED_OF_SOUND) + 1;

    for (let nx = 0; nx <= maxIndex; nx++) {
        for (let ny = 0; ny <= maxIndex; ny++) {
            for (let nz = 0; nz <= maxIndex; nz++) {
                if (nx === 0 && ny === 0 && nz === 0) continue;

                const freq = (SPEED_OF_SOUND / 2) * Math.sqrt(
                    Math.pow(nx / length, 2) +
                    Math.pow(ny / width, 2) +
                    Math.pow(nz / height, 2)
                );

                if (freq <= maxFreq) {
                    const zeros = [nx, ny, nz].filter(v => v === 0).length;
                    let type = 'Oblique';
                    let typeColor = 'bg-orange-50 text-orange-700 border-orange-100';

                    if (zeros === 2) {
                        type = 'Axial';
                        typeColor = 'bg-red-50 text-red-700 border-red-100 font-bold';
                    } else if (zeros === 1) {
                        type = 'Tangential';
                        typeColor = 'bg-amber-50 text-amber-700 border-amber-100';
                    }

                    modes.push({
                        freq: Math.round(freq * 100) / 100,
                        type,
                        typeColor,
                        label: `(${nx},${ny},${nz})`
                    });
                }
            }
        }
    }

    const sortedModes = modes.sort((a, b) => a.freq - b.freq);
    const axialModes = sortedModes.filter(m => m.type === 'Axial');

    // Odanın cluster (kümelenme) istatistikleri için değişkenler
    let totalAxialClusters = 0;
    let firstClusterFreq = null;

    // %5 Yakınlık Komşuluk Kontrolü (SADECE AXIAL MODLAR İÇİN)
    for (let i = 0; i < sortedModes.length; i++) {
        if (sortedModes[i].type !== 'Axial') {
            sortedModes[i].clustering = false;
            sortedModes[i].clusteringDetails = '';
            continue;
        }

        let hasClustering = false;
        let details = [];
        const currentFreq = sortedModes[i].freq;

        // Eksenel mod listesindeki sırasını bul
        const axialIndex = axialModes.findIndex(am => am.freq === currentFreq && am.label === sortedModes[i].label);

        if (axialIndex > 0) {
            const prevAxial = axialModes[axialIndex - 1];
            if (prevAxial.freq >= currentFreq * 0.95 && prevAxial.freq <= currentFreq * 1.05) {
                hasClustering = true;
                details.push(`Axial close to prev (${prevAxial.freq}Hz)`);
            }
        }

        if (axialIndex < axialModes.length - 1) {
            const nextAxial = axialModes[axialIndex + 1];
            if (nextAxial.freq >= currentFreq * 0.95 && nextAxial.freq <= currentFreq * 1.05) {
                hasClustering = true;
                details.push(`Axial close to next (${nextAxial.freq}Hz)`);
            }
        }

        sortedModes[i].clustering = hasClustering;
        sortedModes[i].clusteringDetails = details.join(', ');

        if (hasClustering) {
            totalAxialClusters++;
            if (firstClusterFreq === null) {
                firstClusterFreq = currentFreq;
            }
        }
    }

    // Diziye özel meta nesnesi iliştiriyoruz (Arayüzde akıllı kıyaslama için)
    sortedModes.meta = {
        totalAxialClusters,
        // Eğer cluster yoksa, güvenli bölgeyi temsil etmesi için 999Hz basıyoruz (böylece kıyaslamada hep üstte kalır)
        firstClusterFreq: firstClusterFreq !== null ? firstClusterFreq : 999
    };

    return sortedModes;
}