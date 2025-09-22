const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// env
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/contactsDB";
const PORT = process.env.PORT || 5000;
// ---

app.use(cors({
    origin: ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
}));

app.use(bodyParser.json());

mongoose
    .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
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
