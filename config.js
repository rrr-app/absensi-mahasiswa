// config.js
// Ganti URL ini dengan URL Web App Google Apps Script Anda!

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyfcvoLaBu3cOYwbbnRgwuhLCTazgaOankooBgVWb5z2hR3zstZnLhLDtczoqK6U_8b/exec';

// Nilai tetap
const PRODI_TETAP = "Teknik Informatika";
const MATA_KULIAH_TETAP = "Pemrograman Web";

// Daftar Dosen
const DAFTAR_DOSEN = [
    "Prof. Dr. Ahmad Suhendra, M.Kom",
    "Dr. Rina Fitriana, S.Si., M.T",
    "Ir. Budi Santoso, M.MSI",
    "Dian Puspita Sari, S.Kom., M.Cs",
    "Dr. Eng. Hendra Gunawan, S.T., M.T"
];

console.log('📋 Aplikasi Absensi Mahasiswa v1.0');
console.log('Google Script URL:', GOOGLE_SCRIPT_URL);
console.log('Program Studi:', PRODI_TETAP);
console.log('Mata Kuliah:', MATA_KULIAH_TETAP);
