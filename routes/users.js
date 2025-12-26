const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const TOKEN_EXPIRES_IN = "7d";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function safeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    createdAt: u.createdAt,
    isVerified: u.isVerified,
  };
}

function genCode6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendVerifyEmail(toEmail, code) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: "Your NoteHive verification code",
    text: `Your NoteHive verification code is: ${code}\n\nThis code expires in 10 minutes.`,
  });
}

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email and password required" });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: "email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const code = genCode6();
    const codeHash = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        isVerified: false,
        emailVerifyCodeHash: codeHash,
        emailVerifyExpiresAt: expires,
      },
    });

    await sendVerifyEmail(email, code);

    res.status(201).json({
      message: "verification code sent",
      user: safeUser(user),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to register" });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "email and code required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "user not found" });

    if (user.isVerified) {
      return res.json({ message: "already verified" });
    }

    if (!user.emailVerifyCodeHash || !user.emailVerifyExpiresAt) {
      return res.status(400).json({ error: "no verification pending" });
    }

    if (new Date() > user.emailVerifyExpiresAt) {
      return res.status(400).json({ error: "code expired" });
    }

    const ok = await bcrypt.compare(code, user.emailVerifyCodeHash);
    if (!ok) return res.status(401).json({ error: "invalid code" });

    const updated = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        emailVerifyCodeHash: null,
        emailVerifyExpiresAt: null,
      },
    });

    const role = "user";
    const token = jwt.sign({ userId: updated.id, role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

    res.json({
      token,
      role,
      user: safeUser(updated),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to verify" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ error: "email not verified" });
    }

    const role = "user";
    const token = jwt.sign({ userId: user.id, role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

    res.json({
      token,
      role,
      user: safeUser(user),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to login" });
  }
});

module.exports = router;
