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

// බොට්ගේ තත්ත්වයන් මතක තබා ගැනීමට
let userStates = {};
let botSettings = {
    mode: 'public', // default mode එක (private / public / group)
    owner: '94789630165@c.us' // මෙතනට උඹේ WhatsApp ID එක දාපන් (උදා: 94741433513@c.us)
};

client.on('qr', (qr) => {
    console.log('\n--- QR එක SCAN කරන්න ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\nBot එක Ready! Mode: ' + botSettings.mode);
});

client.on('message', async (msg) => {
    const sender = msg.from;
    const isGroup = sender.endsWith('@g.us');
    const text = msg.body.trim().toLowerCase();
    const isOwner = sender === botSettings.owner;

    // --- PERMISSION CHECK ---
    if (botSettings.mode === 'private' && !isOwner) return; // Private නම් owner ට විතරයි
    if (botSettings.mode === 'group' && !isGroup && !isOwner) return; // Group නම් groups වලට විතරයි

    const imagePath = path.join(__dirname, 'memory.jpg');
    let media;
    try { media = MessageMedia.fromFilePath(imagePath); } catch (e) { media = null; }

    // 1. MAIN MENU (.menu)
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

    // 3. MODE MENU ක්‍රියාත්මක කිරීම (මෙය කළ හැක්කේ OWNER ට පමණි)
    else if (userStates[sender]?.step === 'mode_menu') {
        if (!isOwner) {
            await msg.reply("සමාවෙන්න, මෝඩ් එක වෙනස් කළ හැක්කේ බොට්ගේ අයිතිකරුට පමණි!");
            delete userStates[sender];
            return;
        }
        if (text === '1') botSettings.mode = 'private';
        else if (text === '2') botSettings.mode = 'public';
        else if (text === '3') botSettings.mode = 'group';

        await msg.reply(`✅ බොට් දැන් *${botSettings.mode.toUpperCase()}* මෝඩ් එකට මාරු වුණා.`);
        delete userStates[sender];
    }

    // 4. MESSAGE SEND ලොජික් එක (කලින් තිබූ විදියටම)
    else if (userStates[sender]?.step === 'send_msg_menu') {
        if (text === '1' || text === '2') {
            userStates[sender].file = (text === '1') ? 'cha' : 'xeontext3';
            userStates[sender].step = 'get_num';
            await msg.reply(`✅ තේරුවා: ${userStates[sender].file}\n\nදැන් Target Number එක දෙන්න (947xxxxxxxx):`);
        }
    }
    else if (userStates[sender]?.step === 'get_num') {
        userStates[sender].target = text.includes('@c.us') ? text : `${text}@c.us`;
        userStates[sender].step = 'get_cnt';
        await msg.reply(`දැන් මැසේජ් කීයක් යැවිය යුතුද? (Count):`);
    }
    else if (userStates[sender]?.step === 'get_cnt') {
        let count = parseInt(text) || 1;
        let target = userStates[sender].target;
        let body = (userStates[sender].file === 'cha') ? cha : xeontext3;

        await msg.reply(`මැසේජ් ${count} ක් යැවීම ආරම්භ කළා... 🚀`);
        for (let i = 1; i <= count; i++) {
            await client.sendMessage(target, media || body, media ? { caption: body } : {});
            if (i < count) await new Promise(r => setTimeout(r, 2500));
        }
        await msg.reply(`✅ සාර්ථකව යවා අවසන්!`);
        delete userStates[sender];
    }
});

client.initialize();
