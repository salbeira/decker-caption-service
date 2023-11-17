class SessionClient {
  pingpong = undefined;

  constructor(websocket) {
    this.websocket = websocket;
    this.websocket.addEventListener("message", (event) =>
      this.handleMessage(event)
    );
    this.pingpong = setInterval(() => this.ping(), 5000);
  }

  ping() {
    this.websocket.send(JSON.stringify({ type: "ping", text: "" }));
    this.timeout = setTimeout(() => this.status("timeout"), 5000);
  }

  handleMessage(event) {
    let rawData = event.data;
    let data = JSON.parse(rawData);
    if (data.type === "update") {
      if (this.update) {
        this.update(data.text);
      }
    }
    if (data.type === "final") {
      if (this.finalize) {
        this.finalize(data.text);
      }
    }
    if (data.type === "status") {
      if (this.status) {
        this.status(data.value);
      }
    }
    if (data.type === "pong") {
      clearTimeout(this.timeout);
    }
  }
}
