var express = require("express");
var router = express.Router();

var sessions = require("../session");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Decker Live-Captioning" });
});

router.get("/host/", function (req, res, next) {
  res.render("host", {});
});

router.get("/session/:session_id", function (req, res, next) {
  res.render("listen", { session_id: req.params.session_id });
});

module.exports = router;
