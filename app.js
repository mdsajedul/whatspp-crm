// Import Express.js
const express = require('express');
const axios = require('axios');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

const sendWhatsAppMessage = async (to, message)=> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

    try {
        await axios.post(url, {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: { body: message }
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` 
            }
        });

        console.log(`Message sent to ${to}: ${message}`);
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    }
}

// Route for GET requests
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Route for POST requests
app.post('/', (req, res) => {
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    console.log(`\n\nWebhook received ${timestamp}\n`);
    console.log(JSON.stringify(req.body, null, 2));
    const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (message) {
        const from = message.from;
        const msgBody = message.text?.body || 'No text content';
        console.log(`Message from ${from}: ${msgBody}`);
        sendWhatsAppMessage(from, `You said: ${msgBody}`);
    }
    res.sendStatus(200);
});

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});