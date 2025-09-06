// services/whatsappClient.js
const qrcode = require('qrcode-terminal');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');

let isReady = false;

const client = new Client({
    takeoverOnConflict: true,
    takeoverTimeoutMs: 3000,
    authStrategy: new LocalAuth({
        clientId: 'main-session',
        dataPath: path.join(__dirname, '../.wwebjs_auth') // folder penyimpanan session
    }),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    restartOnAuthFail: true
});

client.on('qr', (qr) => {
    console.log('🔄 Scan QR code berikut untuk login ke WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('loading_screen', (percent, message) => {
    console.log(`⌛ Loading ${percent}% - ${message}`);
});

client.on('authenticated', () => {
    console.log('🔑 Authenticated, sesi tersimpan.');
    isReady = true; // fallback supaya bisa langsung kirim pesan
});


client.on('ready', () => {
    isReady = true;
    console.log('✅ WhatsApp Client siap digunakan!');
});

client.on('auth_failure', (msg) => {
    isReady = false;
    console.error('❌ Gagal autentikasi WhatsApp!', msg);
});

client.on('disconnected', (reason) => {
    isReady = false;
    console.warn('⚠️ WhatsApp terputus:', reason);
    client.initialize(); // coba reconnect
});

client.initialize();

const sendMessage = async (number, message) => {
    if (!isReady) {
        throw new Error('WhatsApp client belum siap. QR belum discan atau koneksi terputus.');
    }
    return await client.sendMessage(number, message);
};

module.exports = { sendMessage };
