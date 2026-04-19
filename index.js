const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cha = require('./cha'); // විස්තරය තියෙන ෆයිල් එක
const readline = require('readline');
const path = require('path'); // ෆයිල් එක තියෙන තැන හොයාගන්න

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
    console.log('\nBot එක Ready! (Memory Mode ❤️)');
    console.log('------------------------------------------');

    while (true) {
        let targetInput = await askQuestion('\ntargetNumber (නැවත්වීමට "exit"): ');
        if (targetInput.toLowerCase() === 'exit') process.exit(0);

        let countInput = await askQuestion('count: ');
        const count = parseInt(countInput) || 1;
        const chatId = targetInput.includes('@c.us') ? targetInput : `${targetInput}@c.us`;

        console.log(`\nමැසේජ් යැවීම ආරම්භ කළා...`);

        try {
            // --- මෙතන 'memory.jpg' වෙනුවට ඔයාගේ පින්තූරයේ නම හරියටම දෙන්න ---
            const imagePath = path.join(__dirname, 'memory.jpg');
            const media = MessageMedia.fromFilePath(imagePath);

            for (let i = 1; i <= count; i++) {
                await client.sendMessage(chatId, media, { caption: cha });
                console.log(`මතකය යැවුවා (${i}) - සාර්ථකයි!`);
                
                if (i < count) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            console.log("\nමෙම නම්බර් එකට යැවීම අවසන්.");
        } catch (error) {
            console.log(`Error: පින්තූරය සොයාගත නොහැක! memory.jpg ෆයිල් එක ෆෝල්ඩර් එකේ තියෙනවද බලන්න.`);
        }
        
        console.log("------------------------------------------");
    }
});

client.initialize();
