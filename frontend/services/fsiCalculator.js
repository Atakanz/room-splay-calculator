/**
 * Rindel / Bolt yöntemine göre ilk N mod için Frequency Spacing Index (FSI) hesaplar.
 * @param {Array<number>} frequencies - Küçükten büyüğe sıralı frekans dizisi (Hz)
 * @param {number} modeLimit - FSI için kullanılacak mod sayısı (Varsayılan: 25)
 * @returns {number|null} FSI skoru (Yuvarlanmış 2 hane)
 */
export function calculateFSI(frequencies, modeLimit = 25) {
    if (!frequencies || frequencies.length < 3) return null;

    // Frekansları küçükten büyüğe sırala ve ilk N modu al
    const sortedFreqs = [...frequencies].sort((a, b) => a - b);
    const selectedFreqs = sortedFreqs.slice(0, Math.min(sortedFreqs.length, modeLimit));

    const n = selectedFreqs.length;
    if (n < 3) return null;

    const f1 = selectedFreqs[0];
    const fn = selectedFreqs[n - 1];

    const totalRange = fn - f1;
    if (totalRange <= 0) return null;

    // Ortalama frekans aralığı (delta_bar)
    const deltaBar = totalRange / (n - 1);

    // Ardışık modlar arası farkların (delta_i^2 / delta_bar) toplamı
    let sumTerm = 0;
    for (let i = 0; i < n - 1; i++) {
        const deltaI = selectedFreqs[i + 1] - selectedFreqs[i];
        sumTerm += (Math.pow(deltaI, 2) / deltaBar);
    }

    const fsi = (1 / totalRange) * sumTerm;
    return parseFloat(fsi.toFixed(2));
}