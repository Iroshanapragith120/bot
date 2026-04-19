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

        if (state.step === 'send_msg_menu_start') {
            state.step = 'msg_choice';
            let msgMenu = `*--- 📩 MESSAGE SEND MENU ---*\n\n1. Send 'cha'\n2. Send 'xeontext3'\n\n*Reply number:*`;
            await client.sendMessage(chatID, media || msgMenu, media ? { caption: msgMenu } : {});
        }
        else if (state.step === 'msg_choice') {
            if (text === '1' || text === '2') {
                state.file = (text === '1') ? 'cha' : 'xeontext3';
                state.step = 'get_num';
                await client.sendMessage(chatID, `✅ තේරුවා: ${state.file}\n\nTarget Number එක (947xxxxxxxx):`);
            }
        }
        else if (state.step === 'get_num') {
            state.target = text.includes('@c.us') ? text : `${text.replace(/\s/g, '')}@c.us`;
            state.step = 'get_cnt';
            await client.sendMessage(chatID, `මැසේජ් කීයක් යැවිය යුතුද? (Count):`);
        }
        else if (state.step === 'get_cnt') {
            let count = parseInt(text) || 1;
            let target = state.target;
            let body = (state.file === 'cha') ? cha : xeontext3;

            await client.sendMessage(chatID, `🚀 මැසේජ් ${count} ක් යැවීම ආරම්භ කළා...`);
            
            for (let i = 1; i <= count; i++) {
                try {
                    await client.sendMessage(target, media || body, media ? { caption: body } : {});
                    if (i < count) await new Promise(r => setTimeout(r, 2500));
                } catch (e) { console.log(`Error on msg ${i}`); }
            }
            await client.sendMessage(chatID, `✅ අවසන්!`);
            delete userStates[chatID];
        }
    } catch (err) {
        console.error(err);
        delete userStates[chatID];
    }
}

module.exports = { handleMessageSend };
