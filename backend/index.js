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

app.use(express.json());

let queue = [];
let isProcessing = false;

const processNext = () => {
    if (isProcessing || queue.length === 0) return;

    isProcessing = true;
    const { req, res } = queue.shift();
    console.log("Yeni istek geldi:", req.body);
    const { lengthMean, currentHeight, wMin, wMax, splayType = 'double' } = req.body || {};

    const venvPython = '/venv/bin/python3';
    const pythonExecutable = fs.existsSync(venvPython) ? venvPython : 'python3';
    console.log("Python başlatılıyor...");
    const pythonProcess = spawn(pythonExecutable, [
        'solver.py',
        String(lengthMean || 0),
        String(currentHeight || 0),
        String(wMin || 0),
        String(wMax || 0),
        splayType === 'single' ? 'single' : 'double'
    ]);

    let pythonData = "";
    let pythonError = "";
    let aborted = false;

    // Bağlantı koptuğunda tetiklenecek güvenli iptal fonksiyonu
    const handleAbort = () => {
        console.log("handleAbort called");

        if (aborted || res.writableEnded) return;
        aborted = true;

        console.warn(`[İPTAL] Bağlantı koptu. Process (PID: ${pythonProcess.pid}) kapatılıyor...`);

        // 1. SIGTERM çağrısı try/catch korumasında
        try {
            pythonProcess.kill('SIGTERM');
        } catch (_) { }

        // C/C++ bloklanmalarına karşı 2 sn sonra zorla sonlandırma (SIGKILL)
        const killTimeout = setTimeout(() => {
            if (pythonProcess.exitCode === null) {
                try {
                    pythonProcess.kill('SIGKILL');
                } catch (_) { }
            }
        }, 2000);

        pythonProcess.once('close', () => clearTimeout(killTimeout));
    };

    req.on('aborted', () => {
        console.log("req aborted");
        handleAbort();
    });

    res.on('close', () => {
        console.log("res close");
        if (!res.writableEnded) {
            handleAbort();
        }
    });

    pythonProcess.stdout.on('data', (data) => {
        pythonData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        pythonError += data.toString();
    });

    pythonProcess.on('close', (code, signal) => {
        // Event listener temizliği (Memory leak önlendi)
        req.off('aborted', handleAbort);
        res.off('close', handleAbort);

        console.log(`Process bitti. Exit code: ${code}, Signal: ${signal}`);

        isProcessing = false;
        processNext();

        // Eğer istemci tarafı iptal edildiyse veya yanıt çoktan gönderildiyse yanıt basma
        if (res.writableEnded || aborted) return;
        if (code !== 0) {
            console.error("Python Execution Error:", pythonError);
            return res.status(500).json({
                error: "Python hesaplama hatası oluştu",
                details: pythonError || pythonData
            });
        }

        try {
            const parsed = JSON.parse(pythonData.trim());
            console.log("Response sent.");
            return res.json(parsed);
        } catch (error) {
            console.error("JSON Parse Error. Raw Output:", pythonData);
            return res.status(500).json({
                error: "Çıktı JSON formatında değil",
                details: pythonData
            });
        }
    });
};

app.get('/', (req, res) => {
    res.status(200).send('Backend sorunsuz çalışıyor!');
});

app.post('/api/calculate-modes', (req, res) => {
    // Kuyruktaki kopmuş istekleri temizle
    queue = queue.filter(task => !task.res.writableEnded && !task.req.destroyed);

    queue.push({ req, res });
    processNext();
});

const PORT = parseInt(process.env.PORT, 10) || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
});