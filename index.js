require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// ADATBÁZIS
const mongoUri = process.env.MONGO_URI;
let isDemo = !mongoUri;

if (mongoUri) {
    mongoose.connect(mongoUri).then(() => console.log('✅ Adatbázis kész'));
}

const Client = mongoose.model('Client', new mongoose.Schema({
    name: String, details: String, amount: Number, status: String, date: { type: Date, default: Date.now }
}));

// CONFIG & LOGIN
app.get('/api/config', (req, res) => {
    res.json({
        companyName: process.env.COMPANY_NAME || "Demo Rendszer",
        industry: process.env.INDUSTRY || "general",
        currency: process.env.CURRENCY || "Ft"
    });
});

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === (process.env.ADMIN_PASSWORD || "admin")) return res.json({ success: true });
    res.status(401).json({ success: false });
});

// ADATOK
app.get('/api/clients', async (req, res) => {
    const data = isDemo ? [] : await Client.find().sort({date: -1});
    res.json(data);
});

app.post('/api/clients', async (req, res) => {
    const newItem = new Client(req.body);
    await newItem.save();
    res.json(newItem);
});

// FŐOLDAL VÁLASZTÓ (A Variable alapján)
app.get('/', (req, res) => {
    if (process.env.HIDE_LANDING === 'true') {
        res.sendFile(path.join(__dirname, 'public', 'crm.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

app.get('/demo', (req, res) => res.sendFile(path.join(__dirname, 'public', 'crm.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Port: ${PORT}`));