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

// 1. ADATBÁZIS KAPCSOLAT
// Ha nincs beállítva Mongo URI, akkor memóriában fut (Demo mód) vagy hibát dob
const mongoUri = process.env.MONGO_URI;
if (mongoUri) {
    mongoose.connect(mongoUri)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch(err => console.error('❌ MongoDB Error:', err));
} else {
    console.log('⚠️ No MongoDB URI provided. Running in limited mode.');
}

// 2. ADAT MODELL (A "Mindentudó" séma)
// Ez tárol mindent: Pizzát, Olajcserét, Fogtömést.
const ClientSchema = new mongoose.Schema({
    name: String,      // Pl: "Asztal 4" vagy "Kovács János"
    details: String,   // Pl: "2x Pizza" vagy "Olajcsere"
    amount: Number,    // Pl: 5000 (Ft)
    status: { type: String, default: 'active' }, // 'active' vagy 'done'
    date: { type: Date, default: Date.now }
});
const Client = mongoose.model('Client', ClientSchema);

// 3. KONFIGURÁCIÓS VÉGPONT (A "Kapcsolótábla")
// A Frontend ezt kérdezi le, hogy tudja, minek kell kinéznie
app.get('/api/config', (req, res) => {
    res.json({
        companyName: process.env.COMPANY_NAME || "Demo Étterem & Büfé",
        industry: process.env.INDUSTRY || "restaurant", // Alapértelmezett: Étterem
        currency: process.env.CURRENCY || "Ft",
        features: {
            employees: process.env.ENABLE_EMPLOYEES === 'true',
            inventory: process.env.ENABLE_INVENTORY === 'true',
            booking: process.env.ENABLE_BOOKING === 'true'
        }
    });
});

// 4. API VÉGPONTOK (Adatkezelés)

// Adatok lekérése
app.get('/api/clients', async (req, res) => {
    try {
        if(mongoose.connection.readyState === 1) {
            const clients = await Client.find().sort({date: -1});
            res.json(clients);
        } else {
            // DEMO ADATOK (Ha nincs adatbázis bekötve)
            res.json([
                { _id: '1', name: 'Asztal 5', details: '3x Húsimádó Pizza, 3x Cola', amount: 12500, status: 'active', date: new Date() },
                { _id: '2', name: 'Pult', details: 'Elvitelre: Gyros Tál', amount: 3200, status: 'done', date: new Date() },
                { _id: '3', name: 'Asztal 2', details: 'Bableves, Palacsinta', amount: 4800, status: 'active', date: new Date() }
            ]);
        }
    } catch (err) { res.status(500).json({error: err.message}); }
});

// Új adat felvétele
app.post('/api/clients', async (req, res) => {
    try {
        if(mongoose.connection.readyState === 1) {
            const newClient = new Client(req.body);
            await newClient.save();
            res.json(newClient);
        } else {
            // Demo módban csak visszaküldjük
            res.json(req.body);
        }
    } catch (err) { res.status(500).json({error: err.message}); }
});

// Státusz frissítése (Kész/Aktív)
app.put('/api/clients/:id', async (req, res) => {
    try {
        if(mongoose.connection.readyState === 1) {
            const updated = await Client.findByIdAndUpdate(req.params.id, req.body, {new: true});
            res.json(updated);
        } else { res.json({status: 'updated'}); }
    } catch (err) { res.status(500).json({error: err.message}); }
});

// Törlés
app.delete('/api/clients/:id', async (req, res) => {
    try {
        if(mongoose.connection.readyState === 1) {
            await Client.findByIdAndDelete(req.params.id);
            res.json({success: true});
        } else { res.json({success: true}); }
    } catch (err) { res.status(500).json({error: err.message}); }
});

// Főoldal kiszolgálása
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// CRM felület kiszolgálása
app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crm.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
