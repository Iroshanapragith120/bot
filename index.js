const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const readline = require('readline');

// වෙනම හදපු ලොජික් ෆයිල්ස් මෙතනට ගන්නවා
const { handleMainMenu } = require('./mainmenu/mainLogic');
const { handleMessageSend } = require('./sendmessage/msgLogic');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './setting' }),
    puppeteer: { 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

let userStates = {};
let owners = ['947xxxxxxxx@c.us']; // උඹේ නම්බර් එක මෙතනට දාපන්

client.on('ready', () => {
    console.log('\n✅ බොට් සාර්ථකව Ready වුණා!');
});

client.on('message_create', async (msg) => {
    const sender = msg.from;
    const text = msg.body.trim();
    const isOwner = msg.fromMe || owners.includes(sender);

    // Owner කෙනෙක් නෙවේ නම් හෝ බොට්ම යවන Confirm මැසේජ් එකක් නම් නතර කරනවා
    if (!isOwner || (msg.fromMe && text.startsWith('✅'))) return;

    // 1. .menu හෝ menu කියලා ගැහුවම Main Menu ලොජික් එකට යවනවා
    if (text.toLowerCase() === '.menu' || text.toLowerCase() === 'menu') {
        await handleMainMenu(client, sender, userStates);
    }

    // 2. දැනටමත් මෙනු එකක ඉන්නවා නම් ඒ ඒ ලොජික් වලට යොමු කරනවා
    else if (userStates[sender]) {
        // Main Menu එකේ 1 එබුවොත් හෝ දැනටමත් Message Send මෙනු එකේ ප්‍රොසෙස් එකේ ඉන්නවා නම්
        if ((userStates[sender].step === 'main' && text === '1') || 
            userStates[sender].step.startsWith('msg_') || 
            userStates[sender].step === 'get_num' || 
            userStates[sender].step === 'get_cnt') {
            
            // මුලින්ම පියවර මාරු කරනවා sendmessage ලොජික් එකට ගැලපෙන්න
            if (userStates[sender].step === 'main') userStates[sender].step = 'send_msg_menu_start';
            
            await handleMessageSend(client, sender, text, userStates);
        }
    }
});

// බොට් ස්ටාර්ට් කිරීම සහ Pairing Code වැඩේ
async function startBot() {
    console.log("බොට් පණගන්වනවා... කරුණාකර රැඳී සිටින්න.");
    client.initialize();

    setTimeout(async () => {
        // සෙෂන් එකක් සේව් වෙලා නැත්නම් විතරක් Pairing Code එක අහනවා
        if (!client.pupPage) {
            const phoneNumber = await askQuestion('\nWhatsApp නම්බර් එක ලබා දෙන්න (උදා: 94741234567): ');
            const code = await client.requestPairingCode(phoneNumber);
            console.log(`\n🔑 ඔයාගේ Pairing Code එක: ${code}`);
            console.log("WhatsApp -> Linked Devices -> Link with phone number එකට ගොස් මෙම කෝඩ් එක ඇතුළත් කරන්න.\n");
        }
    }, 8000);
}

startBot();
