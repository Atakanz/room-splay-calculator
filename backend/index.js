const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const app = express();

app.use(cors());
app.use(express.json());

// Kuyruk Mekanizması
const queue = [];
let isProcessing = false;

const processNext = () => {
    if (isProcessing || queue.length === 0) return;

    isProcessing = true;
    const { req, res } = queue.shift();
    const { lengthMean, currentHeight, wMin, wMax } = req.body;

    const pythonProcess = spawn('python3', [
        'solver.py',
        lengthMean,
        currentHeight,
        wMin,
        wMax
    ]);

    // Kullanıcı iptal ederse süreci öldür
    req.on('close', () => {
        if (!res.writableEnded) {
            pythonProcess.kill('SIGKILL');
        }
    });

    let pythonData = "";
    pythonProcess.stdout.on('data', (data) => {
        pythonData += data.toString();
    });

    pythonProcess.on('close', () => {
        if (!res.writableEnded) {
            try {
                res.json(JSON.parse(pythonData));
            } catch (error) {
                res.status(500).json({ error: "Hesaplama hatası", details: pythonData });
            }
        }
        // Analiz bitti, bir sonraki isteği kuyruktan çek
        isProcessing = false;
        processNext();
    });
};

app.post('/api/calculate-modes', (req, res) => {
    // Gelen her isteği kuyruğa at ve işlemeyi tetikle
    queue.push({ req, res });
    processNext();
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend ${PORT} portunda çalışıyor.`));