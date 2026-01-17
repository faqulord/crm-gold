require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI);

// ADATMODELLEK
const Client = mongoose.model('Client', new mongoose.Schema({
    name: String, details: String, amount: Number, status: String, date: { type: Date, default: Date.now }
}));

const Inventory = mongoose.model('Inventory', new mongoose.Schema({
    name: String, qty: Number, unit: String, price: Number
}));

const Partner = mongoose.model('Partner', new mongoose.Schema({
    name: String, contact: String, type: String // Beszállító vagy Vevő
}));

const Employee = mongoose.model('Employee', new mongoose.Schema({
    name: String, role: String, salary: Number
}));

// API-K
app.get('/api/config', (req, res) => {
    res.json({
        companyName: process.env.COMPANY_NAME || "Rendszer",
        industry: process.env.INDUSTRY || "general",
        currency: process.env.CURRENCY || "Ft"
    });
});

app.post('/api/login', (req, res) => {
    if (req.body.password === (process.env.ADMIN_PASSWORD || "admin")) return res.json({ success: true });
    res.status(401).json({ success: false });
});

// Dinamikus API minden típushoz
const models = { clients: Client, inventory: Inventory, partners: Partner, employees: Employee };

app.get('/api/:type', async (req, res) => {
    const data = await models[req.params.type].find().sort({date: -1});
    res.json(data);
});

app.post('/api/:type', async (req, res) => {
    const newItem = new models[req.params.type](req.body);
    await newItem.save();
    res.json(newItem);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', process.env.HIDE_LANDING === 'true' ? 'crm.html' : 'index.html'));
});

app.get('/demo', (req, res) => res.sendFile(path.join(__dirname, 'public', 'crm.html')));

app.listen(process.env.PORT || 3000);