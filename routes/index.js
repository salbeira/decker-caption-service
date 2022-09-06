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
  const id = req.params.session_id;
  if (!sessions[id]) {
    res.status(404);
    res.render("error", {
      message: "Keine Sitzung mit Kennung " + id + " gefunden.",
      error: {
        status: 404,
      },
    });
    return;
  }
  res.render("listen", { session_id: id });
});

module.exports = router;
