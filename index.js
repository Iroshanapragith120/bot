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
let owners = ['947xxxxxxxx@c.us']; // <--- මෙතනට ඔයාගේ නම්බර් එක අනිවාර්යයෙන් දාන්න

client.on('qr', (qr) => {
    console.log('\n✅ QR Code ලැබුණා:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ බොට් සාර්ථකව සම්බන්ධ වුණා!');
});

client.on('message_create', async (msg) => {
    // මැසේජ් එක ආපු තැන (Chat ID එක)
    const chatID = msg.to === client.info.wid._serialized ? msg.from : msg.to;
    // මැසේජ් එක එවපු කෙනාගේ ID එක
    const sender = msg.from;
    const text = msg.body.trim();
    const args = text.split(' ');
    const command = args[0].toLowerCase();

    // Owner කෙනෙක්ද කියලා චෙක් කිරීම
    const isOwner = msg.fromMe || owners.includes(sender);
    if (!isOwner) return;

    // --- 1. OWNER MANAGEMENT COMMANDS ---
    
    if (command === '.addowner') {
        let newOwner = args[1] ? `${args[1]}@c.us` : null;
        if (newOwner && !owners.includes(newOwner)) {
            owners.push(newOwner);
            await client.sendMessage(chatID, `✅ @${args[1]} දැන් Owner කෙනෙක් ලෙස ඇඩ් කළා!`, { mentions: [newOwner] });
        } else {
            await client.sendMessage(chatID, `❌ අංකය වැරදියි හෝ දැනටමත් ඇඩ් කර ඇත.`);
        }
        return;
    }

    if (command === '.rmowner') {
        let toRemove = args[1] ? `${args[1]}@c.us` : null;
        if (toRemove && owners.includes(toRemove)) {
            owners = owners.filter(o => o !== toRemove);
            await client.sendMessage(chatID, `✅ @${args[1]} ව ඉවත් කළා!`, { mentions: [toRemove] });
        } else {
            await client.sendMessage(chatID, `❌ අංකය සොයාගත නොහැක.`);
        }
        return;
    }

    // --- 2. MENU LOGIC (රිප්ලයි එක යන තැන නිවැරදි කර ඇත) ---

    if (command === '.menu' || command === 'menu') {
        // දැන් අපි 'chatID' පාවිච්චි කරනවා, එවිට ඔබ මැසේජ් එක ගහන චැට් එකටම රිප්ලයි එක එනවා
        userStates[chatID] = { step: 'main' };
        await handleMainMenu(client, chatID, userStates);
    }
    else if (userStates[chatID]) {
        if ((userStates[chatID].step === 'main' && text === '1') || 
            userStates[chatID].step.startsWith('msg_') || 
            userStates[chatID].step.startsWith('send_msg_') ||
            userStates[chatID].step === 'get_num' || 
            userStates[chatID].step === 'get_cnt') {
            
            if (userStates[chatID].step === 'main') userStates[chatID].step = 'send_msg_menu_start';
            
            // ලොජික් එකටත් 'chatID' යවනවා
            await handleMessageSend(client, chatID, text, userStates);
        }
    }
});

async function startBot() {
    console.log("\n--- SETUP ---");
    console.log("1. QR Code\n2. Pairing Code");
    const choice = await askQuestion('\nතේරීම: ');

    if (choice === '2') {
        const phoneNumber = await askQuestion('\nනම්බර් එක (947xxxxxxxx): ');
        client.initialize();
        setTimeout(async () => {
            try {
                const code = await client.requestPairingCode(phoneNumber);
                console.log(`\n🔥 Pairing Code: ${code}`);
            } catch (err) { console.error("Error generating code"); }
        }, 6000);
    } else {
        client.initialize();
    }
}

startBot();
