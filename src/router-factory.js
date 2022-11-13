const path = require('path');
const express = require('express');

function routerFactory(devMode, config) {
  console.debug(`Creating router for asset paths with devMode ${devMode} and config:`, config);
  const router = express.Router();
  
  /* GET script */
  router.get('/js/*/:filename', (req, res, next) => {
    console.debug(`GET /assets/js/${req.params.filename} with devMode = ${devMode}`);
    // Inject the Skybolt script files if requested
    if (req.params.filename === 'skybolt-store.js' || req.params.filename === 'skybolt-load.js') {
      console.debug(`Returning Skybolt script ${req.params.filename} with path ${path.join(__dirname, 'clientside-scripts', (devMode ? '' : 'min'))}`);
      res.sendFile(req.params.filename, {root: path.join(__dirname, 'clientside-scripts', (devMode ? '' : 'min'))});
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
