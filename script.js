// script.js - Versi dengan Google Spreadsheet

// State
let allAbsensiData = [];
let filteredData = [];
let isAdmin = false;
let isLoading = false;

// Daftar Dosen
const DAFTAR_DOSEN = [
    "Prof. Dr. Ahmad Suhendra, M.Kom",
    "Dr. Rina Fitriana, S.Si., M.T",
    "Ir. Budi Santoso, M.MSI",
    "Dian Puspita Sari, S.Kom., M.Cs",
    "Dr. Eng. Hendra Gunawan, S.T., M.T"
];

// ============================================
// FUNGSI API GOOGLE SHEETS
// ============================================

async function callGoogleScript(action, data = {}) {
    try {
        const params = new URLSearchParams({
            action: action,
            ...data
        });
        
        const url = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;
        console.log(`📡 Calling Google Script: ${action}`, url);
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });
        
        const result = await response.json();
        console.log(`📡 Response:`, result);
        
        return result;
    } catch (error) {
        console.error(`❌ Error calling ${action}:`, error);
        return { success: false, error: error.message };
    }
}

// Load data dari Google Sheets
async function loadDataFromGoogle() {
    showLoading(true);
    
    try {
        const result = await callGoogleScript('getData');
        
        if (result.success && result.data) {
            allAbsensiData = result.data.map(item => ({
                id: item.id,
                nim: item.nim,
                nama: item.nama,
                prodi: item.prodi,
                mataKuliah: item.mata_kuliah,
                dosen: item.dosen,
                keterangan: item.keterangan,
                waktu: item.waktu,
                tanggal: item.tanggal,
                tanggalFormatted: item.tanggal_formatted
            }));
            console.log(`✅ Loaded ${allAbsensiData.length} records`);
        } else {
            console.error('Load failed:', result.error);
            allAbsensiData = [];
        }
        
        applyFilters();
    } catch (error) {
        console.error('Error loading data:', error);
        showAlert('Gagal memuat data!', 'error');
        allAbsensiData = [];
        applyFilters();
    } finally {
        showLoading(false);
    }
}

// Simpan data ke Google Sheets
async function saveDataToGoogle(absensiData) {
    showLoading(true);
    
    try {
        const result = await callGoogleScript('addData', {
            data: JSON.stringify(absensiData)
        });
        
        if (result.success) {
            // Refresh data setelah save
            await loadDataFromGoogle();
            showAlert('✅ Data berhasil disimpan!', 'success');
            return true;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Save error:', error);
        showAlert('Gagal menyimpan data: ' + error.message, 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

// Hapus data dari Google Sheets
async function deleteDataFromGoogle(nim, tanggal, dosen) {
    if (!isAdmin) {
        showAlert('Hanya admin yang dapat menghapus data!', 'error');
        return false;
    }
    
    showLoading(true);
    
    try {
        const result = await callGoogleScript('deleteData', {
            nim: nim,
            tanggal: tanggal,
            dosen: dosen
        });
        
        if (result.success) {
            await loadDataFromGoogle();
            showAlert('✅ Data berhasil dihapus!', 'success');
            return true;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('Gagal menghapus data!', 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

// Reset semua data
async function resetAllData() {
    if (!isAdmin) {
        showAlert('⚠️ Hanya admin yang dapat mereset data!', 'error');
        return;
    }
    
    if (!confirm('⚠️ HAPUS SEMUA DATA? Tindakan ini tidak dapat dibatalkan!')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const result = await callGoogleScript('resetData');
        
        if (result.success) {
            await loadDataFromGoogle();
            showAlert('✅ Semua data telah direset!', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Reset error:', error);
        showAlert('Gagal mereset data!', 'error');
    } finally {
        showLoading(false);
    }
}

// Cek duplikasi
async function checkDuplicateFromGoogle(nim, tanggal, dosen) {
    try {
        const result = await callGoogleScript('checkDuplicate', {
            nim: nim,
            tanggal: tanggal,
            dosen: dosen
        });
        
        return result.success && result.isDuplicate;
    } catch (error) {
        console.error('Duplicate check error:', error);
        return false;
    }
}

// ============================================
// FUNGSI UTAMA APLIKASI
// ============================================

function showLoading(show) {
    isLoading = show;
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function getTanggalHariIni() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTanggalDisplay() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return today.toLocaleDateString('id-ID', options);
}

function getWaktuSekarang() {
    const now = new Date();
    return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatTanggalIndonesia(tanggal) {
    const date = new Date(tanggal);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Handle submit absensi
async function handleSubmitAbsensi(e) {
    e.preventDefault();
    
    const nim = document.getElementById('nim').value.trim();
    const nama = document.getElementById('nama').value.trim();
    const dosen = document.getElementById('dosen').value;
    const keterangan = document.getElementById('keterangan').value;
    const prodi = document.getElementById('prodi_hidden').value;
    const mataKuliah = document.getElementById('mataKuliah_hidden').value;
    const tanggal = getTanggalHariIni();
    
    console.log('📝 Form submitted:', { nim, nama, dosen, keterangan });
    
    // Validasi
    if (!nim || !nama || !dosen || !keterangan) {
        showAlert('Semua field harus diisi!', 'error');
        return;
    }
    
    if (!/^\d+$/.test(nim)) {
        showAlert('NIM harus berupa angka!', 'error');
        return;
    }
    
    // Cek duplikasi
    const isDuplicate = await checkDuplicateFromGoogle(nim, tanggal, dosen);
    if (isDuplicate) {
        showAlert(`❌ NIM ${nim} sudah absen untuk dosen ini hari ini!`, 'error');
        return;
    }
    
    // Siapkan data
    const absensiData = {
        nim: nim,
        nama: nama,
        prodi: prodi,
        mata_kuliah: mataKuliah,
        dosen: dosen,
        keterangan: keterangan,
        waktu: getWaktuSekarang(),
        tanggal: tanggal,
        tanggal_formatted: formatTanggalIndonesia(tanggal)
    };
    
    // Simpan
    const success = await saveDataToGoogle(absensiData);
    
    if (success) {
        e.target.reset();
        document.getElementById('nim').focus();
    }
}

// Delete data
async function deleteSingleData(id) {
    const dataToDelete = allAbsensiData.find(item => item.id === id);
    if (!dataToDelete) return;
    
    await deleteDataFromGoogle(dataToDelete.nim, dataToDelete.tanggal, dataToDelete.dosen);
}

// ============================================
// FILTER DAN RENDER
// ============================================

function applyFilters() {
    const filterDosen = document.getElementById('filterDosen')?.value || 'all';
    const filterKeterangan = document.getElementById('filterKeterangan')?.value || 'all';
    const filterTanggal = document.getElementById('filterTanggal')?.value || '';
    const filterSearch = document.getElementById('filterSearch')?.value.toLowerCase() || '';
    
    filteredData = allAbsensiData.filter(data => {
        let match = true;
        if (filterDosen !== 'all' && data.dosen !== filterDosen) match = false;
        if (filterKeterangan !== 'all' && data.keterangan !== filterKeterangan) match = false;
        if (filterTanggal && data.tanggal !== filterTanggal) match = false;
        if (filterSearch && !data.nim.includes(filterSearch) && !data.nama.toLowerCase().includes(filterSearch)) match = false;
        return match;
    });
    
    filteredData.sort((a, b) => b.id - a.id);
    
    updateStatistics();
    updateStatisticsPerDosen();
    renderTabel();
}

function resetFilters() {
    document.getElementById('filterDosen').value = 'all';
    document.getElementById('filterKeterangan').value = 'all';
    document.getElementById('filterTanggal').value = '';
    document.getElementById('filterSearch').value = '';
    applyFilters();
    showAlert('Filter direset', 'success');
}

function updateStatistics() {
    const total = filteredData.length;
    const hadir = filteredData.filter(a => a.keterangan === 'Hadir').length;
    const sakit = filteredData.filter(a => a.keterangan === 'Sakit').length;
    const izin = filteredData.filter(a => a.keterangan === 'Izin').length;
    const alpha = filteredData.filter(a => a.keterangan === 'Alpha').length;
    
    document.getElementById('totalData').textContent = total;
    document.getElementById('totalHadir').textContent = hadir;
    document.getElementById('totalSakit').textContent = sakit;
    document.getElementById('totalIzin').textContent = izin;
    document.getElementById('totalAlpha').textContent = alpha;
}

function updateStatisticsPerDosen() {
    const statsPerDosen = {};
    DAFTAR_DOSEN.forEach(dosen => {
        statsPerDosen[dosen] = { total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0 };
    });
    
    filteredData.forEach(data => {
        if (statsPerDosen[data.dosen]) {
            statsPerDosen[data.dosen].total++;
            statsPerDosen[data.dosen][data.keterangan.toLowerCase()]++;
        }
    });
    
    const container = document.getElementById('statsPerDosen');
    if (!container) return;
    
    let html = '<div class="stats-dosen-grid">';
    for (const [dosen, stats] of Object.entries(statsPerDosen)) {
        if (stats.total > 0) {
            html += `
                <div class="dosen-stats-card">
                    <div class="dosen-name">${dosen.split(',')[0]}</div>
                    <div class="dosen-stats-detail">
                        <div class="dosen-stat-item"><span class="dosen-stat-label">Total</span><span class="dosen-stat-value">${stats.total}</span></div>
                        <div class="dosen-stat-item"><span class="dosen-stat-label">Hadir</span><span class="dosen-stat-value hadir">${stats.hadir}</span></div>
                        <div class="dosen-stat-item"><span class="dosen-stat-label">Sakit</span><span class="dosen-stat-value sakit">${stats.sakit}</span></div>
                        <div class="dosen-stat-item"><span class="dosen-stat-label">Izin</span><span class="dosen-stat-value izin">${stats.izin}</span></div>
                        <div class="dosen-stat-item"><span class="dosen-stat-label">Alpha</span><span class="dosen-stat-value alpha">${stats.alpha}</span></div>
                    </div>
                </div>
            `;
        }
    }
    
    if (html === '<div class="stats-dosen-grid">') {
        html += '<div class="empty-state"><p>Tidak ada data</p></div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

function renderTabel() {
    const tbody = document.getElementById('tbodyAbsensi');
    if (!tbody) return;
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><span class="empty-icon">📭</span><p>Tidak ada data</p></div></td></tr>`;
        return;
    }
    
    let html = '';
    filteredData.forEach((absen, index) => {
        const dosenShort = absen.dosen.split(',')[0];
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${absen.tanggalFormatted}</td>
                <td>${dosenShort}</td>
                <td>${absen.nim}</td>
                <td>${absen.nama}</td>
                <td>${absen.prodi}</td>
                <td>${absen.mataKuliah}</td>
                <td>${getBadgeKeterangan(absen.keterangan)}</td>
                <td>${absen.waktu}</td>
                <td>${isAdmin ? `<button class="btn-delete" onclick="deleteSingleData(${absen.id})">🗑️ Hapus</button>` : '-'}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function getBadgeKeterangan(keterangan) {
    const badges = {
        'Hadir': '<span style="background: #43e97b; color: white; padding: 4px 12px; border-radius: 20px;">✅ Hadir</span>',
        'Sakit': '<span style="background: #f6d365; color: white; padding: 4px 12px; border-radius: 20px;">🤒 Sakit</span>',
        'Izin': '<span style="background: #4facfe; color: white; padding: 4px 12px; border-radius: 20px;">📋 Izin</span>',
        'Alpha': '<span style="background: #fa709a; color: white; padding: 4px 12px; border-radius: 20px;">❌ Alpha</span>'
    };
    return badges[keterangan] || keterangan;
}

function showAlert(message, type) {
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) alertDiv.remove();
    }, 3000);
}

function exportToExcel(data, type) {
    if (!isAdmin) {
        showAlert('⚠️ Export hanya untuk admin!', 'error');
        return;
    }
    
    if (data.length === 0) {
        showAlert('Tidak ada data', 'error');
        return;
    }
    
    const excelData = data.map((absen, index) => ({
        'No': index + 1,
        'Tanggal': absen.tanggalFormatted,
        'Dosen': absen.dosen,
        'NIM': absen.nim,
        'Nama': absen.nama,
        'Keterangan': absen.keterangan,
        'Waktu': absen.waktu
    }));
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
    XLSX.writeFile(wb, `Absensi_${getTanggalHariIni()}.xlsx`);
    showAlert(`✅ Export ${data.length} data`, 'success');
}

// ============================================
// LOGIN ADMIN
// ============================================

const ADMIN_CONFIG = { username: 'admin', password: 'admin123' };

function checkSession() {
    const savedSession = localStorage.getItem('adminSession');
    if (savedSession) {
        const session = JSON.parse(savedSession);
        const hoursDiff = (new Date() - new Date(session.timestamp)) / (1000 * 60 * 60);
        if (hoursDiff < 24) {
            isAdmin = true;
        } else {
            localStorage.removeItem('adminSession');
        }
    }
    updateUI();
}

function updateUI() {
    const userStatus = document.getElementById('userStatus');
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const btnReset = document.getElementById('btnReset');
    const btnExport = document.getElementById('btnExport');
    const btnExportFiltered = document.getElementById('btnExportFiltered');
    
    if (isAdmin) {
        userStatus.innerHTML = '👑 Admin';
        btnLogin.style.display = 'none';
        btnLogout.style.display = 'inline-block';
        if (btnReset) btnReset.style.display = 'flex';
        if (btnExport) btnExport.style.display = 'flex';
        if (btnExportFiltered) btnExportFiltered.style.display = 'flex';
    } else {
        userStatus.innerHTML = '👤 Pengguna';
        btnLogin.style.display = 'inline-block';
        btnLogout.style.display = 'none';
        if (btnReset) btnReset.style.display = 'none';
        if (btnExport) btnExport.style.display = 'none';
        if (btnExportFiltered) btnExportFiltered.style.display = 'none';
    }
    renderTabel();
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
        isAdmin = true;
        localStorage.setItem('adminSession', JSON.stringify({ username, timestamp: new Date().toISOString() }));
        updateUI();
        document.getElementById('loginModal').style.display = 'none';
        showAlert('Login berhasil!', 'success');
    } else {
        showAlert('Username atau password salah!', 'error');
    }
}

function handleLogout() {
    if (confirm('Logout?')) {
        isAdmin = false;
        localStorage.removeItem('adminSession');
        updateUI();
        showAlert('Logout berhasil', 'success');
    }
}

// ============================================
// INISIALISASI
// ============================================

function setupEventListeners() {
    document.getElementById('formAbsensi').addEventListener('submit', handleSubmitAbsensi);
    document.getElementById('btnLogin').addEventListener('click', showLoginModal);
    document.getElementById('btnLogout').addEventListener('click', handleLogout);
    document.getElementById('btnResetFilter').addEventListener('click', resetFilters);
    document.getElementById('btnRefresh').addEventListener('click', () => loadDataFromGoogle());
    document.getElementById('btnExport').addEventListener('click', () => exportToExcel(allAbsensiData, 'semua'));
    document.getElementById('btnExportFiltered').addEventListener('click', () => exportToExcel(filteredData, 'filtered'));
    document.getElementById('btnReset').addEventListener('click', () => resetAllData());
    
    // Filter
    ['filterDosen', 'filterKeterangan', 'filterTanggal', 'filterSearch'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'filterSearch') {
                el.addEventListener('input', applyFilters);
            } else {
                el.addEventListener('change', applyFilters);
            }
        }
    });
    
    // Modal close
    const modal = document.getElementById('loginModal');
    const closeBtn = document.querySelector('.close');
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// Start aplikasi
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Aplikasi dimulai...');
    console.log('Google Script URL:', GOOGLE_SCRIPT_URL);
    
    setupEventListeners();
    checkSession();
    document.getElementById('tanggalHariIni').textContent = formatTanggalDisplay();
    await loadDataFromGoogle();
    
    console.log('✅ Aplikasi siap');
});

// Global functions
window.deleteSingleData = deleteSingleData;
