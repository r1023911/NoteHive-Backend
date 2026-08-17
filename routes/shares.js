const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getUserId } = require("../middleware/auth");

async function notifyShareWebhook(payload) {
  const url = process.env.N8N_SHARE_WEBHOOK_URL;
  if (!url) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    console.log("N8N share webhook failed:", err.message);
  } finally {
    clearTimeout(timeout);
  }
}

router.post("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { noteId, toEmail } = req.body;
    if (!noteId || !toEmail) {
      return res.status(400).json({ error: "noteId and toEmail required" });
    }

    const note = await prisma.note.findUnique({ where: { id: Number(noteId) } });
    if (!note) return res.status(404).json({ error: "note not found" });
    if (note.ownerId !== Number(userId)) {
      return res.status(403).json({ error: "you don't own this note" });
    }

    const toUser = await prisma.user.findUnique({ where: { email: String(toEmail).trim() } });
    if (!toUser) return res.status(404).json({ error: "no account found with that email" });

    if (toUser.id === Number(userId)) {
      return res.status(400).json({ error: "cannot share a note with yourself" });
    }

    const fromUser = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { username: true, email: true },
    });

    const share = await prisma.share.create({
      data: { noteId: note.id, fromUserId: Number(userId), toUserId: toUser.id },
    });

    await notifyShareWebhook({
      noteId: note.id,
      noteTitle: note.title,
      toEmail: toUser.email,
      toUsername: toUser.username,
      fromUsername: fromUser?.username || null,
      fromEmail: fromUser?.email || null,
      sharedAt: share.createdAt,
    });

    res.status(201).json(share);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "already shared with that user" });
    }
    console.log("POST /shares ERROR:", err);
    res.status(500).json({ error: "failed to share note" });
  }
});

router.get("/inbox", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const shares = await prisma.share.findMany({
      where: { toUserId: Number(userId) },
      orderBy: { createdAt: "desc" },
      include: {
        note: true,
        fromUser: { select: { username: true, email: true } },
      },
    });

    res.json(
      shares.map((s) => ({
        id: s.id,
        noteId: s.noteId,
        title: s.note?.title || "Untitled",
        content: s.note?.content || "",
        color: s.note?.color || null,
        fromUsername: s.fromUser?.username || null,
        fromEmail: s.fromUser?.email || null,
        sharedAt: s.createdAt,
      }))
    );
  } catch (err) {
    console.log("GET /shares/inbox ERROR:", err);
    res.status(500).json({ error: "failed to fetch inbox" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const id = Number(req.params.id);

    const share = await prisma.share.findUnique({ where: { id } });
    if (!share) return res.status(404).json({ error: "share not found" });

    if (share.toUserId !== Number(userId)) {
      return res.status(403).json({ error: "forbidden" });
    }

    await prisma.share.delete({ where: { id } });

    res.json({ message: "deleted" });
  } catch (err) {
    console.log("DELETE /shares/:id ERROR:", err);
    res.status(500).json({ error: "failed to delete share" });
  }
});

module.exports = router;
