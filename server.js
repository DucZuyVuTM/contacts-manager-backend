const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// env
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'default-admin-password';
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/contactsDB";
const PORT = process.env.PORT || 5000;
// ---

app.use(cors({
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// --- MIDDLEWARE ---

const authenticateAdmin = (req, res, next) => {
    if (req.method === 'GET' || req.method === 'POST') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ error: 'Admin password required via Authorization header' });
    }
    
    const clientPassword = authHeader.split(' ')[1];

    if (clientPassword !== ADMIN_PASSWORD) {
        return res.status(403).send({ error: 'Invalid admin password' });
    }
    
    next();
};

app.use('/api/contacts', authenticateAdmin);

// --- MONGODB CONFIGURATION ---

mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

const Contact = mongoose.model(
    "Contact",
    new mongoose.Schema({
        name: { type: String, required: true },
        phone: { type: String, required: true },
    })
);

// --- ROUTES API CONTACTS ---

app.get("/api/contacts", async (req, res) => {
    const contacts = await Contact.find();
    res.send(contacts);
});

app.get("/api/contacts/:id", async (req, res) => {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).send("Contact not found");
    res.send(contact);
});

app.post("/api/contacts", async (req, res) => {
    const contact = new Contact({
        name: req.body.name,
        phone: req.body.phone,
    });
    await contact.save();
    res.send(contact);
});

app.put("/api/contacts/:id", async (req, res) => {
    const contact = await Contact.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            phone: req.body.phone,
        },
        { new: true }
    );
    if (!contact) return res.status(404).send("Contact not found");
    res.send(contact);
});

app.patch("/api/contacts/:id", async (req, res) => {
    const contact = await Contact.findByIdAndUpdate(
        req.params.id,
        {
            $set: req.body,
        },
        { new: true }
    );
    if (!contact) return res.status(404).send("Contact not found");
    res.send(contact);
});

app.delete("/api/contacts/:id", async (req, res) => {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).send("Contact not found");
    res.send(contact);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
