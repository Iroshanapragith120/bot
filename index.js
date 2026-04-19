const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const readline = require('readline');

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
let owners = ['94741433513@c.us']; // ඔයාගේ නම්බර් එක

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

        const isOwner = msg.fromMe || owners.includes(sender);
        if (!isOwner || (msg.fromMe && text.startsWith('✅'))) return;

        // OWNER MANAGEMENT
        if (command === '.addowner') {
            let newOwner = args[1] ? `${args[1]}@c.us` : null;
            if (newOwner && !owners.includes(newOwner)) {
                owners.push(newOwner);
                await client.sendMessage(chatID, `✅ @${args[1]} ඇඩ් කළා!`, { mentions: [newOwner] });
            }
            return;
        }

        if (command === '.rmowner') {
            let toRemove = args[1] ? `${args[1]}@c.us` : null;
            if (toRemove && owners.includes(toRemove)) {
                owners = owners.filter(o => o !== toRemove);
                await client.sendMessage(chatID, `✅ @${args[1]} ඉවත් කළා!`, { mentions: [toRemove] });
            }
            return;
        }

        // MENU LOGIC
        if (command === '.menu' || command === 'menu') {
            userStates[chatID] = { step: 'main' };
            await handleMainMenu(client, chatID, userStates);
        }
        else if (userStates[chatID]) {
            const state = userStates[chatID];
            if ((state.step === 'main' && text === '1') || 
                state.step.startsWith('send_msg_') || 
                state.step === 'msg_choice' || 
                state.step === 'get_num' || 
                state.step === 'get_cnt') {
                
                if (state.step === 'main') state.step = 'send_msg_menu_start';
                await handleMessageSend(client, chatID, text, userStates);
            }
        }
    } catch (e) { console.error(e); }
});

async function startBot() {
    console.log("\n--- 🤖 BOT SETUP ---");
    console.log("1. QR Code\n2. Pairing Code");
    const choice = await askQuestion('\nතේරීම: ');

    if (choice === '2') {
        const phoneNumber = await askQuestion('\nනම්බර් එක (947xxxxxxxx): ');
        // Pairing වලදී QR එක Generate වෙන එක නවත්තනවා ලෙඩ එන නිසා
        client.on('qr', () => {}); 
        client.initialize();
        
        setTimeout(async () => {
            try {
                console.log("🔑 පයිරින් කෝඩ් එක ඉල්ලමින් පවතී...");
                const code = await client.requestPairingCode(phoneNumber.replace(/\s/g, ''));
                console.log(`\n🔥 Pairing Code: ${code}\n`);
            } catch (err) { console.log("❌ Error generating code. Try again."); }
        }, 10000);

    } else {
        client.on('qr', (qr) => {
            console.log('\n✅ QR ලැබුණා:');
            qrcode.generate(qr, { small: true });
        });
        client.initialize();
    }
}

startBot();
