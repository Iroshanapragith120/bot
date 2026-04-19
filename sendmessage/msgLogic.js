const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const cha = require('../cha'); 
const xeontext3 = require('../xeontext3'); 

async function handleMessageSend(client, chatID, text, userStates) {
    try {
        const imagePath = path.join(__dirname, '../image', 'README.jpg');
        let media;
        try { media = MessageMedia.fromFilePath(imagePath); } catch (e) { media = null; }

        const state = userStates[chatID];
        if (!state) return;

        // STEP 1: මෙනු එක පෙන්වීම
        if (state.step === 'send_msg_menu_start') {
            state.step = 'msg_choice';
            let msgMenu = `*--- 📩 MESSAGE SEND MENU ---*\n\n1. Send 'cha'\n2. Send 'xeontext3'\n\n*අංකය රිප්ලයි කරන්න:*`;
            await client.sendMessage(chatID, media || msgMenu, media ? { caption: msgMenu } : {});
        }

        // STEP 2: මැසේජ් එක තේරීම
        else if (state.step === 'msg_choice') {
            if (text === '1' || text === '2') {
                state.file = (text === '1') ? 'cha' : 'xeontext3';
                state.step = 'get_num';
                await client.sendMessage(chatID, `✅ තේරුවා: ${state.file}\n\nදැන් Target Number එක දෙන්න (947xxxxxxxx):`);
            }
        }

        // STEP 3: නම්බර් එක ගැනීම
        else if (state.step === 'get_num') {
            state.target = text.includes('@c.us') ? text : `${text.replace(/\s/g, '')}@c.us`;
            state.step = 'get_cnt'; 
            await client.sendMessage(chatID, `දැන් මැසේජ් කීයක් යැවිය යුතුද? (Count):`);
        }

        // STEP 4: මැසේජ් යැවීම
        else if (state.step === 'get_cnt') {
            let count = parseInt(text);
            if (isNaN(count)) {
                await client.sendMessage(chatID, "❌ කරුණාකර අංකයක් ලබා දෙන්න!");
                return;
            }

            let target = state.target;
            let body = (state.file === 'cha') ? cha : xeontext3;

            await client.sendMessage(chatID, `🚀 මැසේජ් ${count} ක් යැවීම ආරම්භ කළා...`);
            
            for (let i = 1; i <= count; i++) {
                try {
                    await client.sendMessage(target, media || body, media ? { caption: body } : {});
                    if (i < count) await new Promise(r => setTimeout(r, 2500));
                } catch (sendError) {
                    console.log(`Error on msg ${i}`);
                }
            }
            
            await client.sendMessage(chatID, `✅ සියල්ල යවා අවසන්!`);
            delete userStates[chatID];
        }
    } catch (err) {
        console.error("Logic Error:", err);
        delete userStates[chatID];
    }
}

module.exports = { handleMessageSend };
