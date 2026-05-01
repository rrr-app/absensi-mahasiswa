// ============================================
// KONFIGURASI SUPABASE
// GANTI DENGAN CREDENTIALS ANDA DARI SUPABASE!
// ============================================
const SUPABASE_URL = 'https://ezctveawnkzfiuwkqfwj.supabase.co';  // Ganti dengan URL Project Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Y3R2ZWF3bmt6Zml1d2txZndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2Mjk0NjAsImV4cCI6MjA5MzIwNTQ2MH0.Xr-yZoJLAvAp_vWYH1msePEBZJeodRxDMEjK0t-yk_k';  // Ganti dengan Anon Key Anda

// Inisialisasi Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// Daftar Dosen
const DAFTAR_DOSEN = [
    "Ns. Yunita Galih Yudanari, S.Kep.,M.Kep",
    "Ns. Puji Lestari, M.Kes (Epid)",
    "Dr. Ns. Priyanto, M. Kep., Sp. KMB",
    "M. Imron Rosyidi, S.Kep., Ns., M.Kep."
];

// ============================================
// FUNGSI DATABASE SUPABASE
// ============================================

// Load data dari Supabase
async function loadDataFromSupabase() {
    showLoading(true);
    
    try {
        const { data, error } = await supabase
            .from('absensi')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
            allAbsensiData = data.map(item => ({
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
            
            console.log(`Data loaded: ${allAbsensiData.length} records`);
        }
        
        applyFilters();
    } catch (error) {
        console.error('Error loading data:', error);
        showAlert('Gagal memuat data dari server! Periksa koneksi internet Anda.', 'error');
        allAbsensiData = [];
        applyFilters();
    } finally {
        showLoading(false);
    }
}

// Simpan data ke Supabase
async function saveDataToSupabase(absensiBaru) {
    showLoading(true);
    
    try {
        const { data, error } = await supabase
            .from('absensi')
            .insert([
                {
                    nim: absensiBaru.nim,
                    nama: absensiBaru.nama,
                    prodi: absensiBaru.prodi,
                    mata_kuliah: absensiBaru.mataKuliah,
                    dosen: absensiBaru.dosen,
                    keterangan: absensiBaru.keterangan,
                    waktu: absensiBaru.waktu,
                    tanggal: absensiBaru.tanggal,
                    tanggal_formatted: absensiBaru.tanggalFormatted
                }
            ])
            .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
            absensiBaru.id = data[0].id;
            allAbsensiData.unshift(absensiBaru);
            applyFilters();
            showAlert('✅ Data berhasil disimpan ke server!', 'success');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error saving data:', error);
        showAlert('Gagal menyimpan data! Periksa koneksi internet Anda.', 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

// Hapus data dari Supabase
async function deleteDataFromSupabase(id) {
    if (!isAdmin) {
        showAlert('Hanya admin yang dapat menghapus data!', 'error');
        return false;
    }
    
    showLoading(true);
    
    try {
        const { error } = await supabase
            .from('absensi')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        allAbsensiData = allAbsensiData.filter(item => item.id !== id);
        applyFilters();
        showAlert('Data berhasil dihapus!', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting data:', error);
        showAlert('Gagal menghapus data!', 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

// Reset semua data (hapus semua)
async function resetAllDataFromSupabase() {
    if (!isAdmin) {
        showAlert('⚠️ Hanya admin yang dapat mereset data!', 'error');
        return false;
    }
    
    if (allAbsensiData.length === 0) {
        showAlert('Tidak ada data untuk direset', 'error');
        return false;
    }
    
    if (!confirm('⚠️ PERINGATAN: Anda akan menghapus SEMUA data absensi! Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?')) {
        return false;
    }
    
    showLoading(true);
    
    try {
        const { error } = await supabase
            .from('absensi')
            .delete()
            .neq('id', 0); // Hapus semua
        
        if (error) throw error;
        
        allAbsensiData = [];
        applyFilters();
        showAlert('Semua data absensi telah direset!', 'success');
        return true;
    } catch (error) {
        console.error('Error resetting data:', error);
        showAlert('Gagal mereset data!', 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

// Cek duplikasi absensi di database (berdasarkan NIM + Dosen + Tanggal)
async function checkDuplicateAbsensi(nim, dosen, tanggal) {
    try {
        const { data, error } = await supabase
            .from('absensi')
            .select('id')
            .eq('nim', nim)
            .eq('dosen', dosen)
            .eq('tanggal', tanggal)
            .limit(1);
        
        if (error) throw error;
        
        return data && data.length > 0;
    } catch (error) {
        console.error('Error checking duplicate:', error);
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

// Inisialisasi
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    setupFilterListeners();
    checkSession();
    await loadDataFromSupabase(); // Load data dari Supabase
    
    // Tampilkan tanggal
    const tanggalHariIniEl = document.getElementById('tanggalHariIni');
    if (tanggalHariIniEl) {
        tanggalHariIniEl.textContent = formatTanggalDisplay();
    }
    
    // Pastikan modal tersembunyi
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
});

function setupEventListeners() {
    const formAbsensi = document.getElementById('formAbsensi');
    const btnExport = document.getElementById('btnExport');
    const btnExportFiltered = document.getElementById('btnExportFiltered');
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const btnReset = document.getElementById('btnReset');
    const btnResetFilter = document.getElementById('btnResetFilter');
    const btnRefresh = document.getElementById('btnRefresh');
    
    if (formAbsensi) formAbsensi.addEventListener('submit', handleSubmitAbsensi);
    if (btnExport) btnExport.addEventListener('click', () => exportToExcel(allAbsensiData, 'semua'));
    if (btnExportFiltered) btnExportFiltered.addEventListener('click', () => exportToExcel(filteredData, 'filtered'));
    if (btnLogin) btnLogin.addEventListener('click', showLoginModal);
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);
    if (btnReset) btnReset.addEventListener('click', () => resetAllDataFromSupabase());
    if (btnResetFilter) btnResetFilter.addEventListener('click', resetFilters);
    if (btnRefresh) btnRefresh.addEventListener('click', async () => {
        await loadDataFromSupabase();
        showAlert('Data berhasil direfresh!', 'success');
    });
    
    // Modal close events
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

function setupFilterListeners() {
    const filterDosen = document.getElementById('filterDosen');
    const filterKeterangan = document.getElementById('filterKeterangan');
    const filterTanggal = document.getElementById('filterTanggal');
    const filterSearch = document.getElementById('filterSearch');
    
    if (filterDosen) filterDosen.addEventListener('change', applyFilters);
    if (filterKeterangan) filterKeterangan.addEventListener('change', applyFilters);
    if (filterTanggal) filterTanggal.addEventListener('change', applyFilters);
    if (filterSearch) filterSearch.addEventListener('input', applyFilters);
}

function checkSession() {
    const savedSession = localStorage.getItem('adminSession');
    if (savedSession) {
        try {
            const session = JSON.parse(savedSession);
            const sessionTime = new Date(session.timestamp);
            const now = new Date();
            const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                isAdmin = true;
                updateAdminUI();
            } else {
                localStorage.removeItem('adminSession');
                isAdmin = false;
                updateUserUI();
            }
        } catch (e) {
            localStorage.removeItem('adminSession');
            isAdmin = false;
            updateUserUI();
        }
    } else {
        isAdmin = false;
        updateUserUI();
    }
}

function updateAdminUI() {
    const userStatus = document.getElementById('userStatus');
    if (userStatus) {
        userStatus.innerHTML = '👑 Admin';
        userStatus.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        userStatus.style.color = 'white';
    }
    
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const btnReset = document.getElementById('btnReset');
    
    if (btnLogin) btnLogin.style.display = 'none';
    if (btnLogout) btnLogout.style.display = 'inline-block';
    if (btnReset) btnReset.style.display = 'flex';
    
    const btnExport = document.getElementById('btnExport');
    const btnExportFiltered = document.getElementById('btnExportFiltered');
    if (btnExport) btnExport.style.display = 'flex';
    if (btnExportFiltered) btnExportFiltered.style.display = 'flex';
}

function updateUserUI() {
    const userStatus = document.getElementById('userStatus');
    if (userStatus) {
        userStatus.innerHTML = '👤 Pengguna';
        userStatus.style.background = 'white';
        userStatus.style.color = '#667eea';
    }
    
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const btnReset = document.getElementById('btnReset');
    
    if (btnLogin) btnLogin.style.display = 'inline-block';
    if (btnLogout) btnLogout.style.display = 'none';
    if (btnReset) btnReset.style.display = 'none';
    
    const btnExport = document.getElementById('btnExport');
    const btnExportFiltered = document.getElementById('btnExportFiltered');
    if (btnExport) btnExport.style.display = 'none';
    if (btnExportFiltered) btnExportFiltered.style.display = 'none';
}

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
        setTimeout(() => {
            const usernameInput = document.getElementById('username');
            if (usernameInput) usernameInput.focus();
        }, 100);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
        isAdmin = true;
        const session = {
            username: username,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('adminSession', JSON.stringify(session));
        updateAdminUI();
        
        const modal = document.getElementById('loginModal');
        if (modal) modal.style.display = 'none';
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
        
        showAlert('Login berhasil! Selamat datang Admin.', 'success');
        renderTabel();
    } else {
        showAlert('Username atau password salah!', 'error');
        const passwordInput = document.getElementById('password');
        if (passwordInput) passwordInput.value = '';
    }
}

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        isAdmin = false;
        localStorage.removeItem('adminSession');
        updateUserUI();
        showAlert('Anda telah logout dari mode admin.', 'success');
        renderTabel();
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

async function handleSubmitAbsensi(e) {
    e.preventDefault();
    
    const nim = document.getElementById('nim').value.trim();
    const nama = document.getElementById('nama').value.trim();
    const dosen = document.getElementById('dosen').value;
    const keterangan = document.getElementById('keterangan').value;
    const prodi = document.getElementById('prodi_hidden').value;
    const mataKuliah = document.getElementById('mataKuliah_hidden').value;
    const tanggal = getTanggalHariIni();
    
    if (!nim || !nama || !dosen || !keterangan) {
        showAlert('Semua field harus diisi!', 'error');
        return;
    }
    
    if (!/^\d+$/.test(nim)) {
        showAlert('NIM harus berupa angka!', 'error');
        return;
    }
    
    // Cek duplikasi di Supabase
    const isDuplicate = await checkDuplicateAbsensi(nim, dosen, tanggal);
    if (isDuplicate) {
        showAlert(`❌ Mahasiswa dengan NIM ${nim} sudah melakukan absensi untuk dosen ini hari ini!`, 'error');
        return;
    }
    
    const absensiBaru = {
        nim: nim,
        nama: nama,
        prodi: prodi,
        mataKuliah: mataKuliah,
        dosen: dosen,
        keterangan: keterangan,
        waktu: getWaktuSekarang(),
        tanggal: tanggal,
        tanggalFormatted: formatTanggalIndonesia(tanggal)
    };
    
    const success = await saveDataToSupabase(absensiBaru);
    if (success) {
        e.target.reset();
        const nimInput = document.getElementById('nim');
        if (nimInput) nimInput.focus();
    }
}

async function deleteSingleData(id) {
    await deleteDataFromSupabase(id);
}

function applyFilters() {
    const filterDosen = document.getElementById('filterDosen');
    const filterKeterangan = document.getElementById('filterKeterangan');
    const filterTanggal = document.getElementById('filterTanggal');
    const filterSearch = document.getElementById('filterSearch');
    
    const filterDosenValue = filterDosen ? filterDosen.value : 'all';
    const filterKeteranganValue = filterKeterangan ? filterKeterangan.value : 'all';
    const filterTanggalValue = filterTanggal ? filterTanggal.value : '';
    const filterSearchValue = filterSearch ? filterSearch.value.toLowerCase() : '';
    
    filteredData = allAbsensiData.filter(data => {
        let match = true;
        
        if (filterDosenValue !== 'all' && data.dosen !== filterDosenValue) match = false;
        if (filterKeteranganValue !== 'all' && data.keterangan !== filterKeteranganValue) match = false;
        if (filterTanggalValue && data.tanggal !== filterTanggalValue) match = false;
        if (filterSearchValue && !data.nim.includes(filterSearchValue) && !data.nama.toLowerCase().includes(filterSearchValue)) match = false;
        
        return match;
    });
    
    filteredData.sort((a, b) => b.id - a.id);
    
    updateStatistics();
    updateStatisticsPerDosen();
    renderTabel();
}

function resetFilters() {
    const filterDosen = document.getElementById('filterDosen');
    const filterKeterangan = document.getElementById('filterKeterangan');
    const filterTanggal = document.getElementById('filterTanggal');
    const filterSearch = document.getElementById('filterSearch');
    
    if (filterDosen) filterDosen.value = 'all';
    if (filterKeterangan) filterKeterangan.value = 'all';
    if (filterTanggal) filterTanggal.value = '';
    if (filterSearch) filterSearch.value = '';
    
    applyFilters();
    showAlert('Filter telah direset', 'success');
}

function updateStatistics() {
    const total = filteredData.length;
    const hadir = filteredData.filter(a => a.keterangan === 'Hadir').length;
    const sakit = filteredData.filter(a => a.keterangan === 'Sakit').length;
    const izin = filteredData.filter(a => a.keterangan === 'Izin').length;
    const alpha = filteredData.filter(a => a.keterangan === 'Alpha').length;
    
    const totalDataEl = document.getElementById('totalData');
    const totalHadirEl = document.getElementById('totalHadir');
    const totalSakitEl = document.getElementById('totalSakit');
    const totalIzinEl = document.getElementById('totalIzin');
    const totalAlphaEl = document.getElementById('totalAlpha');
    
    if (totalDataEl) totalDataEl.textContent = total;
    if (totalHadirEl) totalHadirEl.textContent = hadir;
    if (totalSakitEl) totalSakitEl.textContent = sakit;
    if (totalIzinEl) totalIzinEl.textContent = izin;
    if (totalAlphaEl) totalAlphaEl.textContent = alpha;
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
                    <div class="dosen-name">${dosen}</div>
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
        tbody.innerHTML = `<tr class="empty-row">
            <td colspan="10">
                <div class="empty-state">
                    <span class="empty-icon">📭</span>
                    <p>Tidak ada data absensi</p>
                    <small style="color: #999;">Silakan isi absensi di atas</small>
                </div>
            <tr>
        </tr>`;
        return;
    }
    
    let html = '';
    filteredData.forEach((absen, index) => {
        const dosenShort = absen.dosen.split(',')[0];
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${absen.tanggalFormatted || formatTanggalIndonesia(absen.tanggal)}</td>
                <td title="${absen.dosen}">${dosenShort}</td>
                <td>${absen.nim}</td>
                <td>${absen.nama}</td>
                <td>${absen.prodi}</td>
                <td>${absen.mataKuliah}</td>
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
        'Hadir': '<span style="background: linear-gradient(135deg, #43e97b, #38f9d7); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">✅ Hadir</span>',
        'Sakit': '<span style="background: linear-gradient(135deg, #f6d365, #fda085); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">🤒 Sakit</span>',
        'Izin': '<span style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">📋 Izin</span>',
        'Alpha': '<span style="background: linear-gradient(135deg, #fa709a, #fee140); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">❌ Alpha</span>'
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
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}

function exportToExcel(data, type) {
    if (!isAdmin) {
        showAlert('⚠️ Fitur export hanya dapat digunakan oleh admin! Silakan login sebagai admin terlebih dahulu.', 'error');
        return;
    }
    
    if (data.length === 0) {
        showAlert('Tidak ada data untuk diexport', 'error');
        return;
    }
    
    try {
        const excelData = data.map((absen, index) => ({
            'No': index + 1,
            'Tanggal': absen.tanggalFormatted || formatTanggalIndonesia(absen.tanggal),
            'Dosen': absen.dosen,
            'NIM': absen.nim,
            'Nama Lengkap': absen.nama,
            'Program Studi': absen.prodi,
            'Mata Kuliah': absen.mataKuliah,
            'Keterangan': absen.keterangan,
            'Waktu Absensi': absen.waktu
        }));
        
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
        XLSX.writeFile(wb, `Absensi_${getTanggalHariIni()}.xlsx`);
        
        showAlert(`✅ Berhasil export ${data.length} data ke Excel`, 'success');
    } catch (error) {
        showAlert('Terjadi kesalahan saat export data', 'error');
        console.error('Export error:', error);
    }
}

// Global functions
window.deleteSingleData = deleteSingleData;
