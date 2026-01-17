require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. ADATBÁZIS CSATLAKOZÁS
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Rendszer Motor Aktív'))
    .catch(err => console.error('❌ MongoDB Hiba:', err));

// 2. MODELLEK
const Client = mongoose.model('Client', new mongoose.Schema({ name: String, details: String, amount: Number, date: { type: Date, default: Date.now } }));
const Inventory = mongoose.model('Inventory', new mongoose.Schema({ name: String, qty: Number, price: Number }));
const Partner = mongoose.model('Partner', new mongoose.Schema({ name: String, contact: String, type: String }));
const Employee = mongoose.model('Employee', new mongoose.Schema({ name: String, role: String, salary: Number }));
const Expense = mongoose.model('Expense', new mongoose.Schema({ name: String, amount: Number, date: { type: Date, default: Date.now } }));

const models = { clients: Client, inventory: Inventory, partners: Partner, employees: Employee, expenses: Expense };

// 3. KONFIGURÁCIÓ API
app.get('/api/config', (req, res) => {
    res.json({
        companyName: process.env.COMPANY_NAME || "Vállalkozás",
        industry: process.env.INDUSTRY || "general",
        currency: process.env.CURRENCY || "Ft"
    });
});

app.post('/api/login', (req, res) => {
    if (req.body.password === (process.env.ADMIN_PASSWORD || "admin")) {
        return res.json({ success: true, role: 'admin' });
    }
    res.status(401).json({ success: false });
});

// 4. ADATKEZELŐ API-K
app.get('/api/:type', async (req, res) => {
    try {
        const data = await models[req.params.type].find().sort({date: -1});
        res.json(data);
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/:type', async (req, res) => {
    try {
        const newItem = new models[req.params.type](req.body);
        await newItem.save();
        res.json(newItem);
    } catch (e) { res.status(500).json({error: "Hiba"}); }
});

app.delete('/api/:type/:id', async (req, res) => {
    try {
        await models[req.params.type].findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: "Hiba"}); }
});

// 5. ÚTVONALAK (A DEMO FIXÁLÁSA)
app.get('/', (req, res) => {
    const hide = String(process.env.HIDE_LANDING).trim().toLowerCase() === 'true';
    if (hide) {
        res.sendFile(path.join(__dirname, 'public', 'crm.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Ez a sor felel a demó gombért!
app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crm.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Szerver fut a ${PORT} porton`));