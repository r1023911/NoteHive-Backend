const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getUserId } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const vaults = await prisma.vault.findMany({
      where: { ownerId: Number(userId) },
      orderBy: { createdAt: "asc" },
    });

    res.json(vaults);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to fetch vaults" });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name required" });
    }

    const vault = await prisma.vault.create({
      data: {
        name: String(name).trim(),
        ownerId: Number(userId),
      },
    });

    res.status(201).json(vault);
  } catch (err) {
    if (err && err.code === "P2002") {
      return res.status(409).json({ error: "vault name already exists" });
    }

    console.log(err);
    res.status(500).json({ error: "failed to create vault" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid vault id" });

    const existing = await prisma.vault.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "vault not found" });
    if (existing.ownerId !== Number(userId)) return res.status(403).json({ error: "forbidden" });

    await prisma.vault.delete({ where: { id } });

    res.json({ message: "vault deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to delete vault" });
  }
});

module.exports = router;
