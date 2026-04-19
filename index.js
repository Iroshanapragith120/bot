const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const readline = require('readline');

// මෙනු ලොජික් ෆයිල්ස්
const { handleMainMenu } = require('./mainmenu/mainLogic');
const { handleMessageSend } = require('./sendmessage/msgLogic');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

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
let owners = ['94741433513@c.us']; // <--- උඹේ නම්බර් එක මෙතනට දාපන්

// --- QR Code එක පෙන්වීමට ---
client.on('qr', (qr) => {
    console.log('\n✅ QR Code එක ලැබුණා. කරුණාකර ස්කෑන් කරන්න:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ බොට් සාර්ථකව සම්බන්ධ වුණා!');
});

// --- මැසේජ් ලොජික් ---
client.on('message_create', async (msg) => {
    const sender = msg.from;
    const text = msg.body.trim();
    const isOwner = msg.fromMe || owners.includes(sender);

    if (!isOwner || (msg.fromMe && text.startsWith('✅'))) return;

    if (text.toLowerCase() === '.menu' || text.toLowerCase() === 'menu') {
        await handleMainMenu(client, sender, userStates);
    }
    else if (userStates[sender]) {
        if ((userStates[sender].step === 'main' && text === '1') || 
            userStates[sender].step.startsWith('msg_') || 
            userStates[sender].step.startsWith('send_msg_') ||
            userStates[sender].step === 'get_num' || 
            userStates[sender].step === 'get_cnt') {
            
            if (userStates[sender].step === 'main') userStates[sender].step = 'send_msg_menu_start';
            await handleMessageSend(client, sender, text, userStates);
        }
    }
});

// --- ප්‍රධාන පාලන කොටස ---
async function startBot() {
    console.log("\n--- 🤖 WHATSAPP BOT SETUP ---");
    console.log("1. QR Code එකෙන් සම්බන්ධ වන්න");
    console.log("2. Pairing Code එකෙන් සම්බන්ධ වන්න");
    
    const choice = await askQuestion('\nඔබේ තේරීම ඇතුළත් කරන්න (1 හෝ 2): ');

    if (choice === '2') {
        const phoneNumber = await askQuestion('\nWhatsApp අංකය ලබා දෙන්න (947xxxxxxxx): ');
        client.initialize();
        
        // පයිරින් කෝඩ් එක ඉල්ලීම
        setTimeout(async () => {
            try {
                const code = await client.requestPairingCode(phoneNumber);
                console.log(`\n🔥 ඔබේ Pairing Code එක: ${code}`);
                console.log("මෙම කෝඩ් එක WhatsApp හි 'Link with phone number' හරහා ඇතුළත් කරන්න.\n");
            } catch (err) {
                console.error("❌ පයිරින් කෝඩ් එක ගැනීමේදී දෝෂයක් ආවා.");
            }
        }, 5000);

    } else if (choice === '1') {
        console.log("\n🌐 QR Code එක සාදමින් පවතී...");
        client.initialize();
    } else {
        console.log("❌ වැරදි තේරීමක්. කරුණාකර නැවත උත්සාහ කරන්න.");
        process.exit();
    }
}

startBot();
