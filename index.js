const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const config = require('./config');
const { handleMainMenu } = require('./mainmenu/mainLogic');
const { handleMessageSend } = require('./sendmessage/msgLogic');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// Global Owners List
global.owners = [`${config.OWNER_NUMBER}@c.us` || '94741433513@c.us']; 
let userStates = {};

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './setting' }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('ready', () => {
    console.log('\n✅ බොට් සාර්ථකව සම්බන්ධ වුණා!');
});

client.on('message_create', async (msg) => {
    try {
        // ❌ වැදගත්ම Fix එක: බොට් තමන් විසින්ම යවන මැසේජ් logic එකට ගන්න එපා
        if (msg.fromMe) return; 

        const chatID = msg.from;
        const text = msg.body.trim();
        const sender = msg.from;

        // Owner Check
        const isOwner = global.owners.includes(sender);
        if (!isOwner) return;

        // Command: .addowner
        if (text.startsWith('.addowner')) {
            let num = text.split(' ')[1]?.replace(/[+-\s]/g, '');
            let newOwner = num ? `${num}@c.us` : null;
            if (newOwner && !global.owners.includes(newOwner)) {
                global.owners.push(newOwner);
                await client.sendMessage(chatID, `✅ @${num} දැන් Owner කෙනෙක්!`, { mentions: [newOwner] });
            }
            return;
        }

        // Command: .menu
        if (text.toLowerCase() === '.menu' || text.toLowerCase() === 'menu') {
            await handleMainMenu(client, chatID, userStates);
            return;
        }

        // Logic handling (අනිත් මෙනු වල ක්‍රියාකාරිත්වය)
        if (userStates[chatID]) {
            await handleMessageSend(client, chatID, text, userStates);
        }

    } catch (e) { console.error(e); }
});

// START LOGIC (QR or Pairing)
async function startBot() {
    console.log("\n--- 🤖 BOT SETUP ---");
    const choice = await askQuestion('1. QR Code\n2. Pairing Code\nතේරීම: ');

    if (choice === '2') {
        const phoneNumber = await askQuestion('\nනම්බර් එක (947xxxxxxxx): ');
        client.initialize();
        client.on('qr', () => {}); 
        setTimeout(async () => {
            try {
                console.log("🔑 පයිරින් කෝඩ් එක ඉල්ලමින් පවතී...");
                const code = await client.requestPairingCode(phoneNumber.replace(/\s/g, ''));
                console.log(`\n🔥 Pairing Code: ${code}\n`);
            } catch (err) { console.log("❌ Pairing Error."); }
        }, 5000);
    } else {
        client.on('qr', (qr) => {
            qrcode.generate(qr, { small: true });
            console.log('✅ QR එක ස්කෑන් කරන්න.');
        });
        client.initialize();
    }
}

startBot();
