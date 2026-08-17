const jwt = require("jsonwebtoken");

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

module.exports = { getUserId };
