const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require('bcryptjs');

const app = express();

// --- SECURITY & ENV CONFIGURATION ---

// Default password
const FALLBACK_PASSWORD_PLAINTEXT = 'default-admin-password';
const FALLBACK_HASH = "$2a$12$9OQxYg6GtHMa4KixulWDPuhSnivVmESztr68TmEcutFQvuaoeleta";
// ---

// env
let ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/contactsDB";
const PORT = process.env.PORT || 5000;
// ---

if (!ADMIN_PASSWORD_HASH || ADMIN_PASSWORD_HASH.length < 50) {
    console.warn("WARNING: The ADMIN_PASSWORD_HASH environment variable is missing or invalid.");
    ADMIN_PASSWORD_HASH = FALLBACK_HASH;
    console.warn(`Using DEFAULT HASH. Password: '${FALLBACK_PASSWORD_PLAINTEXT}'`);
}

app.use(cors({
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// --- MIDDLEWARE ---

const authenticateAdmin = async (req, res, next) => {
    if (req.method === 'GET' || req.method === 'POST') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ error: 'Admin password required via Authorization header' });
    }
    
    const clientPassword = authHeader.split(' ')[1];

    let isMatch = false;

    try {
        isMatch = await bcrypt.compare(clientPassword, ADMIN_PASSWORD_HASH);
    } catch (error) {
        console.error("Bcrypt compare error (Broken Hash?):", error);
        return res.status(500).send({ error: 'Internal server error during authentication.' });
    }

    if (!isMatch) {
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
