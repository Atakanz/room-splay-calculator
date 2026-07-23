const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());
app.use(express.json());

const queue = [];
let isProcessing = false;

const processNext = () => {
    if (isProcessing || queue.length === 0) return;

    isProcessing = true;
    const { req, res } = queue.shift();
    const { lengthMean, currentHeight, wMin, wMax } = req.body || {};

    // Docker veya Venv Python konumu
    const venvPython = '/venv/bin/python3';
    const pythonExecutable = fs.existsSync(venvPython) ? venvPython : 'python3';

    // Parametreleri kesin olarak String'e çevirerek gönder
    const pythonProcess = spawn(pythonExecutable, [
        'solver.py',
        String(lengthMean || 0),
        String(currentHeight || 0),
        String(wMin || 0),
        String(wMax || 0)
    ]);

    req.on('close', () => {
        if (!res.writableEnded) {
            pythonProcess.kill('SIGKILL');
        }
    });

    let pythonData = "";
    let pythonError = "";

    pythonProcess.stdout.on('data', (data) => {
        pythonData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        pythonError += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (!res.writableEnded) {
            if (code !== 0) {
                console.error("Python Execution Error:", pythonError);
                return res.status(500).json({
                    error: "Python hesaplama hatası oluştu",
                    details: pythonError || pythonData
                });
            }

            try {
                const parsed = JSON.parse(pythonData);
                return res.json(parsed);
            } catch (error) {
                console.error("JSON Parse Error. Raw Output:", pythonData);
                return res.status(500).json({
                    error: "Çıktı JSON formatında değil",
                    details: pythonData
                });
            }
        }
        isProcessing = false;
        processNext();
    });
};

app.get('/', (req, res) => {
    res.send('Backend sorunsuz çalışıyor!');
});

app.post('/api/calculate-modes', (req, res) => {
    queue.push({ req, res });
    processNext();
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend ${PORT} portunda çalışıyor.`));