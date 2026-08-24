const API_BASE_URL = 'http://localhost:8080/api';
// http://localhost:8080/api
// https://icsvwebsite-534923853316.europe-west1.run.app/api
let currentController = null;
export const calculateReal3DModes = async (lengthMean, currentHeight, wMin, wMax, splayType = 'double') => {
    currentController = new AbortController();
    try {
        const response = await fetch(`${API_BASE_URL}/calculate-modes`, {
            method: 'POST',
            signal: currentController.signal,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lengthMean: Number(lengthMean),
                currentHeight: Number(currentHeight),
                wMin: Number(wMin),
                wMax: Number(wMax),
                splayType: splayType === 'single' ? 'single' : 'double'
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.details || errData.error || `Server Hatası: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("3D calculation cancelled.");
            return null;
        }

        console.error("Real 3D solver servis bağlantı hatası:", error);
        return { frequencies: [], error: error.message };
    }
    finally {
        currentController = null;
    }
};

export const cancelReal3DCalculation = () => {

    if (currentController) {

        console.log("STOP clicked");
        currentController.abort();

        currentController = null;

    }

};