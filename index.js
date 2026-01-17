require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ADATBÁZIS CSATLAKOZÁS
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('🚀 Titanium Engine: Online'))
    .catch(err => console.error('Hiba:', err));

// MODELLEK - Minden tételnek van pontos dátuma
const schemaConfig = { 
    name: String, 
    details: String, 
    amount: Number, 
    qty: Number, 
    price: Number, 
    salary: Number,
    contact: String,
    role: String,
    date: { type: Date, default: Date.now } 
};

const Client = mongoose.model('Client', new mongoose.Schema(schemaConfig));
const Inventory = mongoose.model('Inventory', new mongoose.Schema(schemaConfig));
const Partner = mongoose.model('Partner', new mongoose.Schema(schemaConfig));
const Employee = mongoose.model('Employee', new mongoose.Schema(schemaConfig));
const Expense = mongoose.model('Expense', new mongoose.Schema(schemaConfig));

const models = { clients: Client, inventory: Inventory, partners: Partner, employees: Employee, expenses: Expense };

// RENDSZER KONFIG
app.get('/api/config', (req, res) => {
    res.json({
        companyName: (process.env.COMPANY_NAME || "Enterprise").toUpperCase(),
        industry: process.env.INDUSTRY || "general",
        currency: process.env.CURRENCY || "Ft"
    });
});

app.post('/api/login', (req, res) => {
    if (req.body.password === (process.env.ADMIN_PASSWORD || "admin")) return res.json({ success: true });
    res.status(401).json({ success: false });
});

// ADAT LEKÉRÉS (Év és Hónap szűréssel a záráshoz)
app.get('/api/:type', async (req, res) => {
    const { year, month } = req.query;
    let query = {};
    
    if (year && month) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        query.date = { $gte: start, $lte: end };
    }

    try {
        const data = await models[req.params.type].find(query).sort({date: -1});
        res.json(data);
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/:type', async (req, res) => {
    const newItem = new models[req.params.type](req.body);
    await newItem.save();
    res.json(newItem);
});

app.delete('/api/:type/:id', async (req, res) => {
    await models[req.params.type].findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.get('/', (req, res) => {
    const hide = String(process.env.HIDE_LANDING).trim().toLowerCase() === 'true';
    res.sendFile(path.join(__dirname, 'public', hide ? 'crm.html' : 'index.html'));
});

app.listen(process.env.PORT || 3000);