require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// 1. ADATBÁZIS CSATLAKOZÁS
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Online'))
    .catch(err => console.error('❌ DB Hiba:', err));

// 2. ADATMODELLEK (Minden fontos mezővel)
const Client = mongoose.model('Client', new mongoose.Schema({ 
    name: String, 
    details: String, 
    amount: Number, 
    date: { type: Date, default: Date.now } 
}));

const Inventory = mongoose.model('Inventory', new mongoose.Schema({ 
    name: String, 
    qty: Number, 
    price: Number 
}));

const Partner = mongoose.model('Partner', new mongoose.Schema({ 
    name: String, 
    contact: String, 
    type: String 
}));

const Employee = mongoose.model('Employee', new mongoose.Schema({ 
    name: String, 
    role: String,
    salary: Number // ÚJ: Fizetés mező hozzáadva
}));

const Expense = mongoose.model('Expense', new mongoose.Schema({ 
    name: String, 
    amount: Number, 
    date: { type: Date, default: Date.now } 
}));

const Message = mongoose.model('Message', new mongoose.Schema({ 
    sender: String, 
    text: String, 
    date: { type: Date, default: Date.now } 
}));

const models = { clients: Client, inventory: Inventory, partners: Partner, employees: Employee, expenses: Expense, messages: Message };

// 3. RENDSZER KONFIGURÁCIÓ
app.get('/api/config', (req, res) => {
    res.json({
        companyName: process.env.COMPANY_NAME || "Vállalkozás",
        industry: process.env.INDUSTRY || "general", 
        currency: process.env.CURRENCY || "Ft"
    });
});

// 4. BELÉPÉS
app.post('/api/login', (req, res) => {
    const adminPass = process.env.ADMIN_PASSWORD || "admin";
    if (req.body.password === adminPass) return res.json({ success: true });
    res.status(401).json({ success: false });
});

// 5. UNIVERZÁLIS API
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
    } catch (e) { res.status(500).json({error: "Hiba mentéskor"}); }
});

// 6. ÚTVONALAK
app.get('/', (req, res) => {
    const hide = String(process.env.HIDE_LANDING).trim().toLowerCase() === 'true';
    if (hide) {
        res.sendFile(path.join(__dirname, 'public', 'crm.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

app.get('/demo', (req, res) => res.sendFile(path.join(__dirname, 'public', 'crm.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Szerver aktív!'));