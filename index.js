require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// DB KAPCSOLAT
mongoose.connect(process.env.MONGO_URI).then(() => console.log('✅ Enterprise Engine Online'));

// MODELLEK
const Client = mongoose.model('Client', new mongoose.Schema({ name: String, details: String, amount: Number, date: { type: Date, default: Date.now } }));
const Inventory = mongoose.model('Inventory', new mongoose.Schema({ name: String, qty: Number, unit: String, price: Number }));
const Employee = mongoose.model('Employee', new mongoose.Schema({ name: String, role: String, lastActive: { type: Date, default: Date.now } }));
const Message = mongoose.model('Message', new mongoose.Schema({ sender: String, text: String, date: { type: Date, default: Date.now } }));

// AKTIVITÁSI NAPLÓ (A Főnök kedvence)
const Activity = mongoose.model('Activity', new mongoose.Schema({ user: String, action: String, date: { type: Date, default: Date.now } }));

const models = { clients: Client, inventory: Inventory, employees: Employee, messages: Message, activity: Activity };

// API-K
app.get('/api/config', (req, res) => {
    res.json({
        companyName: process.env.COMPANY_NAME || "Enterprise CRM",
        industry: process.env.INDUSTRY || "general",
        currency: process.env.CURRENCY || "Ft"
    });
});

app.post('/api/login', (req, res) => {
    if (req.body.password === (process.env.ADMIN_PASSWORD || "admin")) return res.json({ success: true });
    res.status(401).json({ success: false });
});

// Dinamikus lekérdezés
app.get('/api/:type', async (req, res) => {
    const data = await models[req.params.type].find().sort({date: -1}).limit(50);
    res.json(data);
});

// Mentés + Automatikus naplózás
app.post('/api/:type', async (req, res) => {
    const newItem = new models[req.params.type](req.body);
    await newItem.save();

    // Ha nem üzenetről vagy naplóról van szó, mentsük el az aktivitást is
    if(req.params.type !== 'messages' && req.params.type !== 'activity') {
        const log = new Activity({ 
            user: "Admin", 
            action: `Új ${req.params.type} rögzítve: ${req.body.name || req.body.text || ""}` 
        });
        await log.save();
    }
    res.json(newItem);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', process.env.HIDE_LANDING === 'true' ? 'crm.html' : 'index.html'));
});

app.get('/demo', (req, res) => res.sendFile(path.join(__dirname, 'public', 'crm.html')));

app.listen(process.env.PORT || 3000);