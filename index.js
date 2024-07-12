// server.js

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Initial state of Tamagotchi
let tamagotchiState = {
    faim: 50,
    bonheur: 50,
    energie: 50,
    lastFed: null,
    lastPlayed: null,
    lastRested: null,
    canFeed: true,
    canPlay: true,
    canRest: true,
    timeToFeed: 0,
    timeToPlay: 0,
    timeToRest: 0,
    age: 0,
    level: 1,
    levelUpTimer: null
};

// Function to generate a random number between min and max (inclusive)
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to handle feeding action
async function nourrirTamagotchi() {
    return new Promise(resolve => {
        if (!tamagotchiState.canFeed) {
            resolve(); // Action not available yet
            return;
        }

        let pointsToAdd = getRandomNumber(5, 15);
        tamagotchiState.faim = Math.min(100, tamagotchiState.faim + pointsToAdd);
        tamagotchiState.bonheur = Math.min(100, tamagotchiState.bonheur + 5);
        tamagotchiState.lastFed = Date.now();
        tamagotchiState.canFeed = false;
        tamagotchiState.timeToFeed = 15; // Reset timer for next feeding (in seconds)

        setTimeout(() => {
            tamagotchiState.canFeed = true;
            resolve(); // Resolve promise after timeout
            broadcastState(); // Broadcast updated state to all clients
        }, tamagotchiState.timeToFeed * 1000);
    });
}

// Function to handle playing action
async function jouerAvecTamagotchi() {
    return new Promise(resolve => {
        if (!tamagotchiState.canPlay) {
            resolve(); // Action not available yet
            return;
        }

        tamagotchiState.bonheur = Math.min(100, tamagotchiState.bonheur + 10);
        tamagotchiState.energie = Math.max(0, tamagotchiState.energie - 5);
        tamagotchiState.lastPlayed = Date.now();
        tamagotchiState.canPlay = false;
        tamagotchiState.timeToPlay = 15; // Reset timer for next play (in seconds)

        setTimeout(() => {
            tamagotchiState.canPlay = true;
            resolve(); // Resolve promise after timeout
            broadcastState(); // Broadcast updated state to all clients
        }, tamagotchiState.timeToPlay * 1000);
    });
}

// Function to handle resting action
async function reposerTamagotchi() {
    return new Promise(resolve => {
        if (!tamagotchiState.canRest) {
            resolve(); // Action not available yet
            return;
        }

        tamagotchiState.energie = Math.min(100, tamagotchiState.energie + 10);
        tamagotchiState.bonheur = Math.max(0, tamagotchiState.bonheur - 5);
        tamagotchiState.lastRested = Date.now();
        tamagotchiState.canRest = false;
        tamagotchiState.timeToRest = 15; // Reset timer for next rest (in seconds)

        setTimeout(() => {
            tamagotchiState.canRest = true;
            resolve(); // Resolve promise after timeout
            broadcastState(); // Broadcast updated state to all clients
        }, tamagotchiState.timeToRest * 1000);
    });
}

// Function to decrease a random attribute every second
function decreaseRandomAttribute() {
    const attributes = ['faim', 'bonheur', 'energie'];
    const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];
    tamagotchiState[randomAttribute] = Math.max(0, tamagotchiState[randomAttribute] - 2);

    if (tamagotchiState.faim === 0 || tamagotchiState.bonheur === 0 || tamagotchiState.energie === 0) {
        console.log('AmiAmi est mort !');
    }
    broadcastState(); // Broadcast updated state to all clients
}

// Function to check and update the level
function checkAndUpdateLevel() {
    const isAllAboveZero = tamagotchiState.faim > 0 && tamagotchiState.bonheur > 0 && tamagotchiState.energie > 0;

    if (isAllAboveZero && !tamagotchiState.levelUpTimer) {
        tamagotchiState.levelUpTimer = setTimeout(() => {
            const isStillAboveZero = tamagotchiState.faim > 0 && tamagotchiState.bonheur > 0 && tamagotchiState.energie > 0;
            if (isStillAboveZero) {
                tamagotchiState.level++;
                broadcastState(); // Notify clients of level up
                console.log(`Level Up! New Level: ${tamagotchiState.level}`);
            }
            tamagotchiState.levelUpTimer = null;
        }, 30000);
    } else if (!isAllAboveZero && tamagotchiState.levelUpTimer) {
        clearTimeout(tamagotchiState.levelUpTimer);
        tamagotchiState.levelUpTimer = null;
    }
}

// Set interval to decrease random attribute every 1.5 seconds and check level
setInterval(() => {
    decreaseRandomAttribute();
    checkAndUpdateLevel();
}, 1500);

// Function to get a copy of the tamagotchi state without circular references
function getTamagotchiStateForClient() {
    const { levelUpTimer, ...stateForClient } = tamagotchiState;
    return stateForClient;
}

// Endpoint to get Tamagotchi state
app.get('/tamagotchi', (_, res) => {
    res.json(getTamagotchiStateForClient());
});

// Restart Tamagotchi state function
function restartTamagotchi() {
    tamagotchiState = {
        faim: 50,
        bonheur: 50,
        energie: 50,
        lastFed: null,
        lastPlayed: null,
        lastRested: null,
        canFeed: true,
        canPlay: true,
        canRest: true,
        timeToFeed: 15,
        timeToPlay: 15,
        timeToRest: 15,
        age: 0,
        level: 1,
        levelUpTimer: null
    };
    broadcastState(); // Broadcast initial state to all clients
}

// Start the server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Function to broadcast state to all clients
function broadcastState() {
    const stateForClient = getTamagotchiStateForClient();
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(stateForClient));
        }
    });
}

// WebSocket connection
wss.on('connection', ws => {
    ws.on('message', async message => {
        const action = JSON.parse(message);
        try {
            if (action.type === 'nourrir') {
                await nourrirTamagotchi();
            } else if (action.type === 'jouer') {
                await jouerAvecTamagotchi();
            } else if (action.type === 'reposer') {
                await reposerTamagotchi();
            } else if (action.type === 'restart') {
                restartTamagotchi();
            }
            broadcastState(); // Broadcast updated state to all clients after action
            ws.send(JSON.stringify(getTamagotchiStateForClient())); // Send updated state to the client who performed the action
        } catch (error) {
            console.error('WebSocket error:', error);
            ws.send(JSON.stringify({ error: 'Une erreur est survenue lors du traitement de votre requête.' }));
        }
    });

    // Send initial state
    ws.send(JSON.stringify(getTamagotchiStateForClient()));
});

setInterval(broadcastState, 1000); // Broadcast state every second

server.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
