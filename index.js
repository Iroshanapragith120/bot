const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const readline = require('readline');

// මෙනු ලොජික් ෆයිල්ස්
const { handleMainMenu } = require('./mainmenu/mainLogic');
const { handleMessageSend } = require('./sendmessage/msgLogic');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// --- මෙන්න මෙතන තමයි ඔයාගේ නම්බර් එක තියෙන්න ඕනේ ---
global.owners = ['94741433513@c.us']; 

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './setting' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process'
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

        // Owner ද කියලා බලනවා (Global ලිස්ට් එකෙන්)
        const isOwner = msg.fromMe || global.owners.includes(sender);
        if (!isOwner) return;

        // බොට්ම යවන පණිවිඩ වලට රිප්ලයි කිරීම නතර කරන්න
        if (msg.fromMe && text.startsWith('✅')) return;

        // 1. OWNER MANAGEMENT
        if (command === '.addowner') {
            let newOwner = args[1] ? `${args[1]}@c.us` : null;
            if (newOwner && !global.owners.includes(newOwner)) {
                global.owners.push(newOwner);
                await client.sendMessage(chatID, `✅ @${args[1]} දැන් Owner කෙනෙක්!`, { mentions: [newOwner] });
            } else {
                await client.sendMessage(chatID, `❌ අංකය වැරදියි හෝ දැනටමත් ඇඩ් කර ඇත.`);
            }
            return;
        }

        if (command === '.rmowner') {
            let toRemove = args[1] ? `${args[1]}@c.us` : null;
            if (toRemove && global.owners.includes(toRemove)) {
                global.owners = global.owners.filter(o => o !== toRemove);
                await client.sendMessage(chatID, `✅ @${args[1]} ව ඉවත් කළා!`, { mentions: [toRemove] });
            }
            return;
        }

        // 2. MENU LOGIC
        if (command === '.menu' || command === 'menu') {
            userStates[chatID] = { step: 'main' };
            await handleMainMenu(client, chatID, userStates);
        }
        else if (userStates[chatID]) {
            // මැසේජ් සෙන්ඩ් ලොජික් එකට යොමු කරනවා
            await handleMessageSend(client, chatID, text, userStates);
        }
    } catch (e) {
        console.error("Index Error:", e);
    }
});

async function startBot() {
    console.log("\n--- 🤖 BOT SETUP ---");
    console.log("1. QR Code\n2. Pairing Code");
    const choice = await askQuestion('\nතේරීම: ');

    if (choice === '2') {
        const phoneNumber = await askQuestion('\nනම්බර් එක (947xxxxxxxx): ');
        client.on('qr', () => {}); 
        client.initialize();
        setTimeout(async () => {
            try {
                console.log("🔑 පයිරින් කෝඩ් එක ඉල්ලමින් පවතී...");
                const code = await client.requestPairingCode(phoneNumber.replace(/\s/g, ''));
                console.log(`\n============================`);
                console.log(`🔥 Pairing Code: ${code}`);
                console.log(`============================\n`);
            } catch (err) { console.error("Pairing error. Try again."); }
        }, 10000);
    } else {
        client.on('qr', (qr) => {
            console.log('\n✅ QR Code ලැබුණා:');
            qrcode.generate(qr, { small: true });
        });
        client.initialize();
    }
}

startBot();
