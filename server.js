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
app.use(express.static('public')); // Serves HTML, CSS, and JS from the 'public' folder

// List of products available in the shop
const products = [
    {
        id: 1,
        name: "Roblox Figurine",
        description: "A rare figurine from the Roblox universe for your collection.",
        price: 49.99,
        image: "https://images.rbxcdn.com/cecebe2c77d4c947c6e736df2eb4b74a.png"
    },
    {
        id: 2,
        name: "RGB Gaming Keyboard",
        description: "Fast mechanical keyboard with spectacular lighting setup.",
        price: 189.00,
        image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500"
    }
];

// Hardcoded users array for session simulation
const users = [];

// Route to get all products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// Route for user registration
app.post('/api/register', (req, res) => {
    const { username, password, address } = req.body;
    
    if (!username || !password || !address) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(400).json({ success: false, message: "Username already taken" });
    }

    users.push({ username, password, address });
    res.json({ success: true, message: "Account created successfully!" });
});

// Route for user login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(400).json({ success: false, message: "Invalid username or password" });
    }

    res.json({
        success: true,
        message: "Welcome back!",
        user: { username: user.username, address: user.address }
    });
});

// Route to handle new orders and send Twilio SMS
app.post('/api/order', (req, res) => {
    const { products: orderProducts, total, user, address } = req.body;

    if (!orderProducts || orderProducts.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const productList = orderProducts.map(p => p.name).join(', ');
    const smsBody = `Orion Shop: New order from ${user}! Products: [${productList}]. Total: ${total.toFixed(2)} RON. Address: ${address}.`;

    // Send SMS via Twilio using Messaging Service SID
    twilioClient.messages.create({
        body: smsBody,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
        to: '+40720023423'
    })
    .then(message => {
        console.log(`SMS sent successfully! SID: ${message.sid}`);
        res.json({ success: true, message: "Order placed successfully! Notification sent to admin." });
    })
    .catch(error => {
        console.error("Twilio Error:", error);
        res.status(500).json({ success: false, message: "Failed to send SMS notification, check Twilio setup." });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});