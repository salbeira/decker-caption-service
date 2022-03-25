class SessionClient {
  constructor(websocket) {
    this.websocket = websocket;
    this.websocket.addEventListener("message", (event) =>
      this.handleMessage(event)
    );
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
  }
}
