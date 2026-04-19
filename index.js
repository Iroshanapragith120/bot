const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const readline = require('readline');

const { handleMainMenu } = require('./mainmenu/mainLogic');
const { handleMessageSend } = require('./sendmessage/msgLogic');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// --- GLOBAL OWNERS LIST ---
global.owners = ['94741433513@c.us']; 

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './setting' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
            '--disable-gpu', '--no-zygote', '--single-process'
        ],
    }
});

let userStates = {};

client.on('ready', () => {
    console.log('\n✅ බොට් සාර්ථකව සම්බන්ධ වුණා!');
});

client.on('message_create', async (msg) => {
    try {
        const chatID = msg.to === client.info.wid._serialized ? msg.from : msg.to;
        const sender = msg.from;
        const text = msg.body.trim();
        const args = text.split(' ');
        const command = args[0].toLowerCase();

        // OWNER CHECK (මෙතනයි ඇඩ් කරන අයට වැඩ නොකරන ප්‍රශ්නය තිබුණේ)
        const isOwner = msg.fromMe || global.owners.includes(sender);
        if (!isOwner) return;

        // .addowner කමාන්ඩ් එක
        if (command === '.addowner') {
            let num = args[1] ? args[1].replace('+', '').replace(/\s/g, '') : null;
            let newOwner = num ? `${num}@c.us` : null;
            if (newOwner && !global.owners.includes(newOwner)) {
                global.owners.push(newOwner);
                await client.sendMessage(chatID, `✅ @${num} දැන් Owner කෙනෙක්!`, { mentions: [newOwner] });
            }
            return;
        }

        // .menu කමාන්ඩ් එක
        if (command === '.menu' || command === 'menu') {
            userStates[chatID] = { step: 'main' };
            await handleMainMenu(client, chatID, userStates);
            return;
        }

        // ලොජික් එකට යොමු කිරීම
        if (userStates[chatID]) {
            await handleMessageSend(client, chatID, text, userStates);
        }
    } catch (e) { console.error(e); }
});

async function startBot() {
    console.log("\n--- 🤖 BOT SETUP ---");
    console.log("1. QR Code\n2. Pairing Code");
    const choice = await askQuestion('\nතේරීම: ');

    if (choice === '2') {
        const phoneNumber = await askQuestion('\nනම්බර් එක (947xxxxxxxx): ');
        client.on('qr', () => {}); // Pairing වලදී QR ignore කරන්න
        client.initialize();
        
        // පයිරින් කෝඩ් එකට තත්පර 12ක් දෙන්න (Cloud Shell එකට ලේසි වෙන්න)
        setTimeout(async () => {
            try {
                console.log("🔑 පයිරින් කෝඩ් එක ඉල්ලමින් පවතී...");
                const code = await client.requestPairingCode(phoneNumber.replace(/\s/g, ''));
                console.log(`\n🔥 Pairing Code: ${code}\n`);
            } catch (err) { console.log("❌ Pairing error. Clean කරලා ආයේ රන් කරන්න."); }
        }, 12000);
    } else {
        client.on('qr', (qr) => {
            console.log('\n✅ QR Code එක ලැබුණා:');
            qrcode.generate(qr, { small: true });
        });
        client.initialize();
    }
}

startBot();
