import express from "express";
import sqlite3 from "sqlite3";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db3 = sqlite3.verbose();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; connect-src 'self' http://localhost:3000; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'"
    );
    next();
});
app.use(express.static("public"));

// Zorg dat uploads-map bestaat
const uploadDir = "public/uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer instellen voor uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// SQLite database
const db = new db3.Database("./bibliotheek.db");

// Tabel maken
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titel TEXT NOT NULL,
            type TEXT,
            genres TEXT,
            beschrijving TEXT,
            afbeelding TEXT,
            rating INTEGER,
            bron TEXT,
            status TEXT,
            datum TEXT
        )
    `);
    
    // Kolommen toevoegen als ze nog niet bestaan (voor bestaande databases)
    db.all("PRAGMA table_info(items)", (err, rows) => {
        const columnNames = rows.map(row => row.name);
        
        if (!columnNames.includes("status")) {
            db.run("ALTER TABLE items ADD COLUMN status TEXT");
        }
        if (!columnNames.includes("datum")) {
            db.run("ALTER TABLE items ADD COLUMN datum TEXT");
        }
        if (!columnNames.includes("bron")) {
            db.run("ALTER TABLE items ADD COLUMN bron TEXT");
        }
    });
});

// Alle items ophalen
app.get("/items", (req, res) => {
    db.all("SELECT * FROM items", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

// Nieuw item toevoegen
app.post("/items", (req, res) => {
    const { titel, type, genres, beschrijving, afbeelding, rating, bron, status, datum } = req.body;
    if (!titel) return res.status(400).json({ error: "Titel is verplicht" });

    db.run(
        `INSERT INTO items (titel, type, genres, beschrijving, afbeelding, rating, bron, status, datum)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [titel, type, genres, beschrijving, afbeelding, rating, bron, status, datum],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Item bewerken
app.put("/items/:id", (req, res) => {
    const id = req.params.id;
    const { titel, type, genres, beschrijving, afbeelding, rating, bron, status, datum } = req.body;
    if (!titel) return res.status(400).json({ error: "Titel is verplicht" });

    db.run(
        `UPDATE items 
         SET titel = ?, type = ?, genres = ?, beschrijving = ?, afbeelding = ?, rating = ?, bron = ?, status = ?, datum = ?
         WHERE id = ?`,
        [titel, type, genres, beschrijving, afbeelding, rating, bron, status, datum, id],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "Item bijgewerkt" });
        }
    );
});

// Item verwijderen
app.delete("/items/:id", (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM items WHERE id = ?", [id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Item verwijderd" });
    });
});

// Upload endpoint
app.post("/upload", upload.single("afbeelding"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Geen bestand geüpload" });
    res.json({ url: "/uploads/" + req.file.filename });
});

// Server starten
const PORT = 3000;
app.listen(PORT, () => console.log(`Server draait op http://localhost:${PORT}`));
