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

const RESTART_INTERVAL = 2000;
let lastEvent;
let defibrilator;

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
  const dialog = document.getElementById("language-select-dialog");
  dialog.close();
  if (!SpeechRecognitionImpl) {
    showError("Ihr Browser untersützt keine Spracherkennung.");
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

  fetch("./api/session", {
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
        document.title = `Live-Untertitelung von ${connection.session}`;
      } else {
        showErrorMessage("Verbindung zum Server fehlgeschlagen.");
      }
    });

  speechRecognitionObject.start();
}

/**
 * Stop the speechRecognition if no data comes in for a while.
 * The handleEnd() function should then restart the recognition as if an error had occurred.
 */
function defibrilate() {
  const now = Date.now();
  const timeSinceLastEvent = now - lastEvent;
  if (timeSinceLastEvent > RESTART_INTERVAL) {
    speechRecognitionObject.abort();
  }
}

function handleStart() {
  lastEvent = Date.now();
  defibrilator = setInterval(defibrilate, RESTART_INTERVAL);
}

function createSpan() {
  currentSpan = document.createElement("span");
  currentSpan.classList.add("current");
  area.appendChild(currentSpan);
}

function updateCaptionContent(text) {
  if (!text) return;
  if (connection) {
    fetch(`${connection.server}/api/session/${connection.session}/update`, {
      mode: connection.cors,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: connection.token, text: text }),
    }).catch((error) => {
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
    fetch(`${connection.server}/api/session/${connection.session}/final`, {
      mode: connection.cors,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: connection.token, text: text }),
    });
  }
  if (!currentSpan) createSpan();
  currentSpan.textContent = text + " ";
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
  lastEvent = Date.now();
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
  if (!(event.error === "aborted")) {
    console.error(event);
    finalizeCaptionContent(currentSpan?.innerHTML);
  }
}

/**
 * Finalize the current span and restart the recognition if we still
 * want to caption.
 */
function handleEnd() {
  clearInterval(defibrilator);
  finalizeCaptionContent(currentSpan?.innerHTML);
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
  if (!SpeechRecognitionImpl) {
    showError("Ihr Browser unterstützt keine Spracherkennung.");
    return;
  }
  let dialog = document.getElementById("qrcode-dialog");
  let linkDiv = document.getElementById("qrcode-link");
  let qrcodeDiv = document.getElementById("qrcode-element");
  while (qrcodeDiv.lastChild) {
    qrcodeDiv.removeChild(qrcodeDiv.firstChild);
  }
  const url = connection.server + "/session/" + connection.session;
  linkDiv.innerText = connection.session;
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

function showLanguageSelect() {
  if (!SpeechRecognitionImpl) {
    showError("Ihr Browser unterstützt keine Spracherkennung.");
    return;
  }
  const dialog = document.getElementById("language-select-dialog");
  dialog.showModal();
}

function selectCustomLanguage() {
  const input = document.getElementById("language-select-input");
  const value = input.value;
  if (!value || value === "") {
    input.focus();
    return;
  }
  setupSpeechRecognition(value);
}

showLanguageSelect();
// setupSpeechRecognition("de");

function debugFillArea() {
  for (let i = 0; i < 200; i++) {
    finalizeCaptionContent("Lorem Ipsum");
  }
}
