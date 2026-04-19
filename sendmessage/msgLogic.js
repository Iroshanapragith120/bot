const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const cha = require('../cha'); 
const xeontext3 = require('../xeontext3'); 

async function handleMessageSend(client, chatID, text, userStates) {
    try {
        const state = userStates[chatID];
        if (!state) return;

        // STEP 1: Main Menu එකෙන් 1 එබීම
        if (state.step === 'main' && text === '1') {
            state.step = 'msg_choice';
            let msgMenu = `*--- 📩 MESSAGE SEND MENU ---*\n\n1. Send 'cha'\n2. Send 'xeontext3'\n\n*අංකය රිප්ලයි කරන්න:*`;
            await client.sendMessage(chatID, msgMenu);
            return;
        }

        // STEP 2: මැසේජ් වර්ගය තේරීම
        if (state.step === 'msg_choice') {
            if (text === '1' || text === '2') {
                state.file = (text === '1') ? 'cha' : 'xeontext3';
                state.step = 'get_num';
                await client.sendMessage(chatID, `✅ තේරුවා: ${state.file}\n\nදැන් Target Number එක දෙන්න (947xxxxxxxx):`);
            }
            return;
        }

        // STEP 3: Target Number එක ගැනීම
        if (state.step === 'get_num') {
            state.target = `${text.replace(/\s/g, '').replace('+', '')}@c.us`;
            state.step = 'get_cnt'; 
            await client.sendMessage(chatID, `✅ Target සෙට් වුණා.\n\nදැන් මැසේජ් කීයක් යැවිය යුතුද? (Count):`);
            return;
        }

        // STEP 4: Count එක ගෙන මැසේජ් යැවීම (මෙතනයි Error එක තිබුණේ)
        if (state.step === 'get_cnt') {
            let count = parseInt(text);
            if (isNaN(count) || count <= 0) {
                await client.sendMessage(chatID, "❌ කරුණාකර අංකයක් (Count) ලබා දෙන්න!");
                return;
            }

            // වැදගත්: මැසේජ් යැවීමට පෙර State එක වෙනස් කරනවා, නැත්නම් Loop වෙනවා
            let target = state.target;
            let body = (state.file === 'cha') ? cha : xeontext3;
            delete userStates[chatID]; // පියවර අවසන් නිසා මෙතනම අයින් කරනවා

            await client.sendMessage(chatID, `🚀 මැසේජ් ${count} ක් යැවීම ආරම්භ කළා...`);
            
            for (let i = 1; i <= count; i++) {
                try {
                    await client.sendMessage(target, body);
                    if (i < count) await new Promise(r => setTimeout(r, 2000));
                } catch (e) { console.log("Send error"); }
            }
            await client.sendMessage(chatID, `✅ ක්‍රියාවලිය අවසන්!`);
        }
    } catch (err) { 
        console.error(err); 
        delete userStates[chatID];
    }
}

module.exports = { handleMessageSend };
