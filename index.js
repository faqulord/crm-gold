require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 1. ADATBÁZIS KAPCSOLAT (Vagy Demo Mód)
const mongoUri = process.env.MONGO_URI;
let isDemoMode = false;

if (mongoUri) {
    mongoose.connect(mongoUri)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch(err => {
            console.error('❌ MongoDB Error (Switching to Demo Mode):', err);
            isDemoMode = true;
        });
} else {
    isDemoMode = true;
}

// Demo Adatbázis (Ha nincs éles adatbázis)
let demoData = [
    { _id: '1', name: 'Minta Ügyfél', details: 'Első bejegyzés', amount: 5000, status: 'active', date: new Date() }
];

const ClientSchema = new mongoose.Schema({
    name: String,
    details: String,
    amount: Number,
    status: { type: String, default: 'active' },
    date: { type: Date, default: Date.now }
});
const Client = mongoose.model('Client', ClientSchema);

// 2. KONFIGURÁCIÓS API (A Railway-ről olvassa az adatokat)
app.get('/api/config', (req, res) => {
    res.json({
        companyName: process.env.COMPANY_NAME || "Demo Rendszer",
        industry: process.env.INDUSTRY || "general",
        currency: process.env.CURRENCY || "Ft",
        features: {
            inventory: process.env.ENABLE_INVENTORY === 'true'
        }
    });
});

// 3. JELSZÓ ELLENŐRZÉSE (A belépésnél)
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    // A Railway-en beállított ADMIN_PASSWORD-el veti össze
    const securePassword = process.env.ADMIN_PASSWORD || "admin"; 

    if (password === securePassword) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Hibás jelszó!" });
    }
});

// 4. ADATKEZELÉS API
app.get('/api/clients', async (req, res) => {
    if (!isDemoMode && mongoose.connection.readyState === 1) {
        const clients = await Client.find().sort({date: -1});
        res.json(clients);
    } else {
        res.json(demoData);
    }
});

app.post('/api/clients', async (req, res) => {
    if (!isDemoMode) {
        const newClient = new Client(req.body);
        await newClient.save();
        res.json(newClient);
    } else {
        const newItem = { ...req.body, _id: Date.now().toString(), date: new Date() };
        demoData.unshift(newItem);
        res.json(newItem);
    }
});

// 5. ÚTVONALAK KEZELÉSE
// Ez dönti el, hogy mit lásson a látogató a főoldalon!
app.get('/', (req, res) => {
    // Ha be van állítva a HIDE_LANDING változó 'true'-ra, akkor egyből a login jön be
    if (process.env.HIDE_LANDING === 'true') {
        res.sendFile(path.join(__dirname, 'public', 'crm.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crm.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Rendszer fut a ${PORT} porton`));