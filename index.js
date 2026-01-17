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
    console.log('⚠️ No MongoDB URI. Running in DEMO MODE.');
    isDemoMode = true;
}

// Demo Adatbázis (A memóriában, hogy működjön a bemutató)
let demoData = [
    { _id: '1', name: 'Asztal 4', details: '2x Pizza, 1x Cola', amount: 8500, status: 'active', date: new Date() },
    { _id: '2', name: 'Pult / Elvitel', details: 'Gyros Tál', amount: 3200, status: 'done', date: new Date() },
    { _id: '3', name: 'Asztal 2', details: 'Bableves', amount: 2100, status: 'active', date: new Date() }
];

// Mongoose Modell (Ha van igazi adatbázis)
const ClientSchema = new mongoose.Schema({
    name: String,
    details: String,
    amount: Number,
    status: { type: String, default: 'active' },
    date: { type: Date, default: Date.now }
});
const Client = mongoose.model('Client', ClientSchema);

// 2. KONFIGURÁCIÓS API (Ez a "Kapcsolótábla")
// A frontend ezt kérdezi le, hogy tudja, Étterem vagy Szerviz legyen
app.get('/api/config', (req, res) => {
    res.json({
        companyName: process.env.COMPANY_NAME || "Demo Étterem & Büfé",
        industry: process.env.INDUSTRY || "restaurant", // Alapértelmezett: restaurant
        currency: process.env.CURRENCY || "Ft",
        features: {
            employees: process.env.ENABLE_EMPLOYEES === 'true',
            inventory: process.env.ENABLE_INVENTORY === 'true',
            booking: process.env.ENABLE_BOOKING === 'true'
        }
    });
});

// 3. API VÉGPONTOK (Adatkezelés)

// Adatok lekérése
app.get('/api/clients', async (req, res) => {
    if (!isDemoMode && mongoose.connection.readyState === 1) {
        const clients = await Client.find().sort({date: -1});
        res.json(clients);
    } else {
        res.json(demoData);
    }
});

// Új adat mentése
app.post('/api/clients', async (req, res) => {
    if (!isDemoMode && mongoose.connection.readyState === 1) {
        const newClient = new Client(req.body);
        await newClient.save();
        res.json(newClient);
    } else {
        const newItem = { ...req.body, _id: Date.now().toString(), date: new Date() };
        demoData.unshift(newItem);
        res.json(newItem);
    }
});

// Adat frissítése (pl. Státusz: Kész)
app.put('/api/clients/:id', async (req, res) => {
    if (!isDemoMode && mongoose.connection.readyState === 1) {
        const updated = await Client.findByIdAndUpdate(req.params.id, req.body, {new: true});
        res.json(updated);
    } else {
        const idx = demoData.findIndex(x => x._id === req.params.id);
        if(idx > -1) {
            demoData[idx] = { ...demoData[idx], ...req.body };
            res.json(demoData[idx]);
        } else {
            res.json({error: "Not found"});
        }
    }
});

// Törlés
app.delete('/api/clients/:id', async (req, res) => {
    if (!isDemoMode && mongoose.connection.readyState === 1) {
        await Client.findByIdAndDelete(req.params.id);
        res.json({success: true});
    } else {
        demoData = demoData.filter(x => x._id !== req.params.id);
        res.json({success: true});
    }
});

// ÚTVONALAK
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crm.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Motor indítva a ${PORT} porton`));
