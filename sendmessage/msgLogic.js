const cha = require('../cha'); 
const xeontext3 = require('../xeontext3'); 

async function handleMessageSend(client, chatID, text, userStates) {
    try {
        let state = userStates[chatID];
        if (!state) return;

        // පියවර 1: Main Menu එකෙන් 1 තේරුවම Message Send Menu පෙන්වීම
        if (state.step === 'main' && text === '1') {
            state.step = 'choose_file';
            let msg = `*📩 MESSAGE SEND MENU*\n\n` +
                      `1. Send 'cha' File\n` +
                      `2. Send 'xeontext3' File\n\n` +
                      `*අංකය රිප්ලයි කරන්න:*`;
            await client.sendMessage(chatID, msg);
            return;
        }

        // පියවර 2: යවන මැසේජ් එක (File) තෝරා ගැනීම
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

        // පියවර 3: Target අංකය ලබා ගැනීම
        if (state.step === 'ask_number') {
            let targetNum = text.replace(/[+-\s]/g, '');
            if (targetNum.length < 10) {
                await client.sendMessage(chatID, "❌ අංකය වැරදියි. නැවත ලබා දෙන්න:");
                return;
            }
            state.target = `${targetNum}@c.us`;
            state.step = 'ask_count';
            await client.sendMessage(chatID, `🎯 Target: ${targetNum}\n\nදැන් මැසේජ් කීයක් යැවිය යුතුද? (ගණන ලබා දෙන්න):`);
            return;
        }

        // පියවර 4: Count එක ගෙන මැසේජ් යැවීම ආරම්භ කිරීම
        if (state.step === 'ask_count') {
            let count = parseInt(text);
            if (isNaN(count) || count <= 0) {
                await client.sendMessage(chatID, "❌ කරුණාකර වලංගු අංකයක් ලබා දෙන්න!");
                return;
            }

            // වැඩේ පටන් ගන්නවා - State එක අයින් කරනවා ඊළඟට මැසේජ් logic එකට නොවදින්න
            let finalTarget = state.target;
            let finalBody = (state.selectedFile === 'cha') ? cha : xeontext3;
            delete userStates[chatID]; 

            await client.sendMessage(chatID, `🚀 ${finalTarget} වෙත මැසේජ් ${count} ක් යැවීම ආර
