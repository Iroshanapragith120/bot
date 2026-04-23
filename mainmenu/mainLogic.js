const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

async function handleMainMenu(client, chatID, userStates) {
    try {
        userStates[chatID] = { step: 'main' };
        
        // පින්තූරය තියෙන තැන (උඹේ ෆෝල්ඩර් එකට අනුව චෙක් කරගනින්)
        const imagePath = path.join(__dirname, '../image/README.jpg');
        let media = null;

        if (fs.existsSync(imagePath)) {
            media = MessageMedia.fromFilePath(imagePath);
        }

        let menuMsg = `*--- 🤖 MAIN MENU ---*\n\n` +
                      `1. 📩 Message Send Menu\n` +
                      `2. ⚙️ Work Mode (Public/Private)\n\n` +
                      `*Current Mode:* ${global.workMode.toUpperCase()}\n\n` +
                      `*අංකය රිප්ලයි කරන්න:*`;

        if (media) {
            await client.sendMessage(chatID, media, { caption: menuMsg });
        } else {
            await client.sendMessage(chatID, menuMsg);
        }
    } catch (e) {
        console.error("Menu Error:", e);
        await client.sendMessage(chatID, "❌ මෙනූ එක පෙන්වීමේ දෝෂයක්!");
    }
}

module.exports = { handleMainMenu };
