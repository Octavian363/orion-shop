require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
// Schimbat pe 3001 ca să se potrivească cu ce caută browserul în frontend
const PORT = process.env.PORT || 3001; 

// Initialize Twilio Client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Servește HTML, CSS și Imaginile din folderul 'public'

// Lista de produse actualizată cu produsele tale, Octavian!
const products = [
    {
        id: 1,
        name: "Uno Joc de Cărți",
        description: "Cel mai distractiv joc de cărți pentru tine și prietenii tăi.",
        price: 29.99,
        image: "/uno.webp" // Va căuta fișierul public/uno.webp
    },
    {
        id: 2,
        name: "Stylus Pen Professional",
        description: "Stylus de înaltă precizie pentru tabletă sau telefon.",
        price: 85.00,
        image: "/stylus.webp" // Va căuta fișierul public/stylus.webp
    },
    {
        id: 3,
        name: "Orion Emblem",
        description: "Produsul oficial cu branding-ul Orion Shop.",
        price: 15.00,
        image: "/orion.png" // Va căuta fișierul public/orion.png
    },
    {
        id: 4,
        name: "Fallen Guardian Figurine",
        description: "Ediție limitată de colecție cu Fallen Guardian.",
        price: 149.99,
        image: "/Fallen Guardian.png" // Atenție la litere mari și spațiu, trebuie să fie EXACT ca în folder
    }
];

// Hardcoded users array for session simulation
const users = [];

// Route to get all products
app.get('/api/produse', (req, res) => {
    res.json(products);
});

// Route for user registration
app.post('/api/register', (req, res) => {
    const { username, password, address } = req.body;
    
    if (!username || !password || !address) {
        return res.status(400).json({ success: false, message: "Te rugăm să completezi toate câmpurile!" });
    }

    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(400).json({ success: false, message: "Acest nume de utilizator este deja folosit!" });
    }

    users.push({ username, password, address });
    res.json({ success: true, message: "Contul a fost creat cu succes!" });
});

// Route for user login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(400).json({ success: false, message: "Nume de utilizator sau parolă incorectă!" });
    }

    res.json({
        success: true,
        message: "Bine ai revenit pe Orion Shop!",
        user: { username: user.username, address: user.address }
    });
});

// Route to handle new orders and send Twilio SMS
app.post('/api/comanda', (req, res) => {
    const { products: orderProducts, total, user, address } = req.body;

    if (!orderProducts || orderProducts.length === 0) {
        return res.status(400).json({ success: false, message: "Coșul tău este gol!" });
    }

    const productList = orderProducts.map(p => p.name || p.nume).join(', ');
    const smsBody = `Orion Shop: Comandă nouă de la ${user}! Produse: [${productList}]. Total: ${total.toFixed(2)} RON. Adresă: ${address}.`;

    // Send SMS via Twilio directly to your verified number
    twilioClient.messages.create({
        body: smsBody,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
        to: '+40720023423'
    })
    .then(message => {
        console.log(`SMS trimis cu succes! SID: ${message.sid}`);
        res.json({ success: true, message: "Comanda a fost trimisă! Administratorul a fost notificat prin SMS." });
    })
    .catch(error => {
        console.error("Twilio Error:", error);
        res.status(500).json({ success: false, message: "Eroare la trimiterea SMS-ului. Verifică setările Twilio." });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});