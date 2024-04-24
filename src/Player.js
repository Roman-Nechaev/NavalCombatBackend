const Battlefield = require("./Battlefield");

module.exports = class Player {
  battlefield = new Battlefield();
  socket = null;
  party = null;
  sessionId = null;

  constructor(socket, sessionId) {
    Object.assign(this, { socket, sessionId });
  }

  get ready() {
    return this.battlefield.complete && !this.party && this.socket;
    // if (!this.battlefield.complete) {
    //   return false;
    // }
    // if (this.party) {
    //   return false;
    // }
    // if (!this.socket) {
    //   return false;
    // }

    // return true;
  }

  on(...args) {
    if (this.socket && this.socket.connected) {
      this.socket.on(...args);
    }
  }

  emit(...args) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(...args);
    }
  }
};
