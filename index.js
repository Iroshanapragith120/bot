const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const readline = require('readline');

// ලොජික් ෆයිල්ස්
const { handleMainMenu } = require('./mainmenu/mainLogic');
const { handleMessageSend } = require('./sendmessage/msgLogic');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './setting' }),
    // මෙන්න මේ Arguments ටික තමයි හිර නොවී රන් වෙන්න ඕනේ
    puppeteer: { 
        headless: true, 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Memory අවුල් වලට වැදගත්
            '--disable-gpu',
            '--no-zygote'
        ] 
    }
});

let userStates = {};
let owners = ['947xxxxxxxx@c.us']; // උඹේ නම්බර් එක

console.log("බොට් පණගන්වනවා... කරුණාකර රැඳී සිටින්න.");

client.on('ready', () => {
    console.log('\n✅ බොට් සාර්ථකව Ready වුණා!');
});

// මැසේජ් පාලනය
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
            userStates[sender].step === 'get_num' || 
            userStates[sender].step === 'get_cnt') {
            
            if (userStates[sender].step === 'main') userStates[sender].step = 'send_msg_menu_start';
            await handleMessageSend(client, sender, text, userStates);
        }
    }
});

async function startBot() {
    try {
        await client.initialize();
        console.log("Browser එක පණගැන්වුණා. දැන් සම්බන්ධ වෙන්න උත්සාහ කරනවා...");
        
        setTimeout(async () => {
            // සෙෂන් එකක් නැත්නම් විතරක් Pairing Code අහන්න
            if (!client.pupPage || (client.pupPage && client.pupPage.isClosed())) {
                const phoneNumber = await askQuestion('\nWhatsApp නම්බර් එක ලබා දෙන්න (947xxxxxxxx): ');
                const code = await client.requestPairingCode(phoneNumber);
                console.log(`\n🔑 ඔයාගේ Pairing Code එක: ${code}`);
            }
        }, 10000); // තත්පර 10ක් දෙන්න Browser එක හරියට ස්ටාර්ට් වෙන්න
    } catch (err) {
        console.error("බොට් පණගැන්වීමේදී දෝෂයක් ආවා:", err);
    }
}

startBot();
