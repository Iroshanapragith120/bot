const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

global.owners = [`${config.OWNER_NUMBER}@c.us` || '94789630165@c.us']; 
global.workMode = config.WORK_MODE || 'private';

async function startBot() {
    console.log("\n--- 🤖 PODDA-MD TERMINAL MENU ---");
    console.log("1. Login with Session ID (from Config)");
    console.log("2. Login with QR Code");
    console.log("3. Login with Pairing Code");
    
    const choice = await askQuestion("\nSelect an option (1-3): ");

    // --- SESSION ID HANDLING (Option 1) ---
    if (choice === '1') {
        console.log("🚀 Initializing with Session ID...");
        if (!config.SESSION_ID || !config.SESSION_ID.startsWith('PODDA-MD;;;')) {
            console.log("❌ Error: Valid Session ID not found in config.js!");
            process.exit(1);
        }
        
        // සෙෂන් අයිඩි එකෙන් ලොග් වෙද්දී බ්‍රවුසර් එක රන් වෙන්න ටික වෙලාවක් යයි
        console.log("⏳ Connecting to WhatsApp... Please wait.");
    }

    const client = new Client({
        authStrategy: new LocalAuth({ dataPath: './setting' }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--no-zygote'
            ]
        }
    });

    client.on('qr', (qr) => {
        if (choice === '2') {
            console.log('\n🔥 SCAN THIS QR CODE:');
            qrcode.generate(qr, { small: true });
        } else if (choice === '3') {
            console.log('\n🔥 PAIRING MODE: Check your phone for notification.');
        }
    });

    client.on('ready', () => {
        console.log('\n✅ PODDA-MD CONNECTED SUCCESSFULLY!');
        console.log('Type ".menu" in your WhatsApp to start.');
    });

    client.on('authenticated', () => {
        console.log('👍 Authenticated!');
    });

    client.on('auth_failure', msg => {
        console.error('❌ AUTHENTICATION FAILURE:', msg);
    });

    // Message Logic
    client.on('message_create', async (msg) => {
        if (msg.body === '.menu') {
            await client.sendMessage(msg.from, "*🤖 PODDA-MD ACTIVE*");
        }
    });

    client.initialize().catch(err => {
        console.error("❌ Failed to initialize:", err.message);
    });
}

startBot();