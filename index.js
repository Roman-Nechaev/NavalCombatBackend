const session = require("express-session");
const express = require("express");
const fs = require("fs");
const path = require("path");

const PartyManager = require("./src/PartyManager");
const pm = new PartyManager();

const { createServer } = require("node:http");
const { Server } = require("socket.io");
const app = express();
const httpServer = createServer(app);

const port = 4040;

const sessionMiddleware = session({
  secret: "s3Cur3",
  name: "sessionId",
});
app.set("trust proxy", 1);
app.use(sessionMiddleware);
console.log("");
app.use(express.static("../NavalCombat"));

//по умолчанию
app.use("*", (req, res) => {
  res.type("html");
  res.send(fs.readFileSync(path.join(__dirname, "../NavalCombat/index.html")));
});

const io = new Server(httpServer);

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

io.on("connection", (socket) => {
  pm.connection(socket);
  io.emit("playerCount", io.engine.clientsCount);

  socket.on("disconnect", () => {
    pm.disconnect(socket);
    io.emit("playerCount", io.engine.clientsCount);
  });

  // socket.on("findRandomOpponent", () => {
  //   socket.emit("statusChange", "randomFinding");
  //   pm.playRandom(socket);
  // });
});
