// config.js
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwufW0R8WsyPbW6hfvOamw7YEdTRd27Q8oh_pLFxinfhJuQ4UfJoLuHvaPvtFW4hzRp/exec';
// File konfigurasi untuk aplikasi absensi
const APP_CONFIG = {
    appName: 'Aplikasi Absensi Mahasiswa',
    version: '1.0.0',
    prodi: 'Teknik Informatika',
    mataKuliah: 'Pemrograman Web'
};

console.log('📋 Aplikasi Absensi Mahasiswa v1.0.0');
console.log('Program Studi:', APP_CONFIG.prodi);
console.log('Mata Kuliah:', APP_CONFIG.mataKuliah);
console.log('🚀 Config loaded!');
console.log('URL:', GOOGLE_SCRIPT_URL);
