// services/whatsappClient.js
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');

let isReady = false;

const client = new Client({
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
});

client.on('qr', (qr) => {
    console.log('🔄 Scan QR code berikut untuk login ke WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    isReady = true;
    console.log('✅ WhatsApp Client siap digunakan!');
});

client.on('auth_failure', () => {
    isReady = false;
    console.error('❌ Gagal autentikasi WhatsApp! Coba ulang scan QR.');
});

client.on('disconnected', (reason) => {
    isReady = false;
    console.warn('⚠️ WhatsApp terputus:', reason);
});

client.initialize();

const sendMessage = async (number, message) => {
    if (!isReady) {
        throw new Error('WhatsApp client belum siap. QR belum discan atau koneksi terputus.');
    }
    return await client.sendMessage(number, message);
};

module.exports = { sendMessage };
