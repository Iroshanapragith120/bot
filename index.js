const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const { handleMainMenu } = require('./mainmenu/mainLogic');
const { handleMessageSend } = require('./sendmessage/msgLogic');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

global.owners = [`${config.OWNER_NUMBER}@c.us` || '94741433513@c.us']; 
global.workMode = config.WORK_MODE || 'private';
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
        if (msg.fromMe && !msg.body.startsWith('.')) {
            if (!userStates[msg.to]) return;
        }

        const chatID = msg.from;
        const text = msg.body.trim();
        const isOwner = global.owners.includes(msg.from) || msg.fromMe;

        if (global.workMode === 'private' && !isOwner) return;

        if (text.toLowerCase() === '.menu' || text.toLowerCase() === 'menu') {
            await handleMainMenu(client, chatID, userStates);
            return;
        }

        if (userStates[chatID]) {
            if (userStates[chatID].step === 'mode_selection') {
                if (text === '1') {
                    global.workMode = 'public';
                    await client.sendMessage(chatID, "🌍 බොට් දැන් **Public**!");
                } else if (text === '2') {
                    global.workMode = 'private';
                    await client.sendMessage(chatID, "🔒 බොට් දැන් **Private**!");
                }
                delete userStates[chatID];
                return;
            }
            await handleMessageSend(client, chatID, text, userStates);
        }
    } catch (e) { console.error(e); }
});

// --- Session ID එකෙන් ලොග් වීමේ ලොජික් එක ---
async function loginWithSession() {
    if (!config.SESSION_ID || config.SESSION_ID === "") {
        console.log("❌ Error: Config එකේ Session ID එකක් නැහැ!");
        return;
    }

    console.log("🚀 Session ID එක පරීක්ෂා කරමින් පවතී...");
    
    // මෙතනදී Session ID එක Base64 ද කියලා බලලා ./setting එක හදන්න පුළුවන්
    // දැනට WhatsApp-web.js වල LocalAuth පාවිච්චි කරන නිසා කෙලින්ම initialize කරමු
    // සෙෂන් එක කලින් තිබුණොත් ඒකෙන් ලොග් වෙයි.
    client.initialize();
}

async function startBot() {
    console.log("\n--- 🤖 BOT LOGIN OPTIONS ---");
    console.log("1. QR Code");
    console.log("2. Pairing Code");
    console.log("3. Session ID (From Config)");
    
    const choice = await askQuestion('\nතේරීම (1, 2 හෝ 3): ');

    if (choice === '1') {
        console.log("🚀 QR Code එක ලෝඩ් වෙමින් පවතී...");
        client.initialize();
    } 
    else if (choice === '2') {
        const phoneNumber = await askQuestion('\nඅංකය (947xxxxxxxx): ');
        client.initialize();
        setTimeout(async () => {
            try {
                const code = await client.requestPairingCode(phoneNumber.replace(/[+-\s]/g, ''));
                console.log(`\n🔥 Pairing Code: ${code}\n`);
            } catch (err) { console.log("❌ Pairing Error."); }
        }, 10000);
    } 
    else if (choice === '3') {
        await loginWithSession();
    } 
    else {
        console.log("❌ වැරදි තේරීමක්! නැවත උත්සාහ කරන්න.");
        process.exit();
    }
}

startBot();
