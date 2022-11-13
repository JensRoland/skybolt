// Skybolt middleware to check for cached assets and manage the session inventory
const assetInventory = function (req, res, next) {
  const selfdestruct = req.cookies['cachebuster'] === 'true',
        loaderCachedVersion = req.cookies['loadercached'],
        assetsCachedByClient = JSON.parse(req.cookies['assets'] || '{}');

  if (selfdestruct) {
    // Skybolt client self-destructed, so we clear everything
    console.debug('Skybolt client self-destructed, clearing everything...');
    res.clearCookie('cachebuster');
    res.clearCookie('loadercached');
    res.clearCookie('assets');
    // Clear the session inventory too
    if (req.session.assets) {
      delete req.session.assets;
    }
  }

  if (assetsCachedByClient) {
    // Skybolt client has cached assets, so we update the session
    if (!req.session.assets) {
      req.session.assets = {};
    }
    Object.assign(req.session.assets, assetsCachedByClient);
    console.debug(`Updated session assets:`, req.session.assets);
    res.clearCookie('assets');
  }

  if (loaderCachedVersion) {
    console.debug(`Client cached the loader with version: ${loaderCachedVersion}, registering it in the session...`);
    // Skybolt client has cached the loader, so we register it as cached
    if (!req.session.assets) {
      req.session.assets = {};
    }
    req.session.assets['skybolt-load'] = loaderCachedVersion;
    // Expire the cookie now that we're done with it
    res.clearCookie('loadercached');
  }

  // Finally, we attach the asset inventory to the locals for the view
  res.locals.assets = req.session.assets || {};

  next()
}

module.exports = assetInventory;
