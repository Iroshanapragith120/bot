const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');

// මැසේජ් ෆයිල්ස් (මේවා ඔයාගේ root එකේ තියෙනවා නේද?)
const cha = require('./cha');
const xeontext3 = require('./xeontext3');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

let userStates = {};
let botSettings = {
    mode: 'public', 
    owner: '94741433513c.us' // උඹේ නම්බර් එක මෙතනට දාන්න
};

client.on('qr', (qr) => {
    console.log('\n--- QR එක SCAN කරන්න ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\nBot එක Ready! Mode: ' + botSettings.mode);
});

// 'message_create' පාවිච්චි කරන්නේ තමන්ගේම නම්බර් එකෙන් පාලනය කරන්නයි
client.on('message_create', async (msg) => {
    if (msg.fromMe && msg.body.startsWith('✅')) return; 

    const sender = msg.from;
    const isGroup = sender.endsWith('@g.us');
    const text = msg.body.trim().toLowerCase();
    const isOwner = msg.fromMe || sender === botSettings.owner;

    // --- PERMISSION CHECK ---
    if (botSettings.mode === 'private' && !isOwner) return;
    if (botSettings.mode === 'group' && !isGroup && !isOwner) return;

    // උඹ ඉල්ලපු පින්තූරය ගන්නා විදිහ (image folder එක ඇතුළේ README.jpg)
    const imagePath = path.join(__dirname, 'image', 'README.jpg');
    let media;
    try { 
        media = MessageMedia.fromFilePath(imagePath); 
    } catch (e) { 
        media = null; 
    }

    // 1. MAIN MENU
    if (text === '.menu' || text === 'menu') {
        userStates[sender] = { step: 'main' };
        let mainMenu = `*--- 🤖 MAIN MENU ---*\n\n` +
                       `1. 📩 Message Send Menu\n` +
                       `2. 🔐 Public/Mode Menu\n\n` +
                       `*Reply with Number*`;
        
        if (media) await client.sendMessage(sender, media, { caption: mainMenu });
        else await client.sendMessage(sender, mainMenu);
    }

    // 2. MAIN MENU තේරීම්
    else if (userStates[sender]?.step === 'main') {
        if (text === '1') {
            userStates[sender].step = 'send_msg_menu';
            let msgMenu = `*--- 📩 MESSAGE SEND MENU ---*\n\n` +
                          `1. Send 'cha'\n` +
                          `2. Send 'xeontext3'\n\n` +
                          `*අංකය රිප්ලයි කරන්න:*`;
            await client.sendMessage(sender, media || msgMenu, media ? { caption: msgMenu } : {});
        } 
        else if (text === '2') {
            userStates[sender].step = 'mode_menu';
            let modeMenu = `*--- 🔐 PUBLIC/MODE MENU ---*\n\n` +
                           `1. Private (Me only)\n` +
                           `2. Public (All users)\n` +
                           `3. Group (Groups only)\n\n` +
                           `*ඔබේ තේරීම රිප්ලයි කරන්න:*`;
            await client.sendMessage(sender, media || modeMenu, media ? { caption: modeMenu } : {});
        }
    }

    // 3. MODE MENU
    else if (userStates[sender]?.step === 'mode_menu') {
        if (!isOwner) {
            await client.sendMessage(sender, "සමාවෙන්න, මෝඩ් එක වෙනස් කළ හැක්කේ බොට්ගේ අයිතිකරුට පමණි!");
            delete userStates[sender];
            return;
        }
        if (text === '1') botSettings.mode = 'private';
        else if (text === '2') botSettings.mode = 'public';
        else if (text === '3') botSettings.mode = 'group';

        await client.sendMessage(sender, `✅ බොට් දැන් *${botSettings.mode.toUpperCase()}* මෝඩ් එකට මාරු වුණා.`);
        delete userStates[sender];
    }

    // 4. MESSAGE SEND ලොජික් එක
    else if (userStates[sender]?.step === 'send_msg_menu') {
        if (text === '1' || text === '2') {
            userStates[sender].file = (text === '1') ? 'cha' : 'xeontext3';
            userStates[sender].step = 'get_num';
            await client.sendMessage(sender, `✅ තේරුවා: ${userStates[sender].file}\n\nදැන් Target Number එක දෙන්න (947xxxxxxxx):`);
        }
    }
    else if (userStates[sender]?.step === 'get_num') {
        userStates[sender].target = text.includes('@c.us') ? text : `${text}@c.us`;
        userStates[sender].step = 'get_cnt';
        await client.sendMessage(sender, `දැන් මැසේජ් කීයක් යැවිය යුතුද? (Count):`);
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
