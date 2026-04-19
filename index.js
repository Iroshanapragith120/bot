const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const readline = require('readline');

// ලොජික් ෆයිල්ස්
const { handleMainMenu } = require('./mainmenu/mainLogic');
const { handleMessageSend } = require('./sendmessage/msgLogic');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// --- මුලින්ම ඉන්න Owner ගේ නම්බර් එක මෙතන දාන්න ---
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
    console.log('\n✅ බොට් සාර්ථකව Ready වුණා!');
});

client.on('message_create', async (msg) => {
    try {
        const chatID = msg.to === client.info.wid._serialized ? msg.from : msg.to;
        const sender = msg.from;
        const text = msg.body.trim();
        const args = text.split(' ');
        const command = args[0].toLowerCase();

        // Owner ද කියලා චෙක් කරනවා (Global List එකෙන්)
        const isOwner = msg.fromMe || global.owners.includes(sender);
        if (!isOwner) return;

        // බොට්ම යවන Confirm මැසේජ් වලට බොට්ම රිප්ලයි කරන එක නවත්තන්න
        if (msg.fromMe && (text.startsWith('✅') || text.startsWith('*---'))) return;

        // --- 1. OWNER MANAGEMENT (මෙතනයි අවුල තිබුණේ) ---
        if (command === '.addowner') {
            let num = args[1] ? args[1].replace('+', '').replace(/\s/g, '') : null;
            let newOwner = num ? `${num}@c.us` : null;
            if (newOwner && !global.owners.includes(newOwner)) {
                global.owners.push(newOwner); // මේකෙන් තමයි memory එකේ update වෙන්නේ
                await client.sendMessage(chatID, `✅ @${num} දැන් Owner කෙනෙක් ලෙස ඇඩ් කළා!`, { mentions: [newOwner] });
            } else {
                await client.sendMessage(chatID, `❌ අංකය වැරදියි හෝ දැනටමත් ඇඩ් කර ඇත.`);
            }
            return;
        }

        // --- 2. MENU HANDLING ---
        if (command === '.menu' || command === 'menu') {
            userStates[chatID] = { step: 'main' };
            await handleMainMenu(client, chatID, userStates);
            return;
        }

        // මෙනු එකේ පියවරවල් තිබේ නම් පමණක් මැසේජ් ලොජික් එකට යවන්න
        if (userStates[chatID]) {
            await handleMessageSend(client, chatID, text, userStates);
        }

    } catch (e) { console.error("Index Error:", e); }
});

async function startBot() {
    console.log("\n--- 🤖 BOT SETUP ---");
    console.log("1. QR Code\n2. Pairing Code");
    const choice = await askQuestion('\nතේරීම (1 හෝ 2): ');

    if (choice === '2') {
        const phoneNumber = await askQuestion('\nනම්බර් එක (947xxxxxxxx): ');
        client.on('qr', () => {}); 
        client.initialize();
        
        setTimeout(async () => {
            try {
                console.log("🔑 පයිරින් කෝඩ් එක ඉල්ලමින් පවතී...");
                const code = await client.requestPairingCode(phoneNumber.replace(/\s/g, ''));
                console.log(`\n🔥 Pairing Code: ${code}\n`);
            } catch (err) { console.log("❌ Pairing error. Restart and try again."); }
        }, 10000);
    } else {
        client.on('qr', (qr) => {
            console.log('\n✅ QR Code එක ලැබුණා:');
            qrcode.generate(qr, { small: true });
        });
        client.initialize();
    }
}

startBot();
