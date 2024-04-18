const session = require("express-session");
const express = require("express");

const PartyManager = require("./src/PartyManager");
const pm = new PartyManager();

const { createServer } = require("node:http");
const { Server } = require("socket.io");
const app = express();
const httpServer = createServer(app);

const port = 4040;

app.set("trust proxy", 1);

app.use(
  session({
    secret: "s3Cur3",
    name: "sessionId",
  })
);

app.use(express.static("../NavalCombat"));

const io = new Server(httpServer);

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
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
