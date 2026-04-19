const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const cha = require('../cha'); 
const xeontext3 = require('../xeontext3'); 

async function handleMessageSend(client, chatID, text, userStates) {
    try {
        const state = userStates[chatID];
        if (!state) return;

        // පියවර 1: සෙන්ඩ් මැසේජ් මෙනු එක පෙන්වීම
        if (state.step === 'main' && text === '1') {
            state.step = 'msg_choice';
            let msgMenu = `*--- 📩 MESSAGE SEND MENU ---*\n\n1. Send 'cha'\n2. Send 'xeontext3'\n\n*අංකය රිප්ලයි කරන්න:*`;
            await client.sendMessage(chatID, msgMenu);
            return; // මෙතනින් නවතිනවා ඊළඟ රිප්ලයි එක එනකල්
        }

        // පියවර 2: ෆයිල් එක තේරීම
        if (state.step === 'msg_choice') {
            if (text === '1' || text === '2') {
                state.file = (text === '1') ? 'cha' : 'xeontext3';
                state.step = 'get_num';
                await client.sendMessage(chatID, `✅ තේරුවා: ${state.file}\n\nදැන් Target Number එක දෙන්න (947xxxxxxxx):`);
            }
            return; // මෙතනින් නවතිනවා
        }

        // පියවර 3: Target Number එක ගැනීම
        if (state.step === 'get_num') {
            state.target = `${text.replace(/\s/g, '').replace('+', '')}@c.us`;
            state.step = 'get_cnt'; 
            await client.sendMessage(chatID, `✅ Target අංකය ලැබුණා.\n\nදැන් මැසේජ් කීයක් යැවිය යුතුද? (ගණන රිප්ලයි කරන්න):`);
            return; // මෙතනින් නවතිනවා
        }

        // පියවර 4: Count එක ගෙන මැසේජ් යැවීම
        if (state.step === 'get_cnt') {
            let count = parseInt(text);
            
            if (isNaN(count) || count <= 0) {
                await client.sendMessage(chatID, "❌ කරුණාකර වලංගු අංකයක් (Count) ලබා දෙන්න!");
                return;
            }

            let target = state.target;
            let body = (state.file === 'cha') ? cha : xeontext3;

            // වැදගත්: මැසේජ් යැවීමට පෙරම state එක අයින් කරනවා
            delete userStates[chatID]; 

            await client.sendMessage(chatID, `🚀 මැසේජ් ${count} ක් යැවීම ආරම්භ කළා...`);
            
            for (let i = 1; i <= count; i++) {
                try {
                    await client.sendMessage(target, body);
                    if (i < count) await new Promise(r => setTimeout(r, 2000)); // තත්පර 2ක පරතරය
                } catch (e) { console.log("Send error"); }
            }
            await client.sendMessage(chatID, `✅ සියල්ල යවා අවසන්!`);
        }
    } catch (err) { 
        console.error(err); 
        delete userStates[chatID];
    }
}

module.exports = { handleMessageSend };
