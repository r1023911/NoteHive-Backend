const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    const fromNoteId = req.body.fromNoteId;
    const toNoteId = req.body.toNoteId;

    if (!fromNoteId || !toNoteId) {
      res.status(400).json({ error: "fromNoteId and toNoteId required" });
      return;
    }

    const link = await prisma.noteLink.create({
      data: {
        fromNoteId: Number(fromNoteId),
        toNoteId: Number(toNoteId),
      },
    });

    res.status(201).json(link);
  } catch (err) {
    res.status(500).json({ error: "failed to create link (maybe exists)" });
  }
});

router.get("/", async (req, res) => {
  try {
    const links = await prisma.noteLink.findMany({
      orderBy: { id: "desc" },
    });
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: "failed to fetch links" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const fromNoteId = req.body.fromNoteId;
    const toNoteId = req.body.toNoteId;

    if (!fromNoteId || !toNoteId) {
      res.status(400).json({ error: "fromNoteId and toNoteId required" });
      return;
    }

    await prisma.noteLink.delete({
      where: {
        fromNoteId_toNoteId: {
          fromNoteId: Number(fromNoteId),
          toNoteId: Number(toNoteId),
        },
      },
    });

    res.json({ message: "deleted" });
  } catch (err) {
    res.status(500).json({ error: "failed to delete link" });
  }
});

module.exports = router;
