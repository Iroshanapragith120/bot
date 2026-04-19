const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const surprise = require('./commands/surprise');

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
    
    const chatId = surprise.targetNumber + "@c.us";
    const totalMessages = surprise.count;

    console.log(`${surprise.targetNumber} ට මැසේජ් ${totalMessages} ක් යැවීම ආරම්භ කරනවා...`);

    for (let i = 1; i <= totalMessages; i++) {
        try {
            await client.sendMessage(chatId, surprise.message);
            console.log(`මැසේජ් ${i} සාර්ථකයි!`);
            
            // මැසේජ් එකකට වඩා යවනවා නම් විතරක් තත්පර 2ක් නවතිනවා
            if (i < totalMessages) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.log(`දෝෂයක් (${i}):`, error.message);
        }
    }

    console.log("\nවැඩේ ඉවරයි! දැන් ඔබට මෙය වසා දැමිය හැක.");
});

client.initialize();
