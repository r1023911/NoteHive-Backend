const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const usersRouter = require("./routes/users");
const notesRouter = require("./routes/notes");
const linksRouter = require("./routes/links");
const vaultsRouter = require("./routes/vaults");
const sharesRouter = require("./routes/shares");

app.use("/users", usersRouter);
app.use("/notes", notesRouter);
app.use("/links", linksRouter);
app.use("/vaults", vaultsRouter);
app.use("/shares", sharesRouter);

console.log("... SERVER IS RUNNING ...");
app.listen(3000);
