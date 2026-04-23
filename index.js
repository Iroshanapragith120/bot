const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const fs = require('fs');
const config = require('./config');

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
    console.log('\n✅ PODDA-MD CONNECTED SUCCESSFULLY!');
});

client.on('qr', (qr) => {
    console.log('\n🔥 QR CODE RECEIVED:');
    qrcode.generate(qr, { small: true });
});

client.on('message_create', async (msg) => {
    try {
        const chatID = msg.from;
        const text = msg.body.trim();
        const isOwner = global.owners.includes(msg.from) || msg.fromMe;

        if (global.workMode === 'private' && !isOwner) return;

        // 1. Menu Command
        if (text.toLowerCase() === '.menu' || text.toLowerCase() === 'menu') {
            userStates[chatID] = { step: 'main_menu' };
            let menuTxt = `*🚀 PODDA-MD TERMINAL*\n\n` +
                          `1. Change Work Mode\n` +
                          `2. Send Bulk Messages\n` +
                          `3. System Status\n\n` +
                          `*Reply with Number*`;
            await client.sendMessage(chatID, menuTxt);
            return;
        }

        if (userStates[chatID]) {
            const step = userStates[chatID].step;

            // --- MODE SELECTION ---
            if (step === 'main_menu' && text === '1') {
                userStates[chatID].step = 'mode_selection';
                await client.sendMessage(chatID, "🛠 *SELECT MODE*\n\n1. Public\n2. Private");
                return;
            }
            if (step === 'mode_selection') {
                if (text === '1') { global.workMode = 'public'; await client.sendMessage(chatID, "🌍 PUBLIC MODE ON"); }
                else if (text === '2') { global.workMode = 'private'; await client.sendMessage(chatID, "🔒 PRIVATE MODE ON"); }
                delete userStates[chatID]; return;
            }

            // --- BULK MESSAGE SEND LOGIC ---
            if (step === 'main_menu' && text === '2') {
                userStates[chatID].step = 'msg_number';
                await client.sendMessage(chatID, "📞 Enter Target Number:\n*(Ex: 947xxxxxxxx)*");
                return;
            }

            if (step === 'msg_number') {
                userStates[chatID].targetNum = text.replace(/[^0-9]/g, '') + "@c.us";
                userStates[chatID].step = 'msg_text';
                await client.sendMessage(chatID, "💬 Enter Your Message:");
                return;
            }

            if (step === 'msg_text') {
                userStates[chatID].messageBody = text;
                userStates[chatID].step = 'msg_count';
                await client.sendMessage(chatID, "🔢 How many times do you want to send this?");
                return;
            }

            if (step === 'msg_count') {
                const count = parseInt(text);
                if (isNaN(count) || count <= 0) {
                    await client.sendMessage(chatID, "❌ Invalid count. Operation cancelled.");
                } else {
                    const target = userStates[chatID].targetNum;
                    const message = userStates[chatID].messageBody;
                    
                    await client.sendMessage(chatID, `⏳ Sending ${count} messages to ${target}...`);
                    
                    for (let i = 0; i < count; i++) {
                        await client.sendMessage(target, message);
                        // පොඩි වෙලාවක් ඉන්නවා WhatsApp එකෙන් block නොවී ඉන්න
                        await new Promise(resolve => setTimeout(resolve, 1000)); 
                    }
                    
                    await client.sendMessage(chatID, `✅ Successfully sent ${count} messages!`);
                }
                delete userStates[chatID];
                return;
            }

            // --- STATUS ---
            if (step === 'main_menu' && text === '3') {
                await client.sendMessage(chatID, `🖥 *STATUS:* ACTIVE\n*MODE:* ${global.workMode}`);
                delete userStates[chatID]; return;
            }
        }
    } catch (e) { console.error(e); }
});

async function startBot() {
    console.log("\n--- 🤖 PODDA-MD ---");
    client.initialize();
}

startBot();
