const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

// all the routes
const usersRouter = require("./routes/users");
const notesRouter = require("./routes/notes");
const linksRouter = require("./routes/links");

app.use("/users", usersRouter);
app.use("/notes", notesRouter);
app.use("/links", linksRouter);

console.log("... SERVER IS RUNNING ...");
app.listen(3000);
