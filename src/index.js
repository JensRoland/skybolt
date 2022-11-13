const tamper = require('tamper');

const assetInventory = require('./asset-inventory.js');
const routerFactory = require('./router-factory.js');
const renderOverride = require('./render-override.js');

// Set the proper cache headers for successful asset responses
const assetCacheHeaders = tamper(function(req, res) {
  if (req.originalUrl.match(/^\/assets\//) && res.statusCode === 200) {
    // Set to expire in one year, remove all other cache headers
    res.header('Expires', new Date(Date.now() + 31536000000).toUTCString());
    res.header('Cache-Control', null);
    res.header('ETag', null);
    res.header('Last-Modified', null);
  }
  return;
});

function initSkybolt(express, app, options) {
  // Development mode?
  console.log(`App env is set to ${app.get('env')}`);
  const devMode = app.get('env') === 'development';
  // Use sessions
  if (options['sessionConfig']) initSession(app, options['sessionConfig']);

  // Hook up the main middleware
  app.use(assetInventory);

  // Set cache headers for assets
  app.use(assetCacheHeaders);

  // Setup routing for the /assets folder
  app.use('/assets', routerFactory(devMode, options['assetPaths']));

  // Finally, override the render function to modify the HTML
  renderOverride(express, devMode);
}

// Skybolt needs sessions to store the clients' asset inventory, as
// otherwise the client would have to send the inventory on every request
function initSession(app, sessionConfig) {
  const session = require('express-session');
  const MemoryStore = require('memorystore')(session);
  let defaultSessionConfig = {
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
  };
  app.use(session(Object.assign(defaultSessionConfig, sessionConfig)));
}

module.exports = initSkybolt;
