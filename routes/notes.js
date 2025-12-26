const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function getUserId(req) {
  const header = req.headers.authorization || "";
  const token = header.split(" ")[1];
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-me");
    return payload.userId;
  } catch {
    return null;
  }
}

router.post("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { title, content, vaultId, hexKey } = req.body;

    if (!title || !vaultId) {
      return res.status(400).json({ error: "title and vaultId required" });
    }

    const note = await prisma.note.create({
      data: {
        title: String(title).trim(),
        content: String(content || ""),
        ownerId: Number(userId),
        vaultId: Number(vaultId),
        hexKey: hexKey ? String(hexKey) : null,
        updatedAt: new Date(),
      },
    });

    res.status(201).json(note);
  } catch (err) {
    console.log("POST /notes ERROR:", err);

    return res.status(500).json({
      error: err?.message || "failed to create note",
      code: err?.code || null,
      meta: err?.meta || null
    });
  }

});

router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const vaultId = Number(req.query.vaultId);
    if (!vaultId) return res.status(400).json({ error: "vaultId required" });

    const notes = await prisma.note.findMany({
      where: { vaultId, ownerId: Number(userId) },
      orderBy: { updatedAt: "desc" },
    });

    res.json(notes);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to fetch notes" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const id = Number(req.params.id);

    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        outgoingLinks: { include: { toNote: true } },
        incomingLinks: { include: { fromNote: true } },
      },
    });

    if (!note) return res.status(404).json({ error: "note not found" });
    if (note.ownerId !== Number(userId)) return res.status(403).json({ error: "forbidden" });

    res.json(note);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to fetch note" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const id = Number(req.params.id);
    const { title, content, vaultId, hexKey } = req.body;

    if (!title) return res.status(400).json({ error: "title required" });

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "note not found" });
    if (existing.ownerId !== Number(userId)) return res.status(403).json({ error: "forbidden" });

    const note = await prisma.note.update({
      where: { id },
      data: {
        title: String(title).trim(),
        content: String(content || ""),
        vaultId: vaultId ? Number(vaultId) : undefined,
        hexKey: typeof hexKey === "string" ? hexKey : undefined,
        updatedAt: new Date(),
      },
    });

    res.json(note);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to update note" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const id = Number(req.params.id);

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "note not found" });
    if (existing.ownerId !== Number(userId)) return res.status(403).json({ error: "forbidden" });


    await prisma.notelink.deleteMany({
      where: { OR: [{ fromNoteId: id }, { toNoteId: id }] },
    })


    await prisma.note.delete({ where: { id } });

    res.json({ message: "deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to delete note" });
  }
});

module.exports = router;
