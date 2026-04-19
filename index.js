const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const xeontext3 = require('./xeontext3'); // අලුත් ෆයිල් එක මෙතනට ගන්නවා

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('\n--- QR එක SCAN කරන්න ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('\nBot එක Ready!');
    
    const chatId = "94740769921@c.us"; // මැසේජ් එක යන්න ඕන නම්බර් එක
    const text = xeontext3;           // xeontext3.js එකේ තියෙන පණිවිඩය
    const count = 1;                 // මැසේජ් එක යන්න ඕන වාර ගණන (Default: 1)

    console.log(`${chatId} වෙත මැසේජ් ${count} ක් යැවීම ආරම්භ කරනවා...`);

    for (let i = 1; i <= count; i++) {
        try {
            await client.sendMessage(chatId, text);
            console.log(`මැසේජ් ${i} සාර්ථකයි!`);
            
            // එකකට වඩා යවනවා නම් තත්පර 2 ක විරාමයක් (Safety Delay)
            if (i < count) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.log(`දෝෂයක් (${i}):`, error.message);
        }
    }

    console.log("\nවැඩේ සම්පූර්ණයෙන්ම අවසන්!");
});

client.initialize();
