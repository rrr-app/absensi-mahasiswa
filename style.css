// Konfigurasi Admin
const ADMIN_CONFIG = {
    username: 'admin',
    password: 'admin123'
};

// State
let allAbsensiData = [];
let filteredData = [];
let isAdmin = false;

// Daftar Dosen
const DAFTAR_DOSEN = [
    "Prof. Dr. Ahmad Suhendra, M.Kom",
    "Dr. Rina Fitriana, S.Si., M.T",
    "Ir. Budi Santoso, M.MSI",
    "Dian Puspita Sari, S.Kom., M.Cs",
    "Dr. Eng. Hendra Gunawan, S.T., M.T"
];

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    checkSession(); // Hanya cek session, TIDAK membuka modal otomatis
    setupEventListeners();
    setupFilterListeners();
});

function setupEventListeners() {
    document.getElementById('formAbsensi').addEventListener('submit', handleSubmitAbsensi);
    document.getElementById('btnExport').addEventListener('click', () => exportToExcel(allAbsensiData, 'semua'));
    document.getElementById('btnExportFiltered').addEventListener('click', () => exportToExcel(filteredData, 'filtered'));
    document.getElementById('btnLogin').addEventListener('click', showLoginModal); // Modal hanya terbuka saat tombol ditekan
    document.getElementById('btnLogout').addEventListener('click', handleLogout);
    document.getElementById('btnReset').addEventListener('click', resetAllData);
    document.getElementById('btnResetFilter').addEventListener('click', resetFilters);
    
    const modal = document.getElementById('loginModal');
    const closeBtn = document.getElementsByClassName('close')[0];
    
    // Hanya set close button, tidak membuka modal otomatis
    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
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
    // Hanya cek session, TIDAK membuka modal otomatis
    const savedSession = localStorage.getItem('adminSession');
    if (savedSession) {
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
    } else {
        isAdmin = false;
        updateUserUI();
    }
    updateUIByRole();
}

function updateAdminUI() {
    // Update UI Admin (Desktop)
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
    
    // Tampilkan tombol export untuk admin
    const exportButtons = document.querySelectorAll('.btn-export, .btn-export-filtered');
    exportButtons.forEach(btn => {
        btn.style.display = 'flex';
    });
}

function updateUserUI() {
    // Update UI User (Desktop)
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
    
    // Sembunyikan tombol export untuk non-admin
    const exportButtons = document.querySelectorAll('.btn-export, .btn-export-filtered');
    exportButtons.forEach(btn => {
        btn.style.display = 'none';
    });
}

function updateUIByRole() {
    if (isAdmin) {
        updateAdminUI();
    } else {
        updateUserUI();
    }
}

function showLoginModal() {
    // Modal hanya terbuka saat tombol login ditekan
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
        // Reset form
        document.getElementById('loginForm').reset();
        // Focus ke username
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
        const session = {
            username: username,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('adminSession', JSON.stringify(session));
        updateAdminUI();
        
        // Tutup modal
        const modal = document.getElementById('loginModal');
        if (modal) modal.style.display = 'none';
        
        // Reset form
        document.getElementById('loginForm').reset();
        
        showAlert('Login berhasil! Selamat datang Admin.', 'success');
        
        // Refresh tampilan data (menampilkan tombol hapus)
        renderTabel();
        renderCardView(); // Jika menggunakan card view
    } else {
        showAlert('Username atau password salah!', 'error');
        document.getElementById('password').value = '';
    }
}

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        isAdmin = false;
        localStorage.removeItem('adminSession');
        updateUserUI();
        showAlert('Anda telah logout dari mode admin.', 'success');
        
        // Refresh tampilan data (menyembunyikan tombol hapus)
        renderTabel();
        renderCardView(); // Jika menggunakan card view
    }
}

// Fungsi lainnya tetap sama seperti sebelumnya
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

function loadData() {
    const storedData = localStorage.getItem('absensi_permanen_dosen');
    
    if (storedData) {
        allAbsensiData = JSON.parse(storedData);
    } else {
        allAbsensiData = [];
    }
    
    applyFilters();
}

function saveData() {
    localStorage.setItem('absensi_permanen_dosen', JSON.stringify(allAbsensiData));
}

function isNimAlreadyAbsentTodayForDosen(nim, dosen, tanggal) {
    return allAbsensiData.some(absen => 
        absen.nim === nim && 
        absen.tanggal === tanggal && 
        absen.dosen === dosen
    );
}

function handleSubmitAbsensi(e) {
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
    
    if (isNimAlreadyAbsentTodayForDosen(nim, dosen, tanggal)) {
        showAlert(`❌ Mahasiswa dengan NIM ${nim} sudah melakukan absensi untuk dosen ${dosen} hari ini!`, 'error');
        return;
    }
    
    const absensiBaru = {
        id: Date.now(),
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
    
    allAbsensiData.push(absensiBaru);
    saveData();
    applyFilters();
    showAlert(`✅ Absensi berhasil untuk ${nama} (${nim}) - Dosen: ${dosen.split(',')[0]}`, 'success');
    
    e.target.reset();
    document.getElementById('nim').focus();
}

function deleteSingleData(id) {
    if (!isAdmin) {
        showAlert('Hanya admin yang dapat menghapus data!', 'error');
        return;
    }
    
    if (confirm('Apakah Anda yakin ingin menghapus data absensi ini?')) {
        const dataToDelete = allAbsensiData.find(item => item.id === id);
        allAbsensiData = allAbsensiData.filter(item => item.id !== id);
        saveData();
        applyFilters();
        showAlert(`Data absensi ${dataToDelete.nama} berhasil dihapus`, 'success');
    }
}

function resetAllData() {
    if (!isAdmin) {
        showAlert('⚠️ Hanya admin yang dapat mereset data! Silakan login sebagai admin.', 'error');
        return;
    }
    
    if (allAbsensiData.length === 0) {
        showAlert('Tidak ada data untuk direset', 'error');
        return;
    }
    
    if (confirm('⚠️ PERINGATAN: Anda akan menghapus SEMUA data absensi! Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?')) {
        allAbsensiData = [];
        saveData();
        applyFilters();
        showAlert('Semua data absensi telah direset', 'success');
    }
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
        
        if (filterDosenValue !== 'all' && data.dosen !== filterDosenValue) {
            match = false;
        }
        
        if (filterKeteranganValue !== 'all' && data.keterangan !== filterKeteranganValue) {
            match = false;
        }
        
        if (filterTanggalValue && data.tanggal !== filterTanggalValue) {
            match = false;
        }
        
        if (filterSearchValue && !data.nim.includes(filterSearchValue) && !data.nama.toLowerCase().includes(filterSearchValue)) {
            match = false;
        }
        
        return match;
    });
    
    // Urutkan berdasarkan tanggal terbaru
    filteredData.sort((a, b) => b.id - a.id);
    
    updateStatistics();
    updateStatisticsPerDosen();
    renderTabel();
    renderCardView(); // Jika menggunakan card view
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
    
    // Inisialisasi statistik untuk setiap dosen
    DAFTAR_DOSEN.forEach(dosen => {
        statsPerDosen[dosen] = {
            total: 0,
            hadir: 0,
            sakit: 0,
            izin: 0,
            alpha: 0
        };
    });
    
    // Hitung statistik berdasarkan data yang ditampilkan (filtered)
    filteredData.forEach(data => {
        if (statsPerDosen[data.dosen]) {
            statsPerDosen[data.dosen].total++;
            statsPerDosen[data.dosen][data.keterangan.toLowerCase()]++;
        }
    });
    
    // Render statistik per dosen
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
            <td colspan="9">
                <div class="empty-state">
                    <span class="empty-icon">📭</span>
                    <p>Tidak ada data absensi</p>
                    <small style="color: #999;">Coba ubah filter atau tambah data baru</small>
                </div>
            </td>
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

function renderCardView() {
    const container = document.getElementById('cardView');
    if (!container) return;
    
    if (filteredData.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <span class="empty-icon">📭</span>
            <p>Tidak ada data absensi</p>
            <small style="color: #999;">Coba ubah filter atau tambah data baru</small>
        </div>`;
        return;
    }
    
    let html = '';
    filteredData.forEach((absen, index) => {
        const dosenShort = absen.dosen.split(',')[0];
        html += `
            <div class="absensi-card">
                <div class="absensi-card-header">
                    <span class="absensi-nim">#${absen.nim}</span>
                    <span class="absensi-tanggal">${absen.tanggalFormatted}</span>
                </div>
                <div class="absensi-nama">${absen.nama}</div>
                <div class="absensi-detail">
                    <div class="detail-item">
                        <span class="detail-label">Dosen</span>
                        <span>${dosenShort}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status</span>
                        <span>${getBadgeKeteranganSimple(absen.keterangan)}</span>
                    </div>
                </div>
                <div class="absensi-footer">
                    <span class="absensi-waktu">${absen.waktu}</span>
                    ${getActionButtonsMobile(absen)}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
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

function getBadgeKeteranganSimple(keterangan) {
    const badges = {
        'Hadir': '✅ Hadir',
        'Sakit': '🤒 Sakit',
        'Izin': '📋 Izin',
        'Alpha': '❌ Alpha'
    };
    return badges[keterangan] || keterangan;
}

function getActionButtons(absen) {
    if (isAdmin) {
        return `<button class="btn-delete" onclick="deleteSingleData(${absen.id})">🗑️ Hapus</button>`;
    }
    return '-';
}

function getActionButtonsMobile(absen) {
    if (isAdmin) {
        return `<button class="btn-delete-card" onclick="deleteSingleData(${absen.id})">🗑️ Hapus</button>`;
    }
    return '-';
}

function showAlert(message, type) {
    // Hapus alert yang sudah ada
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

function exportToExcel(data, type) {
    // Cek apakah user adalah admin
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
        ws['!cols'] = [
            {wch:5}, {wch:15}, {wch:35}, {wch:15}, {wch:25}, 
            {wch:20}, {wch:20}, {wch:12}, {wch:12}
        ];
        
        const wb = XLSX.utils.book_new();
        const sheetName = type === 'semua' ? 'Semua_Data_Absensi' : 'Hasil_Filter_Absensi';
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        const fileName = `Absensi_${getTanggalHariIni()}${type === 'filtered' ? '_filtered' : ''}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showAlert(`✅ Berhasil export ${data.length} data ke Excel`, 'success');
    } catch (error) {
        showAlert('Terjadi kesalahan saat export data', 'error');
        console.error('Export error:', error);
    }
}

// Tampilkan tanggal
const tanggalHariIniEl = document.getElementById('tanggalHariIni');
if (tanggalHariIniEl) {
    tanggalHariIniEl.textContent = formatTanggalDisplay();
}

// Export functions ke global scope
window.deleteSingleData = deleteSingleData;
