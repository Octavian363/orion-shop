require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3001; 

// Inițializare Client Twilio
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); 

// Lista oficială de produse Orion Shop
const products = [
    {
        id: 1,
        name: "Uno Joc de Cărți",
        description: "Cel mai distractiv joc de cărți pentru tine și prietenii tăi.",
        price: 45.00,
        image: "/uno.webp"
    },
    {
        id: 2,
        name: "Stylus Pen Professional",
        description: "Stylus de înaltă precizie pentru tabletă sau telefon.",
        price: 1.50,
        image: "/stylus.webp"
    },
    {
        id: 3,
        name: "Orion Emblem",
        description: "Produsul oficial cu branding-ul Orion Shop.",
        price: 60.00,
        image: "/orion.png"
    },
    {
        id: 4,
        name: "Fallen Guardian Figurine",
        description: "Ediție limitată de colecție cu Fallen Guardian.",
        price: 10.00,
        image: "/Fallen Guardian.png"
    }
];

// Baza de date în memorie pentru comentarii
const comments = [
    { id: 1, productId: 1, username: "Octavian363", rating: 5, text: "Un joc clasic super distractiv! Recomand cu drag." },
    { id: 2, productId: 1, username: "Andrei_G", rating: 4, text: "Cărțile sunt de calitate, ne jucăm în fiecare seară." },
    { id: 3, productId: 2, username: "Matei22", rating: 5, text: "La prețul ăsta de 1.50 lei e pomandă curată! Merge perfect pe tabletă." },
    { id: 4, productId: 3, username: "OrionFan", rating: 5, text: "Logo-ul arată demențial pe site, abia așteptam emblema!" },
    { id: 5, productId: 4, username: "RobloxPro", rating: 5, text: "Figurina cu Fallen Guardian arată super bine pe birou." }
];

const users = [];

// Rute API Produse
app.get('/api/produse', (req, res) => {
    res.json(products);
});

// Rută pentru a lua comentariile unui anumit produs
app.get('/api/comentarii/:productId', (req, res) => {
    const productId = parseInt(req.params.productId);
    const productComments = comments.filter(c => c.productId === productId);
    res.json(productComments);
});

// Rută pentru a adăuga un comentariu nou
app.post('/api/comentarii', (req, res) => {
    const { productId, username, rating, text } = req.body;

    if (!productId || !username || !rating || !text) {
        return res.status(400).json({ success: false, message: "Toate câmpurile sunt obligatorii pentru recenzie!" });
    }

    const newComment = {
        id: comments.length + 1,
        productId: parseInt(productId),
        username,
        rating: parseInt(rating),
        text
    };

    comments.push(newComment);
    res.json({ success: true, message: "Recenzia ta a fost adăugată!", comment: newComment });
});

// Rute Autentificare
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

// Ruta pentru comandă
app.post('/api/comanda', (req, res) => {
    const { products: orderProducts, total, user, address } = req.body;

    if (!orderProducts || orderProducts.length === 0) {
        return res.status(400).json({ success: false, message: "Coșul tău este gol!" });
    }

    const productList = orderProducts.map(p => p.name || p.nume).join(', ');
    const smsBody = `Orion Shop: Comandă nouă de la ${user}! Produse: [${productList}]. Total: ${total.toFixed(2)} RON. Adresă: ${address}.`;

    twilioClient.messages.create({
        body: smsBody,
        from: '+12175823125',
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});