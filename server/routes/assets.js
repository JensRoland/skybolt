var express = require('express');
var router = express.Router();

/* GET script */
router.get('/js/*/:filename', function(req, res, next) {
  res.sendFile(req.params.filename, {root: 'public/javascripts'});
});

/* GET stylesheet */
router.get('/css/*/:filename', function(req, res, next) {
  res.sendFile(req.params.filename, {root: 'public/stylesheets'});
});

/* GET HTML fragment */
router.get('/fragment/*/:filename', function(req, res, next) {
  res.sendFile(req.params.filename, {root: 'public/fragments'});
});

module.exports = router;
