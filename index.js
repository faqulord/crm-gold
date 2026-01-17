require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// 1. ADATBÁZIS
mongoose.connect(process.env.MONGO_URI).then(() => console.log('✅ Rendszer Online'));

// 2. MODELLEK
const Client = mongoose.model('Client', new mongoose.Schema({ name: String, details: String, amount: Number, date: { type: Date, default: Date.now } }));
const Inventory = mongoose.model('Inventory', new mongoose.Schema({ name: String, qty: Number, price: Number }));
const Partner = mongoose.model('Partner', new mongoose.Schema({ name: String, contact: String, type: String }));
const Employee = mongoose.model('Employee', new mongoose.Schema({ name: String, role: String, salary: Number }));
const Expense = mongoose.model('Expense', new mongoose.Schema({ name: String, amount: Number, date: { type: Date, default: Date.now } }));

const models = { clients: Client, inventory: Inventory, partners: Partner, employees: Employee, expenses: Expense };

// 3. RENDSZERADATOK
app.get('/api/config', (req, res) => {
    res.json({
        companyName: process.env.COMPANY_NAME || "Enterprise CRM",
        industry: process.env.INDUSTRY || "general",
        currency: process.env.CURRENCY || "Ft"
    });
});

app.post('/api/login', (req, res) => {
    if (req.body.password === (process.env.ADMIN_PASSWORD || "admin")) return res.json({ success: true, role: 'admin' });
    res.status(401).json({ success: false });
});

// 4. UNIVERZÁLIS API (Lekérés, Mentés, Módosítás, Törlés)
app.get('/api/:type', async (req, res) => {
    const data = await models[req.params.type].find().sort({date: -1});
    res.json(data);
});

app.post('/api/:type', async (req, res) => {
    const newItem = new models[req.params.type](req.body);
    await newItem.save();
    res.json(newItem);
});

app.put('/api/:type/:id', async (req, res) => {
    const updated = await models[req.params.type].findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

app.delete('/api/:type/:id', async (req, res) => {
    await models[req.params.type].findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// 5. IRÁNYÍTÁS
app.get('/', (req, res) => {
    const hide = String(process.env.HIDE_LANDING).trim().toLowerCase() === 'true';
    res.sendFile(path.join(__dirname, 'public', hide ? 'crm.html' : 'index.html'));
});

app.listen(process.env.PORT || 3000);