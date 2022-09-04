var express = require("express");
var cors = require("cors");
var router = express.Router();

const corsOptions = {
  origin: "*",
  optionSuccessStatus: 200,
};

const preFlight = {
  origin: true,
  credentials: true,
};

router.options("*", cors(preFlight));

var sessions = require("../session");

router.post("/session", cors(), function (req, res, next) {
  let session = sessions.newSession();
  res.status(200);
  res.json(session);
  res.end();
});

router.post("/session/:session_id/update", cors(), function (req, res, next) {
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
  session.update(text);
  res.status(200);
  res.end();
});

router.post("/session/:session_id/final", cors(), function (req, res, next) {
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
