const cha = require('../cha'); 
const xeontext3 = require('../xeontext3'); 

async function handleMessageSend(client, chatID, text, userStates) {
    try {
        let state = userStates[chatID];
        if (!state) return;

        // පියවර 1: Main Menu එකේ '1' එබුවම එන පණිවිඩය
        if (state.step === 'main' && text === '1') {
            state.step = 'choose_file';
            let msg = `*📩 MESSAGE SEND MENU*\n\n` +
                      `1. Send 'cha' File\n` +
                      `2. Send 'xeontext3' File\n\n` +
                      `*අංකය රිප්ලයි කරන්න:*`;
            await client.sendMessage(chatID, msg);
            return;
        }

        // පියවර 2: File එක තේරීම
        if (state.step === 'choose_file') {
            if (text === '1' || text === '2') {
                state.selectedFile = (text === '1') ? 'cha' : 'xeontext3';
                state.step = 'ask_number';
                await client.sendMessage(chatID, `✅ ඔබ තේරුවේ: *${state.selectedFile}*\n\nදැන් Target අංකය ලබා දෙන්න (උදා: 947xxxxxxxx):`);
            } else {
                await client.sendMessage(chatID, "❌ වැරදි අංකයක්. කරුණාකර 1 හෝ 2 රිප්ලයි කරන්න.");
            }
            return;
        }

        // පියවර 3: අංකය ලබා ගැනීම
        if (state.step === 'ask_number') {
            let targetNum = text.replace(/[+-\s]/g, '');
            if (targetNum.length < 9) {
                await client.sendMessage(chatID, "❌ අංකය වැරදියි. නැවත ලබා දෙන්න:");
                return;
            }
            state.target = `${targetNum}@c.us`;
            state.step = 'ask_count';
            await client.sendMessage(chatID, `🎯 Target: ${targetNum}\n\nදැන් මැසේජ් කීයක් යැවිය යුතුද? (ගණන ලබා දෙන්න):`);
            return;
        }

        // පියවර 4: වාර ගණන ගෙන වැඩේ පටන් ගැනීම
        if (state.step === 'ask_count') {
            let count = parseInt(text);
            if (isNaN(count) || count <= 0) {
                await client.sendMessage(chatID, "❌ කරුණාකර වලංගු අංකයක් ලබා දෙන්න!");
                return;
            }

            let finalTarget = state.target;
            let finalBody = (state.selectedFile === 'cha') ? cha : xeontext3;

            // වැඩේ පටන් ගන්න කලින් state එක clear කරනවා loop නොවෙන්න
            delete userStates[chatID]; 

            await client.sendMessage(chatID, `🚀 ${finalTarget} වෙත මැසේජ් ${count} ක් යැවීම ආරම්භ කළා...`);

            for (let i = 1; i <= count; i++) {
                try {
                    await client.sendMessage(finalTarget, finalBody);
                    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay
                } catch (e) { console.log("Error sending message " + i); }
            }

            await client.sendMessage(chatID, `✅ මැසේජ් ${count} ම සාර්ථකව යවා අවසන්!`);
        }
    } catch (err) {
        console.error(err);
        delete userStates[chatID];
    }
}

module.exports = { handleMessageSend };
