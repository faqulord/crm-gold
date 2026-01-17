require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// 1. ADATBÁZIS CSATLAKOZÁS
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Adatbázis Kapcsolat Aktív'))
    .catch(err => console.error('❌ Hiba:', err));

// 2. ADATMODELLEK (SÉMÁK)
const Client = mongoose.model('Client', new mongoose.Schema({ name: String, details: String, amount: Number, status: String, date: { type: Date, default: Date.now } }));
const Inventory = mongoose.model('Inventory', new mongoose.Schema({ name: String, qty: Number, unit: String, price: Number }));
const Partner = mongoose.model('Partner', new mongoose.Schema({ name: String, contact: String, type: String }));
const Employee = mongoose.model('Employee', new mongoose.Schema({ name: String, role: String, salary: Number, pin: String }));
const Message = mongoose.model('Message', new mongoose.Schema({ sender: String, text: String, date: { type: Date, default: Date.now } }));

const models = { clients: Client, inventory: Inventory, partners: Partner, employees: Employee, messages: Message };

// 3. API-K
app.get('/api/config', (req, res) => {
    res.json({
        companyName: process.env.COMPANY_NAME || "Rendszer",
        industry: process.env.INDUSTRY || "general",
        currency: process.env.CURRENCY || "Ft"
    });
});

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD || "admin";
    if (password === adminPass) return res.json({ success: true, role: 'admin' });
    res.status(401).json({ success: false });
});

// Univerzális Adatkezelő API
app.get('/api/:type', async (req, res) => {
    try {
        const data = await models[req.params.type].find().sort({date: -1}).limit(50);
        res.json(data);
    } catch (e) { res.status(500).send(e); }
});

app.post('/api/:type', async (req, res) => {
    try {
        const newItem = new models[req.params.type](req.body);
        await newItem.save();
        res.json(newItem);
    } catch (e) { res.status(500).send(e); }
});

// 4. ÚTVONALAK
app.get('/', (req, res) => {
    const page = process.env.HIDE_LANDING === 'true' ? 'crm.html' : 'index.html';
    res.sendFile(path.join(__dirname, 'public', page));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Enterprise System Running on Port ${PORT}`));