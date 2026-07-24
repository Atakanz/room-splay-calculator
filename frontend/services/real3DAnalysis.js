const API_BASE_URL = 'https://icsvwebsite-534923853316.europe-west1.run.app/api';
// http://localhost:8080/api
// https://icsvwebsite-534923853316.europe-west1.run.app/api

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
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.details || errData.error || `Server Hatası: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Real 3D solver servis bağlantı hatası:", error);
        return { frequencies: [], error: error.message };
    }
};