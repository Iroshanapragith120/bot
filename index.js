const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');

// මැසේජ් ෆයිල්ස්
const cha = require('./cha');
const xeontext3 = require('./xeontext3');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

let userStates = {};

// --- මූලික Owner ලැයිස්තුව (උඹේ නම්බර් එක මෙතන දාපන්) ---
let owners = ['947xxxxxxxx@c.us']; 

client.on('qr', (qr) => {
    console.log('\n--- QR එක SCAN කරන්න ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\nBot එක Ready! Owners ලට පාලනය කළ හැක.');
});

client.on('message_create', async (msg) => {
    const sender = msg.from;
    const text = msg.body.trim();
    const args = text.split(' ');
    const command = args[0].toLowerCase();

    // බොට් මැසේජ් එකක් යවද්දී ඒක ආයෙත් කියවලා රිප්ලයි කරන එක නතර කරන්න
    if (msg.fromMe && text.startsWith('✅')) return;

    // --- OWNER CHECK ---
    const isOwner = msg.fromMe || owners.includes(sender);
    if (!isOwner) return;

    const imagePath = path.join(__dirname, 'image', 'README.jpg');
    let media;
    try { media = MessageMedia.fromFilePath(imagePath); } catch (e) { media = null; }

    // --- OWNER කළමනාකරණ විධාන (COMMANDS) ---

    // 1. අලුත් Owner කෙනෙක් ඇඩ් කිරීම (.addowner 9474xxxxxxx)
    if (command === '.addowner') {
        let newOwner = args[1] ? `${args[1]}@c.us` : null;
        if (newOwner && !owners.includes(newOwner)) {
            owners.push(newOwner);
            await client.sendMessage(sender, `✅ ${args[1]} දැන් Owner කෙනෙක් ලෙස ඇඩ් කළා!`);
        } else {
            await client.sendMessage(sender, `❌ නිවැරදි අංකය ලබා දෙන්න හෝ ඔහු දැනටමත් ඇඩ් කර ඇත.`);
        }
        return;
    }

    // 2. Owner කෙනෙක් අයින් කිරීම (.rmowner 9474xxxxxxx)
    if (command === '.rmowner') {
        let toRemove = args[1] ? `${args[1]}@c.us` : null;
        if (toRemove && owners.includes(toRemove)) {
            owners = owners.filter(o => o !== toRemove);
            await client.sendMessage(sender, `✅ ${args[1]} ව Owner ලැයිස්තුවෙන් ඉවත් කළා!`);
        } else {
            await client.sendMessage(sender, `❌ අංකය සොයාගත නොහැක.`);
        }
        return;
    }

    // 3. දැනට ඉන්න අය බැලීම (.ownerlist)
    if (command === '.ownerlist') {
        let list = `*--- 👥 CURRENT OWNERS ---*\n\n` + owners.map(o => `• ${o.split('@')[0]}`).join('\n');
        await client.sendMessage(sender, list);
        return;
    }

    // --- කලින් තිබූ බොට් මෙනූ එක ---

    if (command === '.menu' || command === 'menu') {
        userStates[sender] = { step: 'main' };
        let mainMenu = `*--- 🤖 OWNER MENU ---*\n\n` +
                       `1. 📩 Message Send Menu\n` +
                       `*Reply with Number*`;
        if (media) await client.sendMessage(sender, media, { caption: mainMenu });
        else await client.sendMessage(sender, mainMenu);
    }

    else if (userStates[sender]?.step === 'main' && text === '1') {
        userStates[sender].step = 'send_msg_menu';
        let msgMenu = `*--- 📩 MESSAGE SEND MENU ---*\n\n` +
                      `1. Send 'cha'\n` +
                      `2. Send 'xeontext3'\n\n` +
                      `*අංකය රිප්ලයි කරන්න:*`;
        await client.sendMessage(sender, media || msgMenu, media ? { caption: msgMenu } : {});
    }

    else if (userStates[sender]?.step === 'send_msg_menu' && (text === '1' || text === '2')) {
        userStates[sender].file = (text === '1') ? 'cha' : 'xeontext3';
        userStates[sender].step = 'get_num';
        await client.sendMessage(sender, `✅ තේරුවා: ${userStates[sender].file}\n\nTarget Number එක දෙන්න (947xxxxxxxx):`);
    }

    else if (userStates[sender]?.step === 'get_num') {
        userStates[sender].target = text.includes('@c.us') ? text : `${text}@c.us`;
        userStates[sender].step = 'get_cnt';
        await client.sendMessage(sender, `කීයක් යැවිය යුතුද? (Count):`);
    }

    else if (userStates[sender]?.step === 'get_cnt') {
        let count = parseInt(text) || 1;
        let target = userStates[sender].target;
        let body = (userStates[sender].file === 'cha') ? cha : xeontext3;

        await client.sendMessage(sender, `මැසේජ් ${count} ක් යැවීම ආරම්භ කළා... 🚀`);
        for (let i = 1; i <= count; i++) {
            await client.sendMessage(target, media || body, media ? { caption: body } : {});
            if (i < count) await new Promise(r => setTimeout(r, 2500));
        }
        await client.sendMessage(sender, `✅ සියල්ල සාර්ථකව යවා අවසන්!`);
        delete userStates[sender];
    }
});

client.initialize();
