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

    // Production (Docker) ortamında sanal ortam Python'ını kullan
    const pythonExecutable = process.env.NODE_ENV === 'production'
        ? '/venv/bin/python3'
        : 'python3';

    const pythonProcess = spawn(pythonExecutable, [
        'solver.py',
        lengthMean,
        currentHeight,
        wMin,
        wMax
    ]);

    // Kullanıcı tarayıcıyı/isteği kapatırsa Python sürecini sonlandır
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
        // Analiz bitti, kuyruktaki bir sonraki isteğe geç
        isProcessing = false;
        processNext();
    });
};

app.post('/api/calculate-modes', (req, res) => {
    queue.push({ req, res });
    processNext();
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend ${PORT} portunda çalışıyor.`));