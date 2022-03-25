let sessions = {};

class Session {
  constructor() {
    this.spans = [];
    this.current = "";
    this.sockets = [];
    this.token = Math.floor(Math.random() * Math.pow(2, 32)).toString(36);
    this.last_action = Date.now();
  }

  update(value) {
    this.current = value;
    let data = {
      type: "update",
      text: value,
    };
    for (let socket of this.sockets) {
      socket.send(JSON.stringify(data));
    }
    this.last_action = Date.now();
  }

  finalize(value) {
    this.spans.push(value);
    this.current = "";
    let data = {
      type: "final",
      text: value,
    };
    for (let socket of this.sockets) {
      socket.send(JSON.stringify(data));
    }
    this.last_action = Date.now();
  }

  connect(socket) {
    socket.caption_session = this;
    this.sockets.push(socket);
    for (let span of this.spans) {
      let data = {
        type: "final",
        text: span,
      };
      socket.send(JSON.stringify(data));
    }
  }

  disconnect(socket) {
    let index = this.sockets.indexOf(socket);
    if (index > -1) {
      this.sockets.splice(index, 1);
    }
    socket.caption_session = undefined;
  }
}

module.exports.newSession = function () {
  let hash;
  let check;
  do {
    hash = Math.floor(Math.random() * Math.pow(2, 32)).toString(36);
    check = sessions[hash];
  } while (!!check);
  let session = new Session();
  sessions[hash] = session;
  let result = { session: hash, token: session.token };
  return result;
};

module.exports.getSession = function (hash) {
  return sessions[hash];
};

module.exports.updateSession = function (hash, value) {
  let session = sessions[hash];
  if (!!session) {
    session.update(value);
  }
};

module.exports.cleanup = function () {
  let now = Date.now();
  for (let session in sessions) {
    if (now - sessions[session].last_action > 1000 * 60 * 15) {
      delete sessions[session];
    }
  }
};
