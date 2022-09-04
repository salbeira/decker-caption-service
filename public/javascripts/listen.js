(function () {
  let currentSpan = undefined;
  let area = document.querySelector(".area");
  let fullscreen = document.querySelector(".fullscreen");

  let url = document.URL;
  url = new URL(url);
  let paths = url.pathname.split("/");
  let id = paths[paths.length - 1];
  let subpath = "/";
  for (let i = 0; i < paths.length - 2; i++) {
    subpath += paths[i];
  }
  url = "wss://" + url.hostname + subpath + "/api/websocket";
  let socket = new WebSocket(url);
  let message = { session: id };
  socket.addEventListener("open", function (event) {
    socket.send(JSON.stringify(message));
  });
  let client = new SessionClient(socket);
  client.update = (text) => {
    if (!currentSpan) createSpan();
    currentSpan.textContent = text;
    area.scrollTo(0, area.scrollHeight);
  };
  client.finalize = (text) => {
    if (!currentSpan) createSpan();
    currentSpan.textContent = text;
    currentSpan.classList.remove("current");
    currentSpan = undefined;
    area.scrollTo(0, area.scrollHeight);
  };

  function createSpan() {
    currentSpan = document.createElement("span");
    currentSpan.classList.add("current");
    area.appendChild(currentSpan);
  }

  fullscreen.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.body.requestFullscreen();
    }
  });

  document.body.addEventListener("fullscreenchange", (event) => {
    if (document.fullscreenElement) {
      fullscreen.firstElementChild.classList.remove("fa-expand");
      fullscreen.firstElementChild.classList.add("fa-compress");
    } else {
      fullscreen.firstElementChild.classList.remove("fa-compress");
      fullscreen.firstElementChild.classList.add("fa-expand");
    }
  });
})();
