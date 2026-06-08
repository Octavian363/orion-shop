require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
// Railway va folosi process.env.PORT (ex: 8080), iar local se va folosi 3001
const PORT = process.env.PORT || 3001; 

// Inițializare Client Twilio folosind variabilele de mediu
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Middleware
app.use(cors());
app.use(express.json());

// IMPORTANT: Servește fișierele web (index.html, imagini) din folderul 'public'
app.use(express.static('public')); 

// Lista oficială de produse Orion Shop (cu rutele corecte către imagini)
const products = [
    {
        id: 1,
        name: "Uno Joc de Cărți",
        description: "Cel mai distractiv joc de cărți pentru tine și prietenii tăi.",
        price: 29.99,
        image: "/uno.webp"
    },
    {
        id: 2,
        name: "Stylus Pen Professional",
        description: "Stylus de înaltă precizie pentru tabletă sau telefon.",
        price: 85.00,
        image: "/stylus.webp"
    },
    {
        id: 3,
        name: "Orion Emblem",
        description: "Produsul oficial cu branding-ul Orion Shop.",
        price: 15.00,
        image: "/orion.png"
    },
    {
        id: 4,
        name: "Fallen Guardian Figurine",
        description: "Ediție limitată de colecție cu Fallen Guardian.",
        price: 149.99,
        image: "/Fallen Guardian.png"
    }
];

// Vector pentru simularea utilizatorilor în memorie (se resetează la restartul serverului)
const users = [];

// Ruta API pentru a trimite produsele către frontend
app.get('/api/produse', (req, res) => {
    res.json(products);
});

// Ruta API pentru înregistrare utilizator
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

// Ruta API pentru autentificare utilizator
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

// Ruta API pentru procesarea comenzii și trimiterea SMS-ului direct prin Twilio
app.post('/api/comanda', (req, res) => {
    const { products: orderProducts, total, user, address } = req.body;

    if (!orderProducts || orderProducts.length === 0) {
        return res.status(400).json({ success: false, message: "Coșul tău este gol!" });
    }

    // Construim lista de produse pentru textul din SMS
    const productList = orderProducts.map(p => p.name || p.nume).join(', ');
    const smsBody = `Orion Shop: Comandă nouă de la ${user}! Produse: [${productList}]. Total: ${total.toFixed(2)} RON. Adresă: ${address}.`;

    // Trimitere directă de pe numărul tău de SUA către numărul tău personal din România
    twilioClient.messages.create({
        body: smsBody,
        from: '+12175823125',  // Numărul tău Twilio achiziționat
        to: '+407200234423'    // Numărul tău de telefon din 12 cifre
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

// Pornirea serverului pe portul detectat automat
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});