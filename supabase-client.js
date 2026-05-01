// supabase-client.js
// Inisialisasi Supabase Client
const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);

// Test koneksi
async function testConnection() {
    console.log('🔍 Testing koneksi Supabase...');
    console.log('URL:', SUPABASE_CONFIG.url);
    console.log('Key:', SUPABASE_CONFIG.anonKey.substring(0, 20) + '...');
    
    try {
        const { data, error, status } = await supabase
            .from('absensi')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ Connection error:', error);
            console.error('Status:', status);
            return false;
        }
        
        console.log('✅ Koneksi Supabase berhasil!');
        return true;
    } catch (err) {
        console.error('❌ Connection failed:', err);
        return false;
    }
}
