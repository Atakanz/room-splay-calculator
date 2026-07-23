/**
 * Real 3D Acoustic FDM Solver Service
 * Python tabanlı non-rectangular 3D çözücü ile haberleşir.
 */

const API_BASE_URL = 'https://icsvwebsite-534923853316.europe-west1.run.app';

/**
 * @param {number} lengthMean - Odanın ortalama uzunluğu
 * @param {number} heightMean - Odanın yüksekliği
 * @param {number} wMin - Trapez tabanın kısa genişlik kenarı (Width Front veya Rear)
 * @param {number} wMax - Trapez tabanın uzun genişlik kenarı (Width Rear veya Front)
 * @returns {Promise<{frequencies: number[]}>}
 */
export const calculateReal3DModes = async (lengthMean, currentHeight, wMin, wMax) => {
    try {
        const response = await fetch(`${API_BASE_URL}/calculate-modes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lengthMean: Number(lengthMean),
                currentHeight: Number(currentHeight),
                wMin: Number(wMin),
                wMax: Number(wMax)
            })
        });

        if (!response.ok) {
            throw new Error(`API Hatası: ${response.statusText}`);
        }

        const data = await response.ok ? await response.json() : { frequencies: [] };
        return data;
    } catch (error) {
        console.error("Real 3D solver servis bağlantı hatası:", error);
        return { frequencies: [], error: error.message };
    }
};