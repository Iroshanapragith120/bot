const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const cha = require('../cha'); 
const xeontext3 = require('../xeontext3'); 

async function handleMessageSend(client, chatID, text, userStates) {
    try {
        const state = userStates[chatID];
        if (!state) return;

        // Image එක ලෝඩ් කරගැනීම
        const imagePath = path.join(__dirname, '../image', 'README.jpg');
        let media;
        try { media = MessageMedia.fromFilePath(imagePath); } catch (e) { media = null; }

        // පියවර 1: ප්‍රධාන මෙනු එකෙන් 1 එබූ විට සෙන්ඩ් මැසේජ් මෙනු එක පෙන්වීම
        if (state.step === 'main' && text === '1') {
            state.step = 'msg_choice';
            let msgMenu = `*--- 📩 MESSAGE SEND MENU ---*\n\n1. Send 'cha'\n2. Send 'xeontext3'\n\n*අංකය රිප්ලයි කරන්න:*`;
            await client.sendMessage(chatID, media || msgMenu, media ? { caption: msgMenu } : {});
            return;
        }

        // පියවර 2: මැසේජ් වර්ගය (cha හෝ xeontext3) තේරීම
        if (state.step === 'msg_choice') {
            if (text === '1' || text === '2') {
                state.file = (text === '1') ? 'cha' : 'xeontext3';
                state.step = 'get_num';
                await client.sendMessage(chatID, `✅ තේරුවා: ${state.file}\n\nදැන් Target Number එක ලබා දෙන්න (947xxxxxxxx):`);
            } else {
                await client.sendMessage(chatID, "❌ වැරදි අංකයක්. කරුණාකර 1 හෝ 2 රිප්ලයි කරන්න.");
            }
            return;
        }

        // පියවර 3: Target Number එක ලබාගෙන Count එක ඉල්ලීම
        if (state.step === 'get_num') {
            let cleanNum = text.replace(/\s/g, '').replace('+', '');
            state.target = `${cleanNum}@c.us`;
            state.step = 'get_cnt'; 
            await client.sendMessage(chatID, `✅ Target: ${cleanNum}\n\nදැන් මැසේජ් කීයක් යැවිය යුතුද? (ගණන ඇතුළත් කරන්න):`);
            return;
        }

        // පියවර 4: Count එක ලබාගෙන මැසේජ් යැවීම ආරම්භ කිරීම
        if (state.step === 'get_cnt') {
            let count = parseInt(text);
            if (isNaN(count) || count <= 0) {
                await client.sendMessage(chatID, "❌ කරුණාකර වලංගු අංකයක් (Count) ලබා දෙන්න!");
                return;
            }

            let target = state.target;
            let body = (state.file === 'cha') ? cha : xeontext3;

            await client.sendMessage(chatID, `🚀 මැසේජ් ${count} ක් ${target} වෙත යැවීම ආරම්භ කළා...`);
            
            for (let i = 1; i <= count; i++) {
                try {
                    // මැසේජ් එක යැවීම
                    await client.sendMessage(target, body);
                    console.log(`[${i}/${count}] Sent to ${target}`);
                    
                    // තත්පර 2ක පරතරයක් (WhatsApp Block නොවීමට)
                    if (i < count) await new Promise(r => setTimeout(r, 2000));
                } catch (sendError) {
                    console.error(`Error on msg ${i}:`, sendError.message);
                }
            }
            
            await client.sendMessage(chatID, `✅ සියලුම පණිවිඩ යවා අවසන්!`);
            delete userStates[chatID]; // වැඩේ ඉවර නිසා State එක clear කරනවා
        }

    } catch (err) {
        console.error("Logic Error:", err);
        delete userStates[chatID];
    }
}

module.exports = { handleMessageSend };
