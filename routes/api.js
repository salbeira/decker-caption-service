var express = require("express");
var router = express.Router();

var sessions = require("../session");

const config = require("../config.json");

router.post("/session", function (req, res, next) {
  sessions.cleanup();
  let session = sessions.newSession();
  if (config["base-url"]) {
    session.server = config["base-url"];
  }
  res.status(200);
  res.json(session);
  res.end();
});

router.post("/session/:session_id/update", function (req, res, next) {
  let id = req.params.session_id;
  let session = sessions.getSession(id);
  if (!session) {
    console.log(id);
    res.status(404);
    res.end();
    return;
  }
  const token = req.body.token;
  const text = req.body.text;
  if (session.token !== token) {
    res.status(401);
    res.end();
    return;
  }
  session.update(text);
  res.status(200);
  res.end();
});

router.post("/session/:session_id/final", function (req, res, next) {
  let id = req.params.session_id;
  let session = sessions.getSession(id);
  if (!session) {
    res.status(404);
    res.end();
    return;
  }
  const token = req.body.token;
  const text = req.body.text;
  if (session.token !== token) {
    res.status(401);
    res.end();
    return;
  }
  session.finalize(text);
  res.status(200);
  res.end();
});

module.exports = router;
