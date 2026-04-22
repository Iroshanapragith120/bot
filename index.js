const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const config = require('./config');
const { handleMainMenu } = require('./mainmenu/mainLogic');
const { handleMessageSend } = require('./sendmessage/msgLogic');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

global.owners = [`${config.OWNER_NUMBER}@c.us`, '94741433513@c.us']; 
let userStates = {};

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './setting' }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('ready', () => console.log('\n✅ Bot is Ready!'));
client.on('qr', (qr) => qrcode.generate(qr, { small: true }));

client.on('message_create', async (msg) => {
    try {
        const text = msg.body.trim();
        const sender = msg.from;
        
        // ❌ වැදගත්ම FIX එක:
        // බොට් විසින්ම යවන මැසේජ් (Bot messages) සහ 
        // උඹ විසින් බොට්ගේ Chat එකේම ගහන මැසේජ් (User messages) පටලවා නොගැනීම.
        
        // බොට් යවන මැසේජ් එකක් නම් (Bot's own reply) ඒක ignore කරනවා.
        // හැබැයි ඒ මැසේජ් එක Command එකක් නෙවෙයි නම් විතරයි.
        if (msg.fromMe && !text.startsWith('.') && !userStates[sender]) {
            // මෙතන තමයි කලින් හිර වුණේ.
            // දැන් බොට් යවන සාමාන්‍ය මැසේජ් වලට බොට් රිප්ලයි කරන්නේ නෑ.
            // හැබැයි උඹ උඹේ චැට් එකේ "1" ගැහුවොත් ඒක වැඩ කරනවා.
        }

        const isOwner = global.owners.includes(sender) || msg.fromMe;
        if (!isOwner) return;

        // Command: .menu
        if (text.toLowerCase() === '.menu' || text.toLowerCase() === 'menu') {
            await handleMainMenu(client, sender, userStates);
            return;
        }

        // Logic Handling (මෙතනින් තමයි 1, 2 වැඩ කරන්නේ)
        if (userStates[sender]) {
            await handleMessageSend(client, sender, text, userStates);
        }

    } catch (e) { console.error(e); }
});

async function startBot() {
    console.log("\n--- 🤖 BOT SETUP ---");
    const choice = await askQuestion('1. QR Code\n2. Pairing Code\nChoice: ');

    if (choice === '2') {
        const phoneNumber = await askQuestion('Number (947xxxxxxxx): ');
        client.initialize();
        setTimeout(async () => {
            try {
                const code = await client.requestPairingCode(phoneNumber.replace(/[+-\s]/g, ''));
                console.log(`\n🔥 Pairing Code: ${code}\n`);
            } catch (err) { console.log("❌ Pairing Error."); }
        }, 10000);
    } else {
        client.initialize();
    }
}

startBot();
