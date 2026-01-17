require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// 1. ADATBÁZIS CSATLAKOZÁS
mongoose.connect(process.env.MONGO_URI).then(() => console.log('✅ Enterprise Engine Online'));

// 2. ÖSSZES ÜZLETI MODELL
const Client = mongoose.model('Client', new mongoose.Schema({ name: String, details: String, amount: Number, date: { type: Date, default: Date.now } }));
const Inventory = mongoose.model('Inventory', new mongoose.Schema({ name: String, qty: Number, unit: String, price: Number }));
const Employee = mongoose.model('Employee', new mongoose.Schema({ name: String, role: String, salary: Number }));
const Expense = mongoose.model('Expense', new mongoose.Schema({ name: String, amount: Number, date: { type: Date, default: Date.now } }));
const Message = mongoose.model('Message', new mongoose.Schema({ sender: String, text: String, date: { type: Date, default: Date.now } }));
const Activity = mongoose.model('Activity', new mongoose.Schema({ user: String, action: String, date: { type: Date, default: Date.now } }));

const models = { clients: Client, inventory: Inventory, employees: Employee, expenses: Expense, messages: Message, activity: Activity };

// 3. API-K (Mesterkulcs adatok átadása)
app.get('/api/config', (req, res) => {
    res.json({
        companyName: process.env.COMPANY_NAME || "Demo CRM",
        industry: process.env.INDUSTRY || "general",
        currency: process.env.CURRENCY || "Ft"
    });
});

app.post('/api/login', (req, res) => {
    if (req.body.password === (process.env.ADMIN_PASSWORD || "admin")) return res.json({ success: true });
    res.status(401).json({ success: false });
});

app.get('/api/:type', async (req, res) => {
    const data = await models[req.params.type].find().sort({date: -1}).limit(100);
    res.json(data);
});

app.post('/api/:type', async (req, res) => {
    const newItem = new models[req.params.type](req.body);
    await newItem.save();
    // Automatikus naplózás
    if(!['messages', 'activity'].includes(req.params.type)) {
        await new Activity({ user: "Admin", action: `Új ${req.params.type} rögzítve: ${req.body.name || ""}` }).save();
    }
    res.json(newItem);
});

// 4. SMART ROUTING (Landing vs Login)
app.get('/', (req, res) => {
    const page = process.env.HIDE_LANDING === 'true' ? 'crm.html' : 'index.html';
    res.sendFile(path.join(__dirname, 'public', page));
});

app.get('/demo', (req, res) => res.sendFile(path.join(__dirname, 'public', 'crm.html')));

app.listen(process.env.PORT || 3000);