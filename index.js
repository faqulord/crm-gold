require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ADATBÁZIS
mongoose.connect(process.env.MONGO_URI);

// MODELLEK
const schema = { name: String, details: String, amount: Number, qty: Number, price: Number, salary: Number, contact: String, role: String, date: { type: Date, default: Date.now } };
const models = { 
    clients: mongoose.model('Client', new mongoose.Schema(schema)),
    inventory: mongoose.model('Inventory', new mongoose.Schema(schema)),
    partners: mongoose.model('Partner', new mongoose.Schema(schema)),
    employees: mongoose.model('Employee', new mongoose.Schema(schema)),
    expenses: mongoose.model('Expense', new mongoose.Schema(schema))
};

// VÁLTOZÓK FIXÁLÁSA (Nincs több szóköz hiba)
app.get('/api/config', (req, res) => {
    res.json({
        companyName: (process.env.COMPANY_NAME || "Vállalkozás").trim(),
        industry: (process.env.INDUSTRY || "general").trim().toLowerCase(),
        currency: (process.env.CURRENCY || "Ft").trim()
    });
});

app.post('/api/login', (req, res) => {
    if (req.body.password === (process.env.ADMIN_PASSWORD || "admin").trim()) return res.json({ success: true });
    res.status(401).json({ success: false });
});

app.get('/api/:type', async (req, res) => {
    const { year, month } = req.query;
    let query = {};
    if (year && month) {
        query.date = { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59) };
    }
    const data = await models[req.params.type].find(query).sort({date: -1});
    res.json(data);
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

app.get('/demo', (req, res) => res.sendFile(path.join(__dirname, 'public', 'crm.html')));

app.listen(process.env.PORT || 3000);