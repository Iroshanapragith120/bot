const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const config = require('./config');

// ලොජික් ෆයිල් දෙක මෙතනට ලින්ක් කරනවා
const { handleMainMenu } = require('./mainmenu/mainLogic');
const { handleMessageSend } = require('./sendmessage/msgLogic');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// Global Owners List (Config එකෙන් සහ index එකෙන් සෙට් කරනවා)
global.owners = [`${config.OWNER_NUMBER}@c.us` || '94741433513@c.us']; 
let userStates = {};

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './setting' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
    }
});

// බොට් රෙඩි වුණාම පණිවිඩය
client.on('ready', () => {
    console.log('\n✅ බොට් සාර්ථකව සම්බන්ධ වුණා! දැන් වැඩේ පටන් ගමු.');
});

// QR Code එක පෙන්වීම
client.on('qr', (qr) => {
    console.log('\n✅ QR Code එක ලැබුණා, ස්කෑන් කරන්න:');
    qrcode.generate(qr, { small: true });
});

// මැසේජ් ලැබෙන විට ක්‍රියාත්මක වන කොටස
client.on('message_create', async (msg) => {
    try {
        // බොට් තමන් විසින්ම යවන පණිවිඩ වලට රිප්ලයි කිරීම නැවැත්වීම (Loop Fix)
        // නමුත් .menu වැනි කමාන්ඩ් එකක් තමන් ගැහුවොත් ඒක වැඩ කළ යුතුයි
        if (msg.fromMe && !msg.body.startsWith('.')) return;

        const chatID = msg.to === client.info.wid._serialized ? msg.from : msg.to;
        const text = msg.body.trim();
        const sender = msg.from;

        // Owner ද නැද්ද කියා පරීක්ෂා කිරීම
        const isOwner = global.owners.includes(sender) || msg.fromMe;
        if (!isOwner) return;

        // 1. .addowner කමාන්ඩ් එක (අලුත් අය එකතු කරන්න)
        if (text.startsWith('.addowner')) {
            let num = text.split(' ')[1]?.replace(/[+-\s]/g, '');
            if (num) {
                let newOwner = `${num}@c.us`;
                if (!global.owners.includes(newOwner)) {
                    global.owners.push(newOwner);
                    await client.sendMessage(chatID, `✅ @${num} දැන් Owner කෙනෙක්!`, { mentions: [newOwner] });
                }
            }
            return;
        }

        // 2. .menu හෝ menu ගැසූ විට මෙනූ එක පෙන්වීම
        if (text.toLowerCase() === '.menu' || text.toLowerCase() === 'menu') {
            await handleMainMenu(client, chatID, userStates);
            return;
        }

        // 3. යම් කිසි මෙනූ පියවරක සිටී නම් (userStates පවතී නම්) logic එකට යැවීම
        if (userStates[chatID]) {
            await handleMessageSend(client, chatID, text, userStates);
        }

    } catch (e) {
        console.error("🚫 Message Error:", e);
    }
});

// බොට් ආරම්භ කිරීමේ ලොජික් එක
async function startBot() {
    console.log("\n--- 🤖 WHATSAPP BOT SETUP ---");
    console.log("1. QR Code (වෙබ් එකෙන් ස්කෑන් කරන්න)");
    console.log("2. Pairing Code (අංකය ලබා දී කෝඩ් එක ගන්න)");
    
    const choice = await askQuestion('\nඔබේ තේරීම (1 හෝ 2): ');

    if (choice === '2') {
        const phoneNumber = await askQuestion('\nඔබේ අංකය ලබා දෙන්න (947xxxxxxxx): ');
        const cleanNumber = phoneNumber.replace(/[+-\s]/g, '');
        
        console.log("🚀 බොට්ව පද්ධතියට සම්බන්ධ කරමින් පවතී. තත්පර කිහිපයක් ඉන්න...");
        client.initialize();

        // පයිරින් කෝඩ් එක ඉල්ලීමට පෙර තත්පර 10ක් රැඳී සිටීම (Pairing Error එකට විසඳුම)
        setTimeout(async () => {
            try {
                console.log("🔑 පයිරින් කෝඩ් එක ඉල්ලමින් පවතී...");
                const code = await client.requestPairingCode(cleanNumber);
                console.log(`\n🔥 ඔබේ Pairing Code එක: ${code}\n`);
                console.log("මේ කෝඩ් එක ඔබේ WhatsApp එකේ 'Link a Device' -> 'Link with phone number' වෙත ගොස් ඇතුළත් කරන්න.");
            } catch (err) {
                console.log("❌ Pairing Error එකක් ආවා! කරුණාකර බොට් නැවත පණගන්වා (Restart) උත්සාහ කරන්න.");
                console.error(err.message);
            }
        }, 10000); 

    } else {
        console.log("🚀 QR Code එක සකසමින් පවතී...");
        client.initialize();
    }
}

// වැඩේ පටන් ගමු!
startBot();
