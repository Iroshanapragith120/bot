const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const config = require('./config');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: config.SESSION_DATA }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Global Owners List (Config එකේ අංකය මුලින්ම එකතු කරනවා)
global.owners = [`${config.OWNER_NUMBER}@c.us`];
let userStates = {};

client.on('ready', () => {
    console.log('\n✅ බොට් සාර්ථකව සම්බන්ධ වුණා!');
});

client.on('message_create', async (msg) => {
    try {
        // 1. මේක වැදගත්ම දේ: බොට් එවන මැසේජ් වලට බොට්ම උත්තර දෙන එක නවත්තනවා
        if (msg.fromMe && !msg.body.startsWith(config.PREFIX)) return;

        const sender = msg.from;
        const text = msg.body.trim();
        const isOwner = global.owners.includes(sender) || msg.fromMe;

        // Owner නෙවෙයි නම් කිසිම දෙයක් කරන්න එපා
        if (!isOwner) return;

        const args = text.split(' ');
        const command = args[0].toLowerCase();

        // --- COMMANDS ---
        
        // 1. Add Owner Command
        if (command === `${config.PREFIX}addowner`) {
            let num = args[1] ? args[1].replace(/[+-\s]/g, '') : null;
            let newOwner = num ? `${num}@c.us` : null;
            if (newOwner && !global.owners.includes(newOwner)) {
                global.owners.push(newOwner);
                await client.sendMessage(msg.to, `✅ @${num} දැන් Owner කෙනෙක්!`, { mentions: [newOwner] });
            } else {
                await client.sendMessage(msg.to, `❌ වලංගු අංකයක් ලබා දෙන්න.`);
            }
            return;
        }

        // 2. Menu Command
        if (command === `${config.PREFIX}menu` || text.toLowerCase() === 'menu') {
            userStates[sender] = { step: 'main' };
            const menuMsg = `✨ *BOT MAIN MENU* ✨\n\n1. මැසේජ් එකක් යවන්න\n2. විස්තර බලන්න\n\nකරුණාකර අංකයක් රිප්ලයි කරන්න.`;
            await client.sendMessage(sender, menuMsg);
            return;
        }

        // 3. Handling User Inputs (Menu Logic)
        if (userStates[sender] && !msg.fromMe) {
            // මෙතන තමයි අර "වලංගු අංකයක් දෙන්න" ලෙඩේ Fix වෙන්නේ
            if (userStates[sender].step === 'main') {
                if (text === '1') {
                    userStates[sender].step = 'waiting_count';
                    await client.sendMessage(sender, "කරුණාකර යැවිය යුතු මැසේජ් ගණන (Count) ලබා දෙන්න:");
                } else {
                    await client.sendMessage(sender, "❌ කරුණාකර වලංගු අංකයක් තෝරන්න (1 හෝ 2).");
                }
                return;
            }

            if (userStates[sender].step === 'waiting_count') {
                const count = parseInt(text);
                if (isNaN(count)) {
                    await client.sendMessage(sender, "❌ කරුණාකර වලංගු අංකයක් (Number) ලබා දෙන්න.");
                } else {
                    await client.sendMessage(sender, `✅ ඔබ ${count} ක් තේරුවා. වැඩේ පටන් ගන්නවා...`);
                    // වැඩේ ඉවර වුණාම state එක clear කරනවා
                    delete userStates[sender];
                }
                return;
            }
        }

    } catch (e) { console.error("Error: ", e); }
});

// START LOGIC
async function startBot() {
    console.log("\n--- 🤖 BOT SETUP ---");
    const choice = await askQuestion('1. QR Code\n2. Pairing Code\nතේරීම: ');

    if (choice === '2') {
        const phoneNumber = await askQuestion('\nනම්බර් එක (947xxxxxxxx): ');
        client.initialize();
        client.on('qr', () => {}); 
        
        setTimeout(async () => {
            try {
                console.log("🔑 පයිරින් කෝඩ් එක ඉල්ලමින් පවතී...");
                const code = await client.requestPairingCode(phoneNumber.replace(/\s/g, ''));
                console.log(`\n🔥 Your Pairing Code: ${code}\n`);
            } catch (err) { console.log("❌ Pairing Error."); }
        }, 5000); // තත්පර 5ක් ඇති
    } else {
        client.on('qr', (qr) => {
            qrcode.generate(qr, { small: true });
            console.log('✅ QR එක ස්කෑන් කරන්න.');
        });
        client.initialize();
    }
}

startBot();
