// script.js

let allAbsensiData = [];
let filteredData = [];
let isAdmin = false;

// ============== FUNGSI PANGGIL GOOGLE SCRIPT ==============
async function callGoogleScript(action, params = {}) {
    try {
        const url = new URL(GOOGLE_SCRIPT_URL);
        url.searchParams.append('action', action);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        return result;
    } catch (err) {
        console.error(`Error ${action}:`, err);
        return { success: false, error: err.message };
    }
}

// ============== LOAD DATA ==============
async function loadData() {
    showLoading(true);
    const res = await callGoogleScript('getData');
    if (res.success && res.data) {
        allAbsensiData = res.data.map(item => ({
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
        showAlert(`✅ Load ${allAbsensiData.length} data`, 'success');
    } else {
        showAlert('❌ Gagal load data: ' + (res.error || 'Cek URL atau koneksi'), 'error');
        allAbsensiData = [];
    }
    applyFilters();
    showLoading(false);
}

// ============== TAMBAH DATA ==============
async function tambahAbsensi(dataBaru) {
    showLoading(true);
    const res = await callGoogleScript('addData', { data: JSON.stringify(dataBaru) });
    if (res.success) {
        await loadData();
        showAlert('✅ Data tersimpan', 'success');
        return true;
    } else {
        showAlert('❌ Gagal simpan: ' + res.error, 'error');
        showLoading(false);
        return false;
    }
}

// ============== HAPUS DATA ==============
async function hapusAbsensi(id) {
    if (!isAdmin) { showAlert('Hanya admin', 'error'); return; }
    if (!confirm('Hapus data ini?')) return;
    showLoading(true);
    const res = await callGoogleScript('deleteData', { id: id.toString() });
    if (res.success) {
        await loadData();
        showAlert('✅ Data dihapus', 'success');
    } else {
        showAlert('❌ Gagal hapus', 'error');
    }
    showLoading(false);
}

// ============== RESET ALL ==============
async function resetAll() {
    if (!isAdmin) return;
    if (!confirm('⚠️ Hapus SEMUA data?')) return;
    showLoading(true);
    const res = await callGoogleScript('resetData');
    if (res.success) {
        await loadData();
        showAlert('✅ Semua data direset', 'success');
    } else {
        showAlert('❌ Reset gagal', 'error');
    }
    showLoading(false);
}

// ============== CEK DUPLIKAT ==============
async function cekDuplikat(nim, tanggal, dosen) {
    const res = await callGoogleScript('checkDuplicate', { nim, tanggal, dosen });
    return res.success && res.isDuplicate;
}

// ============== FORM SUBMIT ==============
document.getElementById('formAbsensi').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nim = document.getElementById('nim').value.trim();
    const nama = document.getElementById('nama').value.trim();
    const dosen = document.getElementById('dosen').value;
    const keterangan = document.getElementById('keterangan').value;
    const tanggal = new Date().toISOString().slice(0,10);
    
    if (!nim || !nama || !dosen || !keterangan) {
        showAlert('Semua field wajib diisi', 'error');
        return;
    }
    if (await cekDuplikat(nim, tanggal, dosen)) {
        showAlert(`NIM ${nim} sudah absen untuk dosen ini hari ini`, 'error');
        return;
    }
    const dataBaru = {
        nim, nama,
        prodi: PRODI_TETAP,
        mata_kuliah: MATA_KULIAH_TETAP,
        dosen, keterangan,
        waktu: new Date().toLocaleTimeString('id-ID'),
        tanggal,
        tanggal_formatted: new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })
    };
    const ok = await tambahAbsensi(dataBaru);
    if (ok) {
        e.target.reset();
        document.getElementById('dosen').value = '';
    }
});

// ============== FILTER & RENDER ==============
function applyFilters() {
    const fdosen = document.getElementById('filterDosen')?.value || 'all';
    const fket = document.getElementById('filterKeterangan')?.value || 'all';
    const ftgl = document.getElementById('filterTanggal')?.value || '';
    const fcari = document.getElementById('filterSearch')?.value.toLowerCase() || '';
    
    filteredData = allAbsensiData.filter(d => {
        if (fdosen !== 'all' && d.dosen !== fdosen) return false;
        if (fket !== 'all' && d.keterangan !== fket) return false;
        if (ftgl && d.tanggal !== ftgl) return false;
        if (fcari && !d.nim.includes(fcari) && !d.nama.toLowerCase().includes(fcari)) return false;
        return true;
    });
    updateStatistik();
    renderTabel();
}

function renderTabel() {
    const tbody = document.getElementById('tbodyAbsensi');
    if (!filteredData.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">📭 Tidak ada data</td></tr>`;
        return;
    }
    let html = '';
    filteredData.forEach((d,i) => {
        html += `<tr>
            <td>${i+1}</td>
            <td>${d.tanggalFormatted}</td>
            <td>${d.dosen.split(',')[0]}</td>
            <td>${d.nim}</td>
            <td>${d.nama}</td>
            <td>${getBadge(d.keterangan)}</td>
            <td>${d.waktu}</td>
            <td>${isAdmin ? `<button class="btn-delete" onclick="hapusAbsensi(${d.id})">🗑️ Hapus</button>` : '-'}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function updateStatistik() {
    const total = filteredData.length;
    const hadir = filteredData.filter(d => d.keterangan === 'Hadir').length;
    const sakit = filteredData.filter(d => d.keterangan === 'Sakit').length;
    const izin = filteredData.filter(d => d.keterangan === 'Izin').length;
    const alpha = filteredData.filter(d => d.keterangan === 'Alpha').length;
    document.getElementById('totalData').innerText = total;
    document.getElementById('totalHadir').innerText = hadir;
    document.getElementById('totalSakit').innerText = sakit;
    document.getElementById('totalIzin').innerText = izin;
    document.getElementById('totalAlpha').innerText = alpha;
    
    // Statistik per dosen
    const statsDosen = {};
    DAFTAR_DOSEN.forEach(d => statsDosen[d] = { total:0, hadir:0, sakit:0, izin:0, alpha:0 });
    filteredData.forEach(d => {
        if (statsDosen[d.dosen]) {
            statsDosen[d.dosen].total++;
            statsDosen[d.dosen][d.keterangan.toLowerCase()]++;
        }
    });
    const container = document.getElementById('statsPerDosen');
    let html = '<div class="stats-dosen-grid">';
    for (let [dosen, s] of Object.entries(statsDosen)) {
        if (s.total) {
            html += `<div class="dosen-stats-card">
                        <div class="dosen-name">${dosen.split(',')[0]}</div>
                        <div class="dosen-stats-detail">
                            <div><span class="dosen-stat-label">Total</span><span class="dosen-stat-value">${s.total}</span></div>
                            <div><span class="dosen-stat-label">Hadir</span><span class="dosen-stat-value hadir">${s.hadir}</span></div>
                            <div><span class="dosen-stat-label">Sakit</span><span class="dosen-stat-value sakit">${s.sakit}</span></div>
                            <div><span class="dosen-stat-label">Izin</span><span class="dosen-stat-value izin">${s.izin}</span></div>
                            <div><span class="dosen-stat-label">Alpha</span><span class="dosen-stat-value alpha">${s.alpha}</span></div>
                        </div>
                    </div>`;
        }
    }
    html += '</div>';
    container.innerHTML = html;
}

function getBadge(k) {
    const warna = { Hadir:'#43e97b', Sakit:'#f6d365', Izin:'#4facfe', Alpha:'#fa709a' };
    return `<span style="background:${warna[k]};color:white;padding:4px 12px;border-radius:20px;">${k}</span>`;
}

// ============== EXPORT EXCEL ==============
function exportToExcel(data, isFiltered = false) {
    if (!isAdmin) { showAlert('Hanya admin', 'error'); return; }
    if (!data.length) { showAlert('Data kosong', 'error'); return; }
    const sheetData = data.map((d,i) => ({
        No: i+1,
        Tanggal: d.tanggalFormatted,
        Dosen: d.dosen,
        NIM: d.nim,
        Nama: d.nama,
        Prodi: d.prodi,
        MataKuliah: d.mataKuliah,
        Keterangan: d.keterangan,
        Waktu: d.waktu
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
    XLSX.writeFile(wb, `Absensi_${new Date().toISOString().slice(0,10)}${isFiltered ? '_filtered' : ''}.xlsx`);
    showAlert(`✅ Export ${data.length} data`, 'success');
}

// ============== LOGIN ADMIN ==============
function checkSession() {
    const session = localStorage.getItem('adminSession');
    if (session) {
        const data = JSON.parse(session);
        if ((Date.now() - new Date(data.timestamp)) < 24*3600000) isAdmin = true;
    }
    updateUI();
}
function updateUI() {
    document.getElementById('userStatus').innerHTML = isAdmin ? '👑 Admin' : '👤 Pengguna';
    document.getElementById('btnLogin').style.display = isAdmin ? 'none' : 'inline-block';
    document.getElementById('btnLogout').style.display = isAdmin ? 'inline-block' : 'none';
    document.getElementById('btnReset').style.display = isAdmin ? 'flex' : 'none';
    document.getElementById('btnExport').style.display = isAdmin ? 'flex' : 'none';
    document.getElementById('btnExportFiltered').style.display = isAdmin ? 'flex' : 'none';
    renderTabel();
}
function login(e) {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    if (u === 'admin' && p === 'admin123') {
        isAdmin = true;
        localStorage.setItem('adminSession', JSON.stringify({ timestamp: new Date() }));
        updateUI();
        document.getElementById('loginModal').style.display = 'none';
        showAlert('Login sukses', 'success');
    } else {
        showAlert('Username atau password salah', 'error');
    }
}
function logout() {
    isAdmin = false;
    localStorage.removeItem('adminSession');
    updateUI();
    showAlert('Logout', 'success');
}

// ============== UI HELPERS ==============
function showAlert(msg, type) {
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.innerText = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}
function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

// ============== EVENT LISTENERS ==============
document.getElementById('btnLogin').onclick = () => document.getElementById('loginModal').style.display = 'block';
document.querySelector('.close').onclick = () => document.getElementById('loginModal').style.display = 'none';
document.getElementById('loginForm').onsubmit = login;
document.getElementById('btnLogout').onclick = logout;
document.getElementById('btnReset').onclick = resetAll;
document.getElementById('btnExport').onclick = () => exportToExcel(allAbsensiData);
document.getElementById('btnExportFiltered').onclick = () => exportToExcel(filteredData, true);
document.getElementById('btnRefresh').onclick = loadData;
document.getElementById('btnResetFilter').onclick = () => {
    document.getElementById('filterDosen').value = 'all';
    document.getElementById('filterKeterangan').value = 'all';
    document.getElementById('filterTanggal').value = '';
    document.getElementById('filterSearch').value = '';
    applyFilters();
    showAlert('Filter direset', 'success');
};
['filterDosen','filterKeterangan','filterTanggal','filterSearch'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', applyFilters);
    if (id === 'filterSearch') el?.addEventListener('input', applyFilters);
});

// ============== START ==============
document.getElementById('tanggalHariIni').innerText = new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
loadData();
checkSession();

// global functions
window.hapusAbsensi = hapusAbsensi;
