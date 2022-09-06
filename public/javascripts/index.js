function join() {
  const input = document.getElementById("session-id");
  const value = input.value;
  if (!value || value === "") {
    input.focus();
    return;
  }
  const url = document.URL;
  window.location = url + "session/" + value;
}
