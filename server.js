// Încărcăm librăria dotenv chiar pe prima linie
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const twilio = require('twilio'); 
const fs = require('fs');
const crypto = require('crypto'); // 🔐 Librărie nativă din Node.js pentru securizarea parolelor

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 🔑 DATELE SECRETE CITITE DIN RAILWAY
const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN; 

const clientTwilio = new twilio(accountSid, authToken);

// 📂 Baza de date locală (salvată într-un fișier JSON)
const FISIER_USERI = './utilizatori.json';
let Utilizatori = [];

if (fs.existsSync(FISIER_USERI)) {
    try {
        Utilizatori = JSON.parse(fs.readFileSync(FISIER_USERI, 'utf8'));
    } catch (e) {
        Utilizatori = [];
    }
}

function salveazaUtilizatorii() {
    fs.writeFileSync(FISIER_USERI, JSON.stringify(Utilizatori, null, 2), 'utf8');
}

// 🔐 Funcție simplă și sigură de criptare a parolei
function cripteazaParola(parola) {
    return crypto.createHash('sha256').update(parola).digest('hex');
}

// Produsele magazinului spațial făcut de Octavian
const HarborProduse = [
    { id: 1, nume: "OrionAI – Training", descriere: "🤖 OrionAI Bot Premium", pret: 60.00, imagine: "orion.png" },
    { id: 2, nume: "UNO cards", descriere: "UNO cards no original", pret: 45.00, imagine: "uno.webp" },
    { id: 3, nume: "Stylus", descriere: "Stylus for a touch screen", pret: 1.50, imagine: "stylus.webp" },
    { id: 4, nume: "Figurină Roblox", descriere: "Figurină Roblox albastră", pret: 9.99, imagine: "Fallen Guardian.png" } 
];

app.get('/api/produse', (req, res) => {
    res.json(HarborProduse);
});

// 🆕 RUTA 1: CREARE CONT NOU (REGISTER)
app.post('/api/register', (req, res) => {
    const { username, password, adresa } = req.body;

    if (!username || !password || !adresa) {
        return res.status(400).json({ succes: false, mesaj: "Completează toate câmpurile!" });
    }

    const existaUser = Utilizatori.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (existaUser) {
        return res.status(400).json({ succes: false, mesaj: "Acest nume de utilizator este deja utilizat!" });
    }

    const nouUtilizator = {
        username: username.trim(),
        password: cripteazaParola(password), // Salvăm parola criptată complet securizat
        adresa: adresa.trim()
    };

    Utilizatori.push(nouUtilizator);
    salveazaUtilizatorii();

    res.json({ succes: true, mesaj: "Contul tău a fost creat! Acum te poți conecta." });
});

// 🆕 RUTA 2: CONECTARE UTILIZATOR (LOGIN)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ succes: false, mesaj: "Introdu numele și parola!" });
    }

    const user = Utilizatori.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (!user) {
        return res.status(400).json({ succes: false, mesaj: "Utilizatorul sau parola sunt incorecte!" });
    }

    if (user.password !== cripteazaParola(password)) {
        return res.status(400).json({ succes: false, mesaj: "Utilizatorul sau parola sunt incorecte!" });
    }

    // Trimitem datele esențiale înapoi la magazin, fără parola criptată
    res.json({
        succes: true,
        mesaj: `Te-ai conectat cu succes!`,
        user: { username: user.username, adresa: user.adresa }
    });
});

// Ruta de comandă
app.post('/api/comanda', async (req, res) => {
    const { produse, total, utilizator, adresa } = req.body;

    if (!produse || produse.length === 0) {
        return res.status(400).json({ succes: false, mesaj: "Coșul este gol!" });
    }
    if (!utilizator || !adresa) {
        return res.status(400).json({ succes: false, mesaj: "Te rugăm să te conectezi pentru a trimite comanda!" });
    }

    const cantitati = {};
    produse.forEach(p => {
        cantitati[p.nume] = (cantitati[p.nume] || 0) + 1;
    });

    const liniiProduse = [];
    for (const [nume, cantitate] of Object.entries(cantitati)) {
        liniiProduse.push(`${cantitate}x ${nume}`);
    }

    let textSMS = `Orion Shop: Comandă trimisă de ${utilizator} de la adresa ${adresa}. Comandă: ` + liniiProduse.join(", ") + `. Total: ${total.toFixed(2)} RON`;

    try {
        await clientTwilio.messages.create({
            body: textSMS,
            to: '+40720023423',   
            from: '+12175823125'  
        });

        res.json({ succes: true, mesaj: "Comanda a fost trimisă cu succes!" });
    } catch (eroare) {
        console.error("Eroare Twilio:", eroare);
        res.status(500).json({ succes: false, mesaj: "Eroare la trimiterea SMS-ului." });
    }
});

const PORT = process.env.PORT || 8080; 
app.listen(PORT, () => {
    console.log(`🚀 Serverul magazinului rulează pe portul ${PORT}`);
});