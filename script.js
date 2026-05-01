// script.js

// Konfigurasi Admin
const ADMIN_CONFIG = {
    username: 'admin',
    password: 'admin123'
};

// State
let allAbsensiData = [];
let filteredData = [];
let isAdmin = false;
let isLoading = false;

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
        console.log(`📡 Calling Google Script: ${action}`);
        
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
            console.log(`✅ Loaded ${allAbsensiData.length} records from Google Sheets`);
        } else {
            console.error('Load failed:', result.error);
            allAbsensiData = [];
        }
        
        applyFilters();
    } catch (error) {
        console.error('Error loading data:', error);
        showAlert('Gagal memuat data dari server! Periksa koneksi internet.', 'error');
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
            await loadDataFromGoogle();
            showAlert('✅ Data berhasil disimpan ke cloud!', 'success');
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
async function deleteDataFromGoogle(id) {
    if (!isAdmin) {
        showAlert('Hanya admin yang dapat menghapus data!', 'error');
        return false;
    }
    
    showLoading(true);
    
    try {
        const result = await callGoogleScript('deleteData', {
            id: id
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
    
    if (allAbsensiData.length === 0) {
        showAlert('Tidak ada data untuk direset', 'error');
        return;
    }
    
    if (!confirm('⚠️ PERINGATAN: Anda akan menghapus SEMUA data absensi! Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?')) {
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
        showAlert(`❌ Mahasiswa dengan NIM ${nim} sudah melakukan absensi untuk dosen ini hari ini!`, 'error');
        return;
    }
    
    // Siapkan data
    const absensiData = {
        nim: nim,
        nama: nama,
        prodi: PRODI_TETAP,
        mata_kuliah: MATA_KULIAH_TETAP,
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
        document.getElementById('dosen').value = '';
    }
}

// Delete data
async function deleteSingleData(id) {
    await deleteDataFromGoogle(id);
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
    showAlert('Filter telah direset', 'success');
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
                        <div class="dosen-stat-item">
                            <span class="dosen-stat-label">Total</span>
                            <span class="dosen-stat-value">${stats.total}</span>
                        </div>
                        <div class="dosen-stat-item">
                            <span class="dosen-stat-label">Hadir</span>
                            <span class="dosen-stat-value hadir">${stats.hadir}</span>
                        </div>
                        <div class="dosen-stat-item">
                            <span class="dosen-stat-label">Sakit</span>
                            <span class="dosen-stat-value sakit">${stats.sakit}</span>
                        </div>
                        <div class="dosen-stat-item">
                            <span class="dosen-stat-label">Izin</span>
                            <span class="dosen-stat-value izin">${stats.izin}</span>
                        </div>
                        <div class="dosen-stat-item">
                            <span class="dosen-stat-label">Alpha</span>
                            <span class="dosen-stat-value alpha">${stats.alpha}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    if (html === '<div class="stats-dosen-grid">') {
        html += '<div class="empty-state" style="grid-column: 1/-1; padding: 20px;"><p>Tidak ada data untuk ditampilkan</p></div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function renderTabel() {
    const tbody = document.getElementById('tbodyAbsensi');
    if (!tbody) return;
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><span class="empty-icon">📭</span><p>Tidak ada data absensi</p><small style="color: #999;">Silakan isi absensi di atas</small></div></td></tr>`;
        return;
    }
    
    let html = '';
    filteredData.forEach((absen, index) => {
        const dosenShort = absen.dosen.split(',')[0];
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${absen.tanggalFormatted}</td>
                <td title="${absen.dosen}">${dosenShort}</td>
                <td>${absen.nim}</td>
                <td>${absen.nama}</td>
                <td>${getBadgeKeterangan(absen.keterangan)}</td>
                <td>${absen.waktu}</td>
                <td>${getActionButtons(absen)}</td>
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

function getActionButtons(absen) {
    if (isAdmin) {
        return `<button class="btn-delete" onclick="deleteSingleData(${absen.id})">🗑️ Hapus</button>`;
    }
    return '-';
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
        showAlert('⚠️ Fitur export hanya dapat digunakan oleh admin!', 'error');
        return;
    }
    
    if (data.length === 0) {
        showAlert('Tidak ada data untuk diexport', 'error');
        return;
    }
    
    try {
        const excelData = data.map((absen, index) => ({
            'No': index + 1,
            'Tanggal': absen.tanggalFormatted,
            'Dosen': absen.dosen,
            'NIM': absen.nim,
            'Nama Lengkap': absen.nama,
            'Program Studi': absen.prodi,
            'Mata Kuliah': absen.mataKuliah,
            'Keterangan': absen.keterangan,
            'Waktu Absensi': absen.waktu
        }));
        
        const ws = XLSX.utils.json_to_sheet(excelData);
        ws['!cols'] = [
            {wch:5}, {wch:15}, {wch:35}, {wch:15}, {wch:25}, {wch:20}, {wch:20}, {wch:12}, {wch:12}
        ];
        
        const wb = XLSX.utils.book_new();
        const sheetName = type === 'semua' ? 'Semua_Data_Absensi' : 'Hasil_Filter_Absensi';
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        const fileName = `Absensi_${getTanggalHariIni()}${type === 'filtered' ? '_filtered' : ''}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showAlert(`✅ Berhasil export ${data.length} data ke Excel`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showAlert('Terjadi kesalahan saat export data', 'error');
    }
}

// ============================================
// LOGIN ADMIN
// ============================================

function checkSession() {
    const savedSession = localStorage.getItem('adminSession');
    if (savedSession) {
        try {
            const session = JSON.parse(savedSession);
            const hoursDiff = (new Date() - new Date(session.timestamp)) / (1000 * 60 * 60);
            if (hoursDiff < 24) {
                isAdmin = true;
            } else {
                localStorage.removeItem('adminSession');
                isAdmin = false;
            }
        } catch (e) {
            localStorage.removeItem('adminSession');
            isAdmin = false;
        }
    } else {
        isAdmin = false;
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
        if (userStatus) {
            userStatus.innerHTML = '👑 Admin';
            userStatus.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            userStatus.style.color = 'white';
        }
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'inline-block';
        if (btnReset) btnReset.style.display = 'flex';
        if (btnExport) btnExport.style.display = 'flex';
        if (btnExportFiltered) btnExportFiltered.style.display = 'flex';
    } else {
        if (userStatus) {
            userStatus.innerHTML = '👤 Pengguna';
            userStatus.style.background = 'white';
            userStatus.style.color = '#667eea';
        }
        if (btnLogin) btnLogin.style.display = 'inline-block';
        if (btnLogout) btnLogout.style.display = 'none';
        if (btnReset) btnReset.style.display = 'none';
        if (btnExport) btnExport.style.display = 'none';
        if (btnExportFiltered) btnExportFiltered.style.display = 'none';
    }
    renderTabel();
}

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('loginForm').reset();
        setTimeout(() => {
            document.getElementById('username').focus();
        }, 100);
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
        isAdmin = true;
        localStorage.setItem('adminSession', JSON.stringify({
            username: username,
            timestamp: new Date().toISOString()
        }));
        updateUI();
        document.getElementById('loginModal').style.display = 'none';
        showAlert('Login berhasil! Selamat datang Admin.', 'success');
    } else {
        showAlert('Username atau password salah!', 'error');
        document.getElementById('password').value = '';
    }
}

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        isAdmin = false;
        localStorage.removeItem('adminSession');
        updateUI();
        showAlert('Anda telah logout dari mode admin.', 'success');
    }
}

// ============================================
// INISIALISASI
// ============================================

function setupEventListeners() {
    const formAbsensi = document.getElementById('formAbsensi');
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const btnResetFilter = document.getElementById('btnResetFilter');
    const btnRefresh = document.getElementById('btnRefresh');
    const btnExport = document.getElementById('btnExport');
    const btnExportFiltered = document.getElementById('btnExportFiltered');
    const btnReset = document.getElementById('btnReset');
    
    if (formAbsensi) formAbsensi.addEventListener('submit', handleSubmitAbsensi);
    if (btnLogin) btnLogin.addEventListener('click', showLoginModal);
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);
    if (btnResetFilter) btnResetFilter.addEventListener('click', resetFilters);
    if (btnRefresh) btnRefresh.addEventListener('click', () => {
        loadDataFromGoogle();
        showAlert('Data berhasil direfresh!', 'success');
    });
    if (btnExport) btnExport.addEventListener('click', () => exportToExcel(allAbsensiData, 'semua'));
    if (btnExportFiltered) btnExportFiltered.addEventListener('click', () => exportToExcel(filteredData, 'filtered'));
    if (btnReset) btnReset.addEventListener('click', resetAllData);
    
    // Filter
    const filterDosen = document.getElementById('filterDosen');
    const filterKeterangan = document.getElementById('filterKeterangan');
    const filterTanggal = document.getElementById('filterTanggal');
    const filterSearch = document.getElementById('filterSearch');
    
    if (filterDosen) filterDosen.addEventListener('change', applyFilters);
    if (filterKeterangan) filterKeterangan.addEventListener('change', applyFilters);
    if (filterTanggal) filterTanggal.addEventListener('change', applyFilters);
    if (filterSearch) filterSearch.addEventListener('input', applyFilters);
    
    // Modal close
    const modal = document.getElementById('loginModal');
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.onclick = () => {
            if (modal) modal.style.display = 'none';
        };
    }
    window.onclick = (event) => {
        if (event.target === modal) {
            if (modal) modal.style.display = 'none';
        }
    };
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
}

// Start aplikasi
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Aplikasi dimulai...');
    
    setupEventListeners();
    checkSession();
    
    const tanggalHariIniEl = document.getElementById('tanggalHariIni');
    if (tanggalHariIniEl) {
        tanggalHariIniEl.textContent = formatTanggalDisplay();
    }
    
    await loadDataFromGoogle();
    console.log('✅ Aplikasi siap digunakan');
});

// Global functions
window.deleteSingleData = deleteSingleData;
