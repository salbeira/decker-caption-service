function get() {
  let input = document.getElementById("sid");
  let ws = new WebSocket("ws://localhost:3001");
  ws.addEventListener("open", function (event) {
    let data = {
      session: input.value,
    };
    ws.send(JSON.stringify(data));
  });
  ws.addEventListener("message", function (event) {
    let data = JSON.parse(event.data);
    console.log(data.message);
  });
}
