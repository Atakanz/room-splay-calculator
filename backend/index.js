const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/calculate-modes', (req, res) => {
    const { lengthMean, currentHeight, wMin, wMax } = req.body;
    // 3. Adımda yazacağımız Python script'ini çağırıyoruz
    const pythonProcess = spawn('python3', [
        'solver.py',
        lengthMean,
        currentHeight,
        wMin,
        wMax
    ]);

    let pythonData = "";

    // Python'dan gelen sonuçları oku
    pythonProcess.stdout.on('data', (data) => {
        pythonData += data.toString();
    });

    // Python script'i çalışmayı bitirdiğinde frontend'e gönder
    pythonProcess.on('close', (code) => {
        try {
            const jsonResult = JSON.parse(pythonData);
            res.json(jsonResult);
        } catch (error) {
            res.status(500).json({ error: "Python hesaplama hatası", details: pythonData });
        }
    });
});

app.listen(5005, () => console.log('Backend 5005 portunda çalışıyor.'));