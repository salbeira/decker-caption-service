var express = require("express");
var router = express.Router();

var sessions = require("../session");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "WebSocketTest" });
});

router.get("/host/:session_id", function (req, res, next) {
  res.render("host", { session_id: req.params.session_id });
});

router.get("/:session_id", function (req, res, next) {
  res.render("listen", { session_id: req.params.session_id });
});

module.exports = router;
