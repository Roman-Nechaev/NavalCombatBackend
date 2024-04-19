const Player = require("./Player");
const Party = require("./Party");
const Ship = require("./Ship");
const { getRandomString } = require("./additional");

module.exports = class PartyManager {
  players = [];
  partys = [];

  waitingRandom = [];
  waitingChallenge = new Map();

  connection(socket) {
    // TODO: индефикация одного пользователя

    const player = new Player(socket);
    this.players.push(player);

    const isFree = () => {
      if (this.waitingRandom.includes(player)) {
        return false;
      }
      const values = Array.from(this.waitingChallenge.values());
      if (values.includes(player)) {
        return false;
      }
      if (player.party) {
        return false;
      }
      return true;
    };

    socket.on("shipSet", (ships) => {
      if (!isFree()) {
        return;
      }

      player.battlefield.clear();

      for (const { size, direction, x, y } of ships) {
        const ship = new Ship(size, direction);
        player.battlefield.addShip(ship, x, y);
      }
    });

    socket.on("findRandomOpponent", () => {
      if (!isFree()) {
        return;
      }

      this.waitingRandom.push(player);
      player.emit("statusChange", "randomFinding");

      if (this.waitingRandom.length >= 2) {
        const [player1, player2] = this.waitingRandom.splice(0, 2);
        const party = new Party(player1, player2);
        this.partys.push(party);

        const unsubscribe = party.subscribe(() => {
          this.removeParty(party);
          unsubscribe();
        });
      }
    });

    socket.on("challengeOpponent", (key = "") => {
      if (!isFree()) {
        return;
      }

      if (this.waitingChallenge.has(key)) {
        const opponent = this.waitingChallenge.get(key);
        this.waitingChallenge.delete(key);

        const party = new Party(opponent, player);
        this.partys.push(party);
      } else {
        //ключ партии
        key = getRandomString(20);
        socket.emit("challengeOpponent", key);
        socket.emit("statusChange", "waiting");

        this.waitingChallenge.set(key, player);
      }
    });

    socket.on("gaveup", () => {
      if (player.party) {
        player.party.gaveup(player);
      }

      if (this.waitingRandom.includes(player)) {
        const index = this.waitingRandom.indexOf(player);
        this.waitingRandom.splice(index, 1);
      }
      const values = Array.from(this.waitingChallenge.values());
      if (values.includes(player)) {
        const index = values.indexOf(player);
        const keys = Array.from(this.waitingChallenge.keys());
        const key = keys[index];
        this.waitingChallenge.delete(key);
      }
    });
    socket.on("addShot", (x, y) => {
      if (player.party) {
        player.party.addShot(player, x, y);
      }
    });
    socket.on("message", (message) => {
      if (player.party) {
        player.party.sendMessage(message);
      }
    });
  }

  disconnect(socket) {
    const player = this.players.find((player) => player.socket === socket);

    if (!player) {
      return;
    }

    if (player.party) {
      player.party.gaveup(player);
    }

    if (this.waitingRandom.includes(player)) {
      const index = this.waitingRandom.indexOf(player);
      this.waitingRandom.splice(index, 1);
    }
    const values = Array.from(this.waitingChallenge.values());
    if (values.includes(player)) {
      const index = values.indexOf(player);
      const keys = Array.from(this.waitingChallenge.keys());
      const key = keys[index];
      this.waitingChallenge.delete(key);
    }
  }

  addPlayer(player) {
    if (this.players.includes(player)) {
      return false;
    }

    this.players.push(player);

    return true;
  }

  removePlayer(player) {
    if (!this.players.includes(player)) {
      return false;
    }
    const index = this.players.indexOf(player);
    this.players.splice(index, 1);

    if (this.waitingRandom.includes(player)) {
      const index = this.waitingRandom.indexOf(player);
      this.waitingRandom.splice(index, 1);
    }

    return true;
  }

  removeAllPlayers() {
    const players = this.players.splice();
    for (const player of players) {
      this.removePlayer(player);
    }
    return players.length;
  }

  addParty(party) {
    if (this.partys.includes(party)) {
      return false;
    }

    this.partys.push(party);

    return true;
  }

  removeParty(party) {
    if (!this.partys.includes(party)) {
      return false;
    }
    const index = this.partys.indexOf(party);

    this.partys.splice(index, 1);

    return true;
  }

  removeAllParty() {
    const partys = this.partys.splice();
    for (const party of partys) {
      this.removeParty(party);
    }
    return partys.length;
  }

  playRandom(player) {
    if (this.waitingRandom.includes(player)) {
      return false;
    }
    this.waitingRandom.push(player);

    if (this.waitingRandom.length >= 2) {
      const [player1, player2] = this.waitingRandom.splice(0, 2);
      const party = new Party(player1, player2);
      this.addParty(party);
    }
    return true;
  }
};
