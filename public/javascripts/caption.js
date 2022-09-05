let SpeechRecognitionImpl = undefined;

/* Check if feature is available
 * Usage tutorial: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API */
if (
  !!window.SpeechRecognition ||
  !(typeof webkitSpeechRecognition === "undefined")
) {
  SpeechRecognitionImpl = window.SpeechRecognition || webkitSpeechRecognition;
}

let speechRecognitionObject = undefined;

let currentSpan = undefined;
let area = document.querySelector(".area");
let fullscreenButton = document.querySelector(".fullscreen");
let qrcodeButton = document.querySelector(".qrcode");
let connection = undefined;

function showError(message) {
  let dialog = document.getElementById("error-dialog");
  let error = document.getElementById("error-dialog-message");
  error.innerText = message;
  dialog.showModal();
}

function closeErrorDialog() {
  let dialog = document.getElementById("error-dialog");
  dialog.close();
}

function closeQRCodeDialog() {
  let dialog = document.getElementById("qrcode-dialog");
  dialog.close();
}

function setupSpeechRecognition(lang) {
  if (!SpeechRecognitionImpl) {
    showErrorMessage("Ihr Browser untersützt keine Spracherkennung.");
    return;
  }
  speechRecognitionObject = new SpeechRecognitionImpl();
  speechRecognitionObject.continuous = true;
  speechRecognitionObject.interimResults = true;
  speechRecognitionObject.lang = lang;
  speechRecognitionObject.onstart = () => handleStart();
  speechRecognitionObject.onresult = (event) => handleResult(event);
  speechRecognitionObject.onerror = (event) => handleError(event);
  speechRecognitionObject.onend = () => handleEnd();

  let url = document.URL;

  fetch("../api/session", {
    method: "POST",
  })
    .then((response) => response.json())
    .then((json) => {
      if (json.session && json.token) {
        connection = json;
        if (!connection.server) {
          connection.server = url;
        }
        connection.cors =
          window.location.origin !== new URL(connection.server).origin
            ? "cors"
            : "same-origin";
      } else {
        showErrorMessage("Verbindung zum Server fehlgeschlagen.");
      }
    });

  speechRecognitionObject.start();
}

function handleStart() {}

function createSpan() {
  currentSpan = document.createElement("span");
  currentSpan.classList.add("current");
  area.appendChild(currentSpan);
}

function updateCaptionContent(text) {
  if (!text) return;
  if (connection) {
    fetch(
      `${connection.server}/api/session/${this.connection.session}/update`,
      {
        mode: connection.cors,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: this.connection.token, text: text }),
      }
    ).catch((error) => {
      console.error(error);
    });
  }
  if (!currentSpan) createSpan();
  currentSpan.textContent = text;
  area.scrollTo(0, area.scrollHeight);
}

function finalizeCaptionContent(text) {
  if (!text) return;
  if (connection) {
    fetch(
      `${this.connection.server}/api/session/${this.connection.session}/final`,
      {
        mode: this.connection.cors,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: this.connection.token, text: text }),
      }
    );
  }
  if (!currentSpan) createSpan();
  currentSpan.textContent = text;
  currentSpan.classList.remove("current");
  currentSpan = undefined;
  area.scrollTo(0, area.scrollHeight);
}

/**
 * Updates the current span if result is not final,
 * or finalizes the current one and creates a new one.
 * @param {*} event
 */
function handleResult(event) {
  for (var i = event.resultIndex; i < event.results.length; i++) {
    if (event.results[i][0].confidence > 0.1) {
      updateCaptionContent(event.results[i][0].transcript);
      if (event.results[i].isFinal) {
        finalizeCaptionContent(event.results[i][0].transcript);
      }
    }
  }
}

/**
 * If an error occurs we just finalize the current span and log the error.
 * @param {*} event
 */
function handleError(event) {
  console.error(event);
  finalizeCaptionContent(this.currentSpan?.innerHTML);
}

/**
 * Finalize the current span and restart the recognition if we still
 * want to caption.
 */
function handleEnd() {
  this.finalizeCaptionContent(this.currentSpan?.innerHTML);
  speechRecognitionObject.start();
}

fullscreenButton.addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.body.requestFullscreen();
  }
});

qrcodeButton.addEventListener("click", () => {
  let dialog = document.getElementById("qrcode-dialog");
  let qrcodeDiv = document.getElementById("qrcode-element");
  while (qrcodeDiv.lastChild) {
    qrcodeDiv.removeChild(qrcodeDiv.firstChild);
  }
  let url = new URL(document.URL);
  let paths = url.pathname.split("/");
  let subpath = "/";
  for (let i = 0; i < paths.length; i++) {
    if (paths[i] === "") continue;
    if (paths[i] === "host") break;
    subpath += paths[i];
  }
  url = "https://" + url.hostname + subpath + "sessions/" + connection.session;
  new QRCode(qrcodeDiv, url);
  dialog.showModal();
});

document.body.addEventListener("fullscreenchange", (event) => {
  if (document.fullscreenElement) {
    fullscreenButton.firstElementChild.classList.remove("fa-expand");
    fullscreenButton.firstElementChild.classList.add("fa-compress");
  } else {
    fullscreenButton.firstElementChild.classList.remove("fa-compress");
    fullscreenButton.firstElementChild.classList.add("fa-expand");
  }
});

setupSpeechRecognition("de");
