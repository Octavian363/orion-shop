// Load environment variables on the very first line
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer'); 
const fs = require('fs');
const crypto = require('crypto'); // Native Node.js library for secure password hashing

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 🔑 Setup Email Transporter using Google App Password from Railway
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'cristiflorea2378@gmail.com',
        pass: process.env.EMAIL_PASS // Secure password read from Railway variables
    }
});

// 📂 Local database saved in a JSON file
const USERS_FILE = './utilizatori.json';
let Users = [];

if (fs.existsSync(USERS_FILE)) {
    try {
        Users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (e) {
        Users = [];
    }
}

function saveUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify(Users, null, 2), 'utf8');
}

// 🔐 Secure password hashing helper function (SHA-256)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Space shop products catalog
const HarborProducts = [
    { id: 1, nume: "OrionAI – Training", descriere: "🤖 OrionAI Bot Premium", pret: 60.00, imagine: "orion.png" },
    { id: 2, nume: "UNO cards", descriere: "UNO cards no original", pret: 45.00, imagine: "uno.webp" },
    { id: 3, nume: "Stylus", descriere: "Stylus for a touch screen", pret: 1.50, imagine: "stylus.webp" },
    { id: 4, nume: "Figurină Roblox", descriere: "Figurină Roblox albastră", pret: 9.99, imagine: "Fallen Guardian.png" } 
];

app.get('/api/produse', (req, res) => {
    res.json(HarborProducts);
});

// 🆕 ROUTE 1: CREATE NEW ACCOUNT (REGISTER)
app.post('/api/register', (req, res) => {
    const { username, password, adresa } = req.body;

    if (!username || !password || !adresa) {
        return res.status(400).json({ succes: false, mesaj: "Completează toate câmpurile!" });
    }

    const userExists = Users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (userExists) {
        return res.status(400).json({ succes: false, mesaj: "Acest nume de utilizator este deja utilizat!" });
    }

    const newUser = {
        username: username.trim(),
        password: hashPassword(password), // Save securely hashed password
        adresa: adresa.trim()
    };

    Users.push(newUser);
    saveUsers();

    res.json({ succes: true, mesaj: "Contul tău a fost creat! Acum te poți conecta." });
});

// 🆕 ROUTE 2: USER SIGN IN (LOGIN)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ succes: false, mesaj: "Introdu numele și parola!" });
    }

    const user = Users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (!user) {
        return res.status(400).json({ succes: false, mesaj: "Utilizatorul sau parola sunt incorecte!" });
    }

    if (user.password !== hashPassword(password)) {
        return res.status(400).json({ succes: false, mesaj: "Utilizatorul sau parola sunt incorecte!" });
    }

    // Return profile details back to front-end, excluding the hashed password
    res.json({
        succes: true,
        mesaj: `Te-ai conectat cu succes!`,
        user: { username: user.username, adresa: user.adresa }
    });
});

// Order confirmation route via Email Notification
app.post('/api/comanda', async (req, res) => {
    const { produse, total, utilizator, adresa } = req.body;

    if (!produse || produse.length === 0) {
        return res.status(400).json({ succes: false, mesaj: "Coșul este gol!" });
    }
    if (!utilizator || !adresa) {
        return res.status(400).json({ succes: false, mesaj: "Te rugăm să te conectezi pentru a trimite comanda!" });
    }

    const quantities = {};
    produse.forEach(p => {
        quantities[p.nume] = (quantities[p.nume] || 0) + 1;
    });

    const productLines = [];
    for (const [name, qty] of Object.entries(quantities)) {
        productLines.push(`${qty}x ${name}`);
    }

    let emailText = `Orion Shop: New Order! Sent by user "${utilizator}" from address "${adresa}". Items: ` + productLines.join(", ") + `. Total Price: ${total.toFixed(2)} RON`;

    // Configure the mail options
    const mailOptions = {
        from: 'cristiflorea2378@gmail.com',
        to: 'cristiflorea2378@gmail.com', // Sends the alert back to your inbox
        subject: '🚀 Orion Shop - New Order Received!',
        text: emailText
    };

    try {
        // Send the email dynamically
        await transporter.sendMail(mailOptions);
        res.json({ succes: true, mesaj: "Comanda a fost trimisă cu succes! Verifică e-mailul." });
    } catch (error) {
        console.error("Email Delivery Error Log:", error);
        res.status(500).json({ succes: false, mesaj: "Eroare la trimiterea e-mailului." });
    }
});

const PORT = process.env.PORT || 8080; 
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});