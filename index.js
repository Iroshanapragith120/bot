const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const readline = require('readline');

// වෙනම ෆෝල්ඩර් වල තියෙන ලොජික් මෙතනට ගන්නවා
const { handleMainMenu } = require('./mainmenu/mainLogic');
const { handleMessageSend } = require('./sendmessage/msgLogic');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const client = new Client({
    // සෙෂන් එක 'setting' ෆෝල්ඩර් එකේ සේව් වෙනවා
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
// මෙතනට ඔයාගේ මැසේජ් යවන නම්බර් එක අනිවාර්යයෙන් දාන්න
let owners = ['94741433513@c.us']; 

console.log("-----------------------------------------");
console.log("🚀 බොටා පණගන්වනවා... කරුණාකර රැඳී සිටින්න.");
console.log("-----------------------------------------");

client.on('ready', () => {
    console.log('\n✅ බොට් සාර්ථකව සම්බන්ධ වුණා! දැන් වැඩේ පටන් ගමු.');
});

// මැසේජ් ලැබෙන විට ක්‍රියාත්මක වන කොටස
client.on('message_create', async (msg) => {
    const sender = msg.from;
    const text = msg.body.trim();
    const isOwner = msg.fromMe || owners.includes(sender);

    // Owner කෙනෙක් නෙවේ නම් හෝ බොට්ම යවන පණිවිඩයක් නම් නතර කරන්න
    if (!isOwner || (msg.fromMe && text.startsWith('✅'))) return;

    // 1. ප්‍රධාන මෙනු එක (.menu)
    if (text.toLowerCase() === '.menu' || text.toLowerCase() === 'menu') {
        await handleMainMenu(client, sender, userStates);
    }

    // 2. අදාළ පියවර අනුව ලොජික් එකට යොමු කිරීම
    else if (userStates[sender]) {
        if ((userStates[sender].step === 'main' && text === '1') || 
            userStates[sender].step.startsWith('msg_') || 
            userStates[sender].step.startsWith('send_msg_') ||
            userStates[sender].step === 'get_num' || 
            userStates[sender].step === 'get_cnt') {
            
            // SendMessage ලොජික් එකට පියවර මාරු කිරීම
            if (userStates[sender].step === 'main') userStates[sender].step = 'send_msg_menu_start';
            
            await handleMessageSend(client, sender, text, userStates);
        }
    }
});

// බොට් ස්ටාර්ට් කරන ප්‍රධාන ෆන්ක්ෂන් එක
async function startBot() {
    try {
        await client.initialize();
        console.log("🌐 Browser එක වැඩ! සර්වර් එකට සම්බන්ධ වෙන්න උත්සාහ කරනවා...");

        // සෙෂන් එකක් නැත්නම් විනාඩි 5කින් විතර පයිරින් කෝඩ් එක අහනවා
        setTimeout(async () => {
            if (!client.pupPage || (client.pupPage && client.pupPage.isClosed())) {
                console.log("\n⚠️ සෙෂන් එකක් හමු වුණේ නැහැ.");
                const phoneNumber = await askQuestion('📲 පයිරින් කෝඩ් එක ලබා ගැනීමට නම්බර් එක ගහන්න (උදා: 947xxxxxxxx): ');
                
                console.log("🔑 පයිරින් කෝඩ් එක සාදමින් පවතී...");
                const code = await client.requestPairingCode(phoneNumber);
                console.log(`\n=========================================`);
                console.log(`🔥 ඔයාගේ Pairing Code එක: ${code}`);
                console.log(`=========================================`);
                console.log(`WhatsApp -> Linked Devices -> Link with phone number එකට ගොස් මෙම කෝඩ් එක ගහන්න.\n`);
            }
        }, 5000);

    } catch (err) {
        console.error("❌ බොට් පණගන්වද්දී අවුලක් ආවා:", err);
    }
}

startBot();
