async function handleMainMenu(client, chatID, userStates) {
    userStates[chatID] = { step: 'main' };
    
    let menuMsg = `*--- 🤖 MAIN MENU ---*\n\n` +
                  `1. 📩 Message Send Menu\n` +
                  `2. ⚙️ Work Mode (Public/Private)\n\n` +
                  `*වර්තමාන මෝඩ් එක:* ${global.workMode.toUpperCase()}\n\n` +
                  `*අංකය රිප්ලයි කරන්න:*`;

    await client.sendMessage(chatID, menuMsg);
}

module.exports = { handleMainMenu };
