const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');

async function handleMainMenu(client, sender, userStates) {
    userStates[sender] = { step: 'main' };
    
    const imagePath = path.join(__dirname, '../image', 'README.jpg');
    let media;
    try { media = MessageMedia.fromFilePath(imagePath); } catch (e) { media = null; }

    let mainMenu = `*--- 🤖 MAIN MENU ---*\n\n` +
                   `1. 📩 Message Send Menu\n` +
                   `2. 🔐 Owners Menu\n\n` +
                   `*අංකය රිප්ලයි කරන්න:*`;

    if (media) {
        await client.sendMessage(sender, media, { caption: mainMenu });
    } else {
        await client.sendMessage(sender, mainMenu);
    }
}

module.exports = { handleMainMenu };
