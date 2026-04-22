const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const { handleMainMenu } = require('./mainmenu/mainLogic');
const { handleMessageSend } = require('./sendmessage/msgLogic');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './setting' }),
    puppeteer: { headless: true, args: ['--no-sandbox'] }
});

global.owners = [`${config.OWNER_NUMBER}@c.us` || '94741433513@c.us']; 
global.workMode = config.WORK_MODE; // පබ්ලික් ද ප්‍රයිවට් ද කියලා බලාගන්න
let userStates = {};

client.on('ready', () => console.log('\n✅ Bot is Online!'));
client.on('qr', (qr) => qrcode.generate(qr, { small: true }));

client.on('message_create', async (msg) => {
    try {
        if (msg.fromMe && !msg.body.startsWith('.')) return;

        const chatID = msg.from; // 🎯 මැසේජ් එක එන චැට් එකටම රිප්ලයි කරන්න මේක ගත්තා
        const text = msg.body.trim();
        const isOwner = global.owners.includes(msg.from) || msg.fromMe;

        // --- WORK MODE LOGIC ---
        // ප්‍රයිවට් මෝඩ් එකේදී ඕනර් නෙවෙයි නම් බොට් සයිලන්ට්
        if (global.workMode === 'private' && !isOwner) return;

        // Command: .menu
        if (text.toLowerCase() === '.menu' || text.toLowerCase() === 'menu') {
            await handleMainMenu(client, chatID, userStates);
            return;
        }

        // Mode Switch (Owner ට විතරයි පුළුවන්)
        if (isOwner && userStates[chatID]?.step === 'mode_selection') {
            if (text === '1') {
                global.workMode = 'public';
                await client.sendMessage(chatID, "🌍 බොට් දැන් **Public** (ඔක්කොටොම වැඩ)!");
            } else if (text === '2') {
                global.workMode = 'private';
                await client.sendMessage(chatID, "🔒 බොට් දැන් **Private** (ඕනර්ට විතරයි)!");
            }
            delete userStates[chatID];
            return;
        }

        // අනිත් මෙනූ ලොජික් (Message sending etc.)
        if (userStates[chatID]) {
            await handleMessageSend(client, chatID, text, userStates);
        }

    } catch (e) { console.error(e); }
});

client.initialize();
