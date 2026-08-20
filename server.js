const express = require('express');
const cors = require('cors');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

let isReady = false;
let qrCodeData = null;

// Initialize WhatsApp Client with LocalAuth to save session
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

// WhatsApp Client Events
client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    qrCodeData = qr;
    isReady = false;
    console.log('QR Code received, scan please!');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    isReady = true;
    qrCodeData = null;
});

client.on('authenticated', () => {
    console.log('WhatsApp Client Authenticated');
});

client.on('auth_failure', msg => {
    console.error('WhatsApp Client Authentication failure', msg);
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp Client was disconnected', reason);
    isReady = false;
});

// Express API Routes for WhatsApp Gateway

// Health check and status
app.get('/status', (req, res) => {
    if (isReady) {
        res.json({ status: 'connected', message: 'WhatsApp Gateway is ready.' });
    } else if (qrCodeData) {
        res.json({ status: 'waiting_qr', message: 'Waiting for QR Code scan.' });
    } else {
        res.json({ status: 'initializing', message: 'WhatsApp Client is initializing.' });
    }
});

// Endpoint to send message (compatible with Fonnte basic format)
app.post('/send', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ status: false, reason: 'Gateway not ready' });
    }

    try {
        const { target, message } = req.body;
        
        if (!target || !message) {
            return res.status(400).json({ status: false, reason: 'Missing target or message' });
        }

        // Format phone number to WhatsApp format (e.g., 62812xxx -> 62812xxx@c.us)
        // If target contains multiple numbers separated by comma, take the first one for simplicity 
        // (can be extended for bulk sending later)
        let formattedPhone = target.split(',')[0].trim();
        
        // Remove non-numeric characters (except + if any)
        formattedPhone = formattedPhone.replace(/\D/g, '');
        
        // Ensure it starts with country code (assuming Indonesia '62' if starts with '0')
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }
        
        const chatId = `${formattedPhone}@c.us`;

        // Send message
        await client.sendMessage(chatId, message);
        
        res.json({ status: true, message: 'Message sent successfully', target: formattedPhone });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ status: false, reason: error.message });
    }
});

// Serve the Vite Frontend (Static Files)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Catch-all route to serve index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Start the server and WhatsApp client
app.listen(port, () => {
    console.log(`Smart Bendahara Monolith Server listening at http://localhost:${port}`);
    client.initialize();
});
