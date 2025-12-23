const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


//add note

router.post("/", async (req, res) => {
  try {
    const title = req.body.title;
    const content = req.body.content;
    const ownerId = req.body.ownerId;

    if (!title || !content || !ownerId) {
      res.status(400).json({ error: "title, content, ownerId required" });
      return;
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


//see notes

router.get("/", async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { updatedAt: "desc" },
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "failed to fetch notes" });
  }
});

router.get("/:id", async (req, res) => {
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
      res.status(404).json({ error: "note not found" });
      return;
    }

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "failed to fetch note" });
  }
});


// update note
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const title = req.body.title;
    const content = req.body.content;

    if (!title || !content) {
      res.status(400).json({ error: "title and content required" });
      return;
    }

    const note = await prisma.note.update({
      where: { id },
      data: { title, content },
    });

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "failed to update note" });
  }
});


// delete notes

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.noteLink.deleteMany({
      where: {
        OR: [{ fromNoteId: id }, { toNoteId: id }],
      },
    });

    await prisma.note.delete({
      where: { id },
    });

    res.json({ message: "deleted" });
  } catch (err) {
    res.status(500).json({ error: "failed to delete note" });
  }
});

module.exports = router;
