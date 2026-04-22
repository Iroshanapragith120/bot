const cha = require('../cha'); 
const xeontext3 = require('../xeontext3'); 

async function handleMessageSend(client, chatID, text, userStates) {
    try {
        const state = userStates[chatID];
        if (!state) return;

        // Step 1: Sub Menu
        if (state.step === 'main' && text === '1') {
            state.step = 'msg_choice';
            await client.sendMessage(chatID, `*--- 📩 MESSAGE SEND MENU ---*\n\n1. Send 'cha'\n2. Send 'xeontext3'\n\n*අංකය රිප්ලයි කරන්න:*`);
            return;
        }

        // Step 2: Choose File
        if (state.step === 'msg_choice') {
            if (text === '1' || text === '2') {
                state.file = (text === '1') ? 'cha' : 'xeontext3';
                state.step = 'get_num';
                await client.sendMessage(chatID, `✅ තේරුවා: ${state.file}\n\nදැන් Target Number එක දෙන්න (947xxxxxxxx):`);
            }
            return;
        }

        // Step 3: Target Number
        if (state.step === 'get_num') {
            state.target = `${text.replace(/[+-\s]/g, '')}@c.us`;
            state.step = 'get_cnt'; 
            await client.sendMessage(chatID, `✅ Target අංකය ලැබුණා.\n\nදැන් මැසේජ් කීයක් යැවිය යුතුද? (ගණන රිප්ලයි කරන්න):`);
            return;
        }

        // Step 4: Final Send
        if (state.step === 'get_cnt') {
            let count = parseInt(text);
            if (isNaN(count) || count <= 0) {
                await client.sendMessage(chatID, "❌ කරුණාකර වලංගු අංකයක් (Count) ලබා දෙන්න!");
                return;
            }

            let target = state.target;
            let body = (state.file === 'cha') ? cha : xeontext3;

            // වැඩේ පටන් ගන්න කලින් state එක clear කරමු (Loop වැළැක්වීමට)
            delete userStates[chatID];

            await client.sendMessage(chatID, `🚀 මැසේජ් ${count} ක් යැවීම ආරම්භ කළා...`);
            
            for (let i = 1; i <= count; i++) {
                try {
                    await client.sendMessage(target, body);
                    if (i < count) await new Promise(r => setTimeout(r, 1500)); // 1.5s delay
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
