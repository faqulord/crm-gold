require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// Adatbázis kapcsolat (Ha van beállítva)
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("MongoDB Csatlakozva"))
        .catch(err => console.log("MongoDB Hiba (De a szerver fut tovább!)"));
}

// Adat Modell (Így tároljuk a tételeket)
const ItemSchema = new mongoose.Schema({
    category: String,
    title: String,
    desc: String,
    price: Number
});
const Item = mongoose.model('Item', ItemSchema);

// --- API VÉGPONTOK (A háttér kommunikáció) ---

// Konfiguráció lekérése (Cégnév)
app.get('/api/config', (req, res) => {
    res.json({ name: process.env.COMPANY_NAME || "FaquDeveloper Agency" });
});

// Tételek listázása
app.get('/api/items/:category', async (req, res) => {
    try { const items = await Item.find({ category: req.params.category }); res.json(items); } 
    catch (err) { res.json([]); }
});

// Új tétel mentése
app.post('/api/items', async (req, res) => {
    try { await new Item(req.body).save(); res.json({ success: true }); } 
    catch (err) { res.status(500).json(err); }
});

// Tétel törlése
app.delete('/api/items/:id', async (req, res) => {
    try { await Item.findByIdAndDelete(req.params.id); res.json({ success: true }); } 
    catch (err) { res.status(500).json(err); }
});

// --- FŐ ÚTVONALVÁLASZTÓ (A Mester Kulcs) ---
app.get('/', (req, res) => {
    // Ha CLIENT_MODE=true, akkor a CRM jön be
    if(process.env.CLIENT_MODE === 'true') {
        res.sendFile(path.join(__dirname, 'public', 'crm.html'));
    } else {
        // Ha nincs beállítva ügyfél, akkor a te SALES oldalad jön be
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Demo link mindig elérhető legyen
app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crm.html'));
});

app.listen(PORT, () => console.log(`A Szerver fut a ${PORT} porton`));
