require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Twilio Client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Middleware
app.use(cors());
app.use(express.json());

// List of products available in the shop
const products = [
    {
        id: 1,
        name: "Roblox Figurine",
        descriere: "O figurină rară din universul Roblox pentru colecția ta.",
        pret: 49.99,
        imagine: "https://images.rbxcdn.com/cecebe2c77d4c947c6e736df2eb4b74a.png"
    },
    {
        id: 2,
        name: "Tastatură Gaming RGB",
        descriere: "Tastatură mecanică rapidă cu lumini spectaculoase.",
        pret: 189.00,
        imagine: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500"
    }
];

// Hardcoded users array for session simulation
const users = [];

// Base route to check if server is online
app.get('/', (req, res) => {
    res.send('Orion Shop Backend is Running Successfully!');
});

// Route to get all products
app.get('/api/produse', (req, res) => {
    res.json(products);
});

// Route for user registration
app.post('/api/register', (req, res) => {
    const { username, password, adresa } = req.body;
    
    if (!username || !password || !adresa) {
        return res.status(400).json({ succes: false, mesaj: "Missing fields" });
    }

    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(400).json({ succes: false, mesaj: "Username already taken" });
    }

    users.push({ username, password, adresa });
    res.json({ succes: true, mesaj: "Account created successfully!" });
});

// Route for user login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(400).json({ succes: false, mesaj: "Invalid username or password" });
    }

    res.json({
        succes: true,
        mesaj: "Welcome back!",
        user: { username: user.username, adresa: user.adresa }
    });
});

// Route to handle new orders and send Twilio SMS
app.post('/api/comanda', (req, res) => {
    const { produse, total, utilizator, adresa } = req.body;

    if (!produse || produse.length === 0) {
        return res.status(400).json({ succes: false, mesaj: "Cart is empty" });
    }

    const productList = produse.map(p => p.name).join(', ');
    const smsBody = `Orion Shop: Comandă nouă de la ${utilizator}! Produse: [${productList}]. Total: ${total.toFixed(2)} RON. Adresă: ${adresa}.`;

    // Send SMS via Twilio using Messaging Service SID
    twilioClient.messages.create({
        body: smsBody,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
        to: '+40720023423'
    })
    .then(message => {
        console.log(`SMS sent successfully! SID: ${message.sid}`);
        res.json({ succes: true, mesaj: "Comanda a fost trimisă! SMS-ul a plecat spre administrator." });
    })
    .catch(error => {
        console.error("Twilio Error:", error);
        res.status(500).json({ succes: false, mesaj: "Failed to send SMS notification, check Twilio setup." });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});