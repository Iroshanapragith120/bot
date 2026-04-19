const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cha = require('./cha'); // cha.js එකෙන් මැසේජ් එක ගන්නවා
const readline = require('readline');

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

    // මැසේජ් යැවීමේ ක්‍රියාවලිය දිගටම කරගෙන යාමට loop එකක් පාවිච්චි කරමු
    while (true) {
        let targetInput = await askQuestion('\ntargetNumber (නතර කිරීමට "exit" ලෙස ටයිප් කරන්න): ');
        
        // "exit" කියලා ගැහුවොත් ලූප් එකෙන් අයින් වෙනවා
        if (targetInput.toLowerCase() === 'exit') {
            console.log("Bot එක නවත්වනවා. සුබ දවසක්!");
            process.exit();
        }

        let countInput = await askQuestion('count (වාර ගණන): ');

        const chatId = targetInput.includes('@c.us') ? targetInput : `${targetInput}@c.us`;
        const count = parseInt(countInput) || 1;
        const text = cha; // cha.js එකේ තියෙන මැසේජ් එක

        console.log(`\n${targetInput} වෙත මැසේජ් ${count} ක් යැවීම ආරම්භ කරනවා...`);

        for (let i = 1; i <= count; i++) {
            try {
                await client.sendMessage(chatId, text);
                console.log(`මැසේජ් ${i} සාර්ථකයි!`);
                
                if (i < count) {
                    // තත්පර 2ක පරතරයක් (WhatsApp Block නොවීමට)
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error) {
                console.log(`දෝෂයක් (${i}):`, error.message);
            }
        }

        console.log("\nමැසේජ් යැවීම අවසන්!");
        console.log("----------------------------");
        // මෙතනින් පස්සේ ආයෙත් මුලට ගිහින් targetNumber එක අහනවා.
    }
});

client.initialize();
