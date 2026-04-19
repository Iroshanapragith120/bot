const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');

// අපේ ෆයිල්ස් ටික මෙතනට ගමු
const cha = require('./cha');
const xeontext3 = require('./xeontext3');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// User ගේ තත්ත්වය (State) මතක තියාගන්න object එකක්
let userStates = {};

client.on('qr', (qr) => {
    console.log('\n--- QR එක SCAN කරන්න ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\nBot එක Ready! WhatsApp හරහා පාලනය කළ හැක.');
});

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const sender = msg.from;
    const text = msg.body.trim();

    // 1. ප්‍රධාන මෙනු එක පෙන්වීම
    if (text.toLowerCase() === '.menu') {
        userStates[sender] = { step: 'main_menu' };
        let menu = `*--- 🤖 MAIN MENU ---*\n\n`;
        menu += `1. Messagesend Menu\n`;
        menu += `2. (Soon)\n\n`;
        menu += `*අංකය ලබා දෙන්න:*`;
        await msg.reply(menu);
    }

    // 2. මැසේජ් යවන මෙනු එක (Sub-menu)
    else if (userStates[sender]?.step === 'main_menu' && text === '1') {
        userStates[sender] = { step: 'msg_menu' };
        let subMenu = `*--- 📩 MESSAGESEND MENU ---*\n\n`;
        subMenu += `1. Send 'cha' message\n`;
        subMenu += `2. Send 'xeontext3' message\n\n`;
        subMenu += `*තේරීම ලබා දෙන්න:*`;
        await msg.reply(subMenu);
    }

    // 3. මැසේජ් එක තේරීම සහ නම්බර් එක ඉල්ලීම
    else if (userStates[sender]?.step === 'msg_menu' && (text === '1' || text === '2')) {
        let selectedFile = (text === '1') ? 'cha' : 'xeontext3';
        userStates[sender] = { step: 'get_number', file: selectedFile };
        await msg.reply(`ඔබ තේරුවේ: ${selectedFile}\n\nදැන් පණිවිඩය යැවිය යුතු අංකය ලබා දෙන්න.\n*(උදා: 9474xxxxxxx)*`);
    }

    // 4. නම්බර් එක ලබාගෙන මැසේජ් ගණන ඉල්ලීම
    else if (userStates[sender]?.step === 'get_number') {
        let target = text.includes('@c.us') ? text : `${text}@c.us`;
        userStates[sender].target = target;
        userStates[sender].step = 'get_count';
        await msg.reply(`නම්බර් එක ස්ථිරයි ✅\n\nදැන් යැවිය යුතු වාර ගණන (Count) අංකයකින් ලබා දෙන්න:`);
    }

    // 5. අවසාන පියවර: මැසේජ් එක යැවීම
    else if (userStates[sender]?.step === 'get_count') {
        let count = parseInt(text) || 1;
        let selectedFile = userStates[sender].file;
        let target = userStates[sender].target;
        let messageToSend = (selectedFile === 'cha') ? cha : xeontext3;

        await msg.reply(`හරි! පණිවිඩ ${count} ක් යැවීම ආරම්භ කරනවා...`);

        try {
            const imagePath = path.join(__dirname, 'memory.jpg');
            const media = MessageMedia.fromFilePath(imagePath);

            for (let i = 1; i <= count; i++) {
                await client.sendMessage(target, media, { caption: messageToSend });
                if (i < count) await new Promise(res => setTimeout(res, 2000));
            }
            await msg.reply(`✅ සාර්ථකව යවා අවසන්!`);
        } catch (e) {
            // පින්තූරය නැත්නම් ටෙක්ස්ට් එක විතරක් යවනවා
            for (let i = 1; i <= count; i++) {
                await client.sendMessage(target, messageToSend);
                if (i < count) await new Promise(res => setTimeout(res, 2000));
            }
            await msg.reply(`✅ පින්තූරය රහිතව පණිවිඩය යවා අවසන්!`);
        }
        
        // වැඩේ ඉවර නිසා State එක අයින් කරනවා
        delete userStates[sender];
    }
});

client.initialize();
