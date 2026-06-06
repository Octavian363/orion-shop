// Încărcăm librăria dotenv chiar pe prima linie
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const twilio = require('twilio'); 

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 🔑 DATELE SECRETE CITITE DIN RAILWAY (Aici lăsăm doar cele 2 chei mari de la Twilio)
const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN; 

const clientTwilio = new twilio(accountSid, authToken);

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

// Ruta de comandă
app.post('/api/comanda', async (req, res) => {
    const { produse, total, utilizator, adresa } = req.body;

    if (!produse || produse.length === 0) {
        return res.status(400).json({ succes: false, mesaj: "Coșul este gol!" });
    }
    if (!utilizator || !adresa) {
        return res.status(400).json({ succes: false, mesaj: "Te rugăm să completezi datele de conectare/livrare!" });
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
            to: '+40720023423',   // 📱 Numărul tău real de România (scris direct în cod ca să nu mai ocupe loc pe Railway)
            from: '+12175823125'  // 🚀 Numărul tău stabil de SUA de la Twilio
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