// server based on parsing
const express = require('express');
const https = require('https');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

// for front-files delivery
const app = express();

app.use(express.static('front2'));
app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname,"front2","index.html"))
})
// // SSL/TLS certificate and key
// const sslKey = fs.readFileSync('ssl-key.pem');
// const sslCert = fs.readFileSync('ssl-cert.pem');

// const server = https.createServer({ key: sslKey, cert: sslCert }, app);

const server = http.createServer(app);

// Create a WebSocket server for chat processing
const wss = new WebSocket.Server({ server });

// Load the keyword-response pairs from a JSON file
const getResponses = () => {
    const data = fs.readFileSync('responses.json');
    return JSON.parse(data);
};

// Keyword-spotting function
const handleUserInput = (messageHistory) => {
    const userMessage = messageHistory[messageHistory.length - 1].content.toLowerCase();
    const responses = getResponses()["responses"];
    console.log(responses);


    for (let entry of responses) {
        for (let keyword of entry.keywords) {
            if (userMessage.includes(keyword)) {
                return entry.response;
            }
        }
    }
    return "Sorry, I don't understand.";
};

wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('message', async message => {

        const { messageHistory } = JSON.parse(message);
        console.log(messageHistory);

        try {
            const result = handleUserInput(messageHistory);
            console.log('AI Response:', result);

            ws.send(JSON.stringify({ response: result }));
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({ error: 'Failed to process the message' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(3000, () => {
    console.log('HTTPS server running on port 3000');
});
