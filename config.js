// config.js
// Ganti URL ini dengan URL Web App Google Apps Script Anda!

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyfcvoLaBu3cOYwbbnRgwuhLCTazgaOankooBgVWb5z2hR3zstZnLhLDtczoqK6U_8b/exec';

// Nilai tetap
const PRODI_TETAP = "S1-Keperawatan";
const MATA_KULIAH_TETAP = "Inovasi Pelayanan Kesehatan";

// Daftar Dosen
const DAFTAR_DOSEN = [
    "Ns. Yunita Galih Yudanari, S.Kep.,M.Kep",
    "Ns. Puji Lestari, M.Kes (Epid)",
    "Dr. Ns. Priyanto, M. Kep., Sp. KMB",
    "M. Imron Rosyidi, S.Kep., Ns., M.Kep."
];

console.log('📋 Aplikasi Absensi Mahasiswa v1.0');
console.log('Google Script URL:', GOOGLE_SCRIPT_URL);
console.log('Program Studi:', PRODI_TETAP);
console.log('Mata Kuliah:', MATA_KULIAH_TETAP);
