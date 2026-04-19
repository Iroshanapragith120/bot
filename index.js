const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const xeontext3 = require('./xeontext3');
const readline = require('readline');

// ටර්මිනල් එකෙන් දත්ත ලබා ගන්න interface එකක් හදමු
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

client.on('qr', (qr) => {
    console.log('\n--- QR එක SCAN කරන්න ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('\nBot එක Ready!');
    console.log('----------------------------');

    // ටර්මිනල් එකේදී විස්තර අහනවා
    let targetInput = await askQuestion('targetNumber (උදා: 94740769921): ');
    let countInput = await askQuestion('count (යවන්න ඕන වාර ගණන): ');

    const chatId = targetInput.includes('@c.us') ? targetInput : `${targetInput}@c.us`;
    const count = parseInt(countInput) || 1;
    const text = xeontexjst9.;

    console.log(`\n${targetInput} වෙත මැසේජ් ${count} ක් යැවීම ආරම්භ කරනවා...`);

    for (let i = 1; i <= count; i++) {
        try {
            await client.sendMessage(chatId, text);
            console.log(`මැසේජ් ${i} සාර්ථකව යැවුවා!`);
            
            if (i < count) {
                // තත්පර 2ක පරතරයක් (Safety Delay)
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.log(`දෝෂයක් (${i}):`, error.message);
        }
    }

    console.log("\nවැඩේ අවසන්! Bot එක නවත්වන්න Ctrl+C ඔබන්න.");
});

client.initialize();
