// config.js
// ============================================
// KONFIGURASI SUPABASE - GANTI DENGAN MILIK ANDA!
// ============================================
const SUPABASE_CONFIG = {
    url: 'https://ezctveawnkzfiuwkqfwj.supabase.co',  // GANTI INI!
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Y3R2ZWF3bmt6Zml1d2txZndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2Mjk0NjAsImV4cCI6MjA5MzIwNTQ2MH0.Xr-yZoJLAvAp_vWYH1msePEBZJeodRxDMEjK0t-yk_k'  // GANTI INI!
};

// Cek apakah config sudah diisi
if (SUPABASE_CONFIG.url.includes('YOUR_PROJECT_ID')) {
    console.error('❌ ERROR: Silakan ganti SUPABASE_CONFIG dengan credentials Anda!');
    alert('⚠️ Konfigurasi Supabase belum diisi!\n\nBuka file config.js dan ganti:\n1. SUPABASE_CONFIG.url\n2. SUPABASE_CONFIG.anonKey\n\nDapatkan dari https://supabase.com > Project Settings > API');
}
