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

    const venvPython = '/venv/bin/python3';
    const pythonExecutable = fs.existsSync(venvPython) ? venvPython : 'python3';

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

// Health check endpoint (Cloud Run başlangıç kontrolü için kritik)
app.get('/', (req, res) => {
    res.status(200).send('Backend sorunsuz çalışıyor!');
});

app.post('/api/calculate-modes', (req, res) => {
    queue.push({ req, res });
    processNext();
});

// Port tanımını 0.0.0.0 host'u ile dinleyerek açıyoruz
const PORT = parseInt(process.env.PORT, 10) || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
});