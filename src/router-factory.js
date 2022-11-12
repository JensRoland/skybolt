const path = require('path');
const express = require('express');

function routerFactory(config) {
  const router = express.Router();
  
  /* GET script */
  router.get('/js/*/:filename', function(req, res, next) {
    // Inject the Skybolt script files if requested
    if (req.params.filename === 'skybolt-store.js' || req.params.filename === 'skybolt-load.js') {
      res.sendFile(req.params.filename, {root: path.join(__dirname, 'clientside-scripts', 'min')});
    } else {
      res.sendFile(req.params.filename, {root: config['scripts']});
    }
  });

  /* GET stylesheet */
  router.get('/css/*/:filename', function(req, res, next) {
    res.sendFile(req.params.filename, {root: config['styles']});
  });

  /* GET HTML fragment */
  router.get('/fragment/*/:filename', function(req, res, next) {
    res.sendFile(req.params.filename, {root: config['fragments']});
  });

  return router;
};

module.exports = routerFactory;
