const express = require("express");
const app = express();

app.use(express.json());

/* ===== AÑADIDO DESDE AQUÍ ===== */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Health check
app.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

// Create user (para poder crear notas)
app.post("/users", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    const user = await prisma.user.create({
      data: { email, password },
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: "failed to create user" });
  }
});

// Create note
app.post("/notes", async (req, res) => {
  try {
    const { title, content, ownerId } = req.body;

    if (!title || !content || !ownerId) {
      return res.status(400).json({
        error: "title, content and ownerId required",
      });
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        ownerId: Number(ownerId),
      },
    });

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: "failed to create note" });
  }
});

// Get all notes
app.get("/notes", async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { updatedAt: "desc" },
    });

    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "failed to fetch notes" });
  }
});

// Get one note + links
app.get("/notes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        outgoingLinks: { include: { toNote: true } },
        incomingLinks: { include: { fromNote: true } },
      },
    });

    if (!note) {
      return res.status(404).json({ error: "note not found" });
    }

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "failed to fetch note" });
  }
});

// Create link between notes
app.post("/links", async (req, res) => {
  try {
    const { fromNoteId, toNoteId } = req.body;

    if (!fromNoteId || !toNoteId) {
      return res.status(400).json({
        error: "fromNoteId and toNoteId required",
      });
    }

    const link = await prisma.noteLink.create({
      data: {
        fromNoteId: Number(fromNoteId),
        toNoteId: Number(toNoteId),
      },
    });

    res.status(201).json(link);
  } catch (err) {
    res.status(500).json({
      error: "failed to create link (maybe already exists)",
    });
  }
});

/* Console App */

console.log("... SERVER IS RUNNING ...");
app.listen(3000);
