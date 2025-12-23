const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


//add new users

router.post("/", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "username, email and password required",
      });
    }

    const user = await prisma.user.create({
      data: { username, email, password },
    });

    res.status(201).json(user);
  } catch (err) {
  console.log(err);
  res.status(500).json({ error: String(err) });
}

});


//see users

router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: "desc" },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "failed to fetch users" });
  }
});


// Delete users
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.note.deleteMany({
      where: { ownerId: id },
    });

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: "user deleted" });
  } catch (err) {
    res.status(500).json({ error: "failed to delete user" });
  }
});

module.exports = router;