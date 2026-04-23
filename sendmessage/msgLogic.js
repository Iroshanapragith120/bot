const cha = require('../cha'); 
const xeontext3 = require('../xeontext3'); 

async function handleMessageSend(client, chatID, text, userStates) {
    let state = userStates[chatID];
    if (!state) return;

    // 1. Message Send Menu එකට යාම
    if (state.step === 'main' && text === '1') {
        state.step = 'choose_file';
        await client.sendMessage(chatID, `*📩 MESSAGE SEND MENU*\n\n1. Send 'cha'\n2. Send 'xeontext3'\n\n*අංකය රිප්ලයි කරන්න:*`);
        return;
    }

    // 2. Work Mode settings වලට යාම
    if (state.step === 'main' && text === '2') {
        state.step = 'mode_selection';
        await client.sendMessage(chatID, `*🌍 WORK MODE SETTINGS*\n\n1. Public (ඔක්කොටොම වැඩ)\n2. Private (මට විතරයි වැඩ)\n\n*අංකය රිප්ලයි කරන්න:*`);
        return;
    }

    // --- Message Sending Flow ---
    if (state.step === 'choose_file') {
        if (text === '1' || text === '2') {
            state.selectedFile = (text === '1') ? 'cha' : 'xeontext3';
            state.step = 'ask_number';
            await client.sendMessage(chatID, `✅ තේරුවේ: ${state.selectedFile}\n\nTarget Number එක දෙන්න (947xxxxxxxx):`);
        }
        return;
    }

    if (state.step === 'ask_number') {
        state.target = `${text.replace(/[+-\s]/g, '')}@c.us`;
        state.step = 'ask_count';
        await client.sendMessage(chatID, `🔢 මැසේජ් කීයක් යැවිය යුතුද?`);
        return;
    }

    if (state.step === 'ask_count') {
        let count = parseInt(text);
        let finalBody = (state.selectedFile === 'cha') ? cha : xeontext3;
        let finalTarget = state.target;
        
        delete userStates[chatID]; // වැඩේ ඉවර නිසා Clear කරනවා

        await client.sendMessage(chatID, `🚀 මැසේජ් ${count} යැවීම ඇරඹුනා...`);
        for (let i = 0; i < count; i++) {
            await client.sendMessage(finalTarget, finalBody);
            await new Promise(r => setTimeout(r, 1500));
        }
        await client.sendMessage(chatID, "✅ අවසන්!");
    }
}

module.exports = { handleMessageSend };
