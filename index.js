const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const config = require('./config');

// ලොජික් ෆයිල් ලින්ක් කිරීම
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

client.on('qr', (qr) => {
    console.log('\n✅ QR Code ලැබුණා:');
    qrcode.generate(qr, { small: true });
});

client.on('message_create', async (msg) => {
    try {
        // බොට් තමන්ටම රිප්ලයි කරගැනීම වැළැක්වීම
        if (msg.fromMe && !msg.body.startsWith('.')) return;

        const chatID = msg.to === client.info.wid._serialized ? msg.from : msg.to;
        const text = msg.body.trim();
        const sender = msg.from;

        const isOwner = global.owners.includes(sender) || msg.fromMe;
        if (!isOwner) return;

        // Menu Command
        if (text.toLowerCase() === '.menu' || text.toLowerCase() === 'menu') {
            await handleMainMenu(client, chatID, userStates);
            return;
        }

        // Add Owner
        if (text.startsWith('.addowner')) {
            let num = text.split(' ')[1]?.replace(/[+-\s]/g, '');
            if (num) {
                let newOwner = `${num}@c.us`;
                if (!global.owners.includes(newOwner)) {
                    global.owners.push(newOwner);
                    await client.sendMessage(chatID, `✅ @${num} දැන් Owner!`, { mentions: [newOwner] });
                }
            }
            return;
        }

        // Logic Handling
        if (userStates[chatID]) {
            await handleMessageSend(client, chatID, text, userStates);
        }

    } catch (e) {
        console.error(e);
    }
});

async function startBot() {
    console.log("\n--- 🤖 BOT SETUP ---");
    console.log("1. QR Code\n2. Pairing Code");
    const choice = await askQuestion('\nතේරීම: ');

    if (choice === '2') {
        const phoneNumber = await askQuestion('\nනම්බර් එක (947xxxxxxxx): ');
        client.initialize();
        setTimeout(async () => {
            try {
                console.log("🔑 පයිරින් කෝඩ් එක ඉල්ලමින් පවතී...");
                const code = await client.requestPairingCode(phoneNumber.replace(/[+-\s]/g, ''));
                console.log(`\n🔥 Pairing Code: ${code}\n`);
            } catch (err) {
                console.log("❌ Pairing Error.");
            }
        }, 10000);
    } else {
        client.initialize();
    }
}

startBot();
