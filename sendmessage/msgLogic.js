// sendmessage/msgLogic.js

const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const cha = require('../cha'); // root එකේ තියෙන cha.js
const xeontext3 = require('../xeontext3'); // root එකේ තියෙන xeontext3.js

async function handleMessageSend(client, sender, text, userStates) {
    const imagePath = path.join(__dirname, '../image', 'README.jpg');
    let media;
    try { media = MessageMedia.fromFilePath(imagePath); } catch (e) { media = null; }

    // STEP 1: මෙනු එක පෙන්වීම
    if (userStates[sender].step === 'send_msg_menu_start') {
        userStates[sender].step = 'msg_choice';
        let msgMenu = `*--- 📩 MESSAGE SEND MENU ---*\n\n` +
                      `1. Send 'cha'\n` +
                      `2. Send 'xeontext3'\n\n` +
                      `*අංකය රිප්ලයි කරන්න:*`;
        await client.sendMessage(sender, media || msgMenu, media ? { caption: msgMenu } : {});
    }

    // STEP 2: මැසේජ් එක තේරීම
    else if (userStates[sender].step === 'msg_choice') {
        if (text === '1' || text === '2') {
            userStates[sender].file = (text === '1') ? 'cha' : 'xeontext3';
            userStates[sender].step = 'get_num';
            await client.sendMessage(sender, `✅ තේරුවා: ${userStates[sender].file}\n\nදැන් Target Number එක දෙන්න (947xxxxxxxx):`);
        }
    }

    // STEP 3: නම්බර් එක ලබා ගැනීම
    else if (userStates[sender].step === 'get_num') {
        userStates[sender].target = text.includes('@c.us') ? text : `${text}@c.us`;
        userStates[sender].step = 'get_cnt';
        await client.sendMessage(sender, `දැන් මැසේජ් කීයක් යැවිය යුතුද? (Count):`);
    }

    // STEP 4: අවසාන වශයෙන් මැසේජ් යැවීම
    else if (userStates[sender].step === 'get_cnt') {
        let count = parseInt(text) || 1;
        let target = userStates[sender].target;
        let body = (userStates[sender].file === 'cha') ? cha : xeontext3;

        await client.sendMessage(sender, `🚀 මැසේජ් ${count} ක් යැවීම ආරම්භ කළා...`);
        
        for (let i = 1; i <= count; i++) {
            await client.sendMessage(target, media || body, media ? { caption: body } : {});
            if (i < count) await new Promise(r => setTimeout(r, 2500));
        }
        
        await client.sendMessage(sender, `✅ සියල්ල සාර්ථකව යවා අවසන්!`);
        delete userStates[sender]; // වැඩේ ඉවර නිසා state එක අයින් කරනවා
    }
}

module.exports = { handleMessageSend };
