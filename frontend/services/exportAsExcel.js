import * as XLSX from 'xlsx';

export const exportSavedRunsToExcel = (savedRuns) => {
    if (!savedRuns || savedRuns.length === 0) return;

    const sheetData = [];

    savedRuns.forEach((run, roomIndex) => {
        // Odalar arasında görsel mesafe bırakmak için boş satır ekle
        if (roomIndex > 0) {
            sheetData.push([]);
            sheetData.push([]);
        }

        // --- ODA GEOMETRİ BAŞLIK BLOĞU ---
        sheetData.push([`ROOM CONFIGURATION #${roomIndex + 1}`]);
        sheetData.push(["Splay Angle", `${run.angle}° (${run.modeName || 'Inward'})`]);
        sheetData.push(["Outer Rectangular Ratio", run.outerRatio || 'N/A']);
        sheetData.push(["Average Splayed Ratio", run.avgRatio || 'N/A']);
        sheetData.push(["Dimensions (Wf/Wr x L)", run.dimensions]);
        sheetData.push(["Height (m)", run.height]);
        sheetData.push(["3D FEM FSI Score", run.fsi || 'N/A']); // YENİ: FSI Skoru eklendi
        sheetData.push([]); // Tablo başlığı öncesi boşluk

        // --- FREKANS TABLOSU BAŞLIKLARI ---
        sheetData.push(["Mode Index", "Frequency (Hz)"]);

        // --- FREKANS LİSTESİ ---
        if (run.frequencies && run.frequencies.length > 0) {
            run.frequencies.forEach((freq, idx) => {
                sheetData.push([idx + 1, freq]);
            });
        } else {
            sheetData.push(["-", "No frequencies calculated"]);
        }
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Excel görünüm yönünü soldan sağa sabitle (RTL problemini önler)
    worksheet['!views'] = [{ rightToLeft: false }];

    // Sütun genişliklerini içeriğe göre otomatik ayarla (Görsel okuma kolaylığı)
    worksheet['!cols'] = [
        { wch: 28 }, // 1. Sütun (Parametre İsimleri / Mod İndeks)
        { wch: 22 }  // 2. Sütun (Değerler / Frekanslar)
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "3D_FEM_Report");

    XLSX.writeFile(workbook, `3D_FEM_Acoustic_Report_${Date.now()}.xlsx`);
};