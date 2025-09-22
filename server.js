const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// env
const API_SECRET = process.env.API_SECRET || 'default-secret';
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/contactsDB";
const PORT = process.env.PORT || 5000;
// ---

app.use(cors({
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-api-secret']
}));


app.use(bodyParser.json());

const validateApiKey = (req, res, next) => {
    const clientSecret = req.headers['x-api-secret'] || req.headers['authorization'];
    
    if (!clientSecret) {
        return res.status(401).send({ error: 'API secret required' });
    }
    
    const secret = clientSecret.replace('Bearer ', '');
    
    if (secret !== API_SECRET) {
        return res.status(403).send({ error: 'Invalid API secret' });
    }
    
    next();
};

app.use('/api/contacts', validateApiKey);

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
