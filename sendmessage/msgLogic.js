// ... (උඩ කෑල්ල කලින් වගේමයි)

async function handleMessageSend(client, chatID, text, userStates) {
    let state = userStates[chatID];
    if (!state) return;

    // 1. Message Send Menu
    if (state.step === 'main' && text === '1') {
        state.step = 'choose_file';
        await client.sendMessage(chatID, `*📩 MESSAGE SEND MENU*\n\n1. Send 'cha'\n2. Send 'xeontext3'`);
        return;
    }

    // 2. Work Mode Selection
    if (state.step === 'main' && text === '2') {
        state.step = 'mode_selection'; // index.js එකේ අපි මේක check කරනවා
        await client.sendMessage(chatID, `*🌍 WORK MODE SETTINGS*\n\n1. Public (බොට් ඔක්කොටොම වැඩ)\n2. Private (බොට් මට විතරයි වැඩ)\n\n*අංකය රිප්ලයි කරන්න:*`);
        return;
    }

    // ... (අනිත් පියවරවල් කලින් වගේම තියාගන්න)
}
