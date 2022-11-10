var createError = require('http-errors');
var fs = require('fs');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { xxh32 } = require('@node-rs/xxhash')

var indexRouter = require('./routes/index');
var assetsRouter = require('./routes/assets');
const session = require('express-session')
const MemoryStore = require('memorystore')(session)

var app = express();

// Skybolt Asset class
class SkyboltAsset {
  constructor(path, type) {
    this.path = path;
    this.type = type;
    this.name = path.split('/').pop().split('.').slice(0, -1).join('.');
    this.version = SkyboltAsset.versionFromPath(path);
  }

  asInlinedHtml(store=true) {
    const wrapperTag = {
      'style': 'style',
      'script': 'script',
      'fragment': 'div'
    }[this.type];
    return `<${wrapperTag} sb-type='${this.type}' sb-name='${this.name}' sb-version='${this.version}'${ store ? " sb-state='store'" : ""}>${this.getContents()}</${wrapperTag}>`; 
  }

  asCacheReferenceHtml() {
    return `<meta sb-type='${this.type}' sb-name='${this.name}' sb-version='${this.version}' sb-state='load'>`;
  }

  asStandardScriptTag(urlPrefix) {
    if (this.type !== 'script') {
      throw new Error(`Cannot create script tag for asset type: ${this.type}`);
    }
    return `<script src='${urlPrefix}${this.version}/${this.name}.js'></script>`;
  }

  getContents() {
    return fs.readFileSync(this.path, 'utf8');
  }

  static getExtensionForType(type) {
    if (type === 'style') {
      return 'css';
    } else if (type === 'script') {
      return 'js';
    } else if (type === 'fragment') {
      return 'html';
    } else {
      throw new Error(`Unknown asset type: ${type}`);
    }
  }

  static versionFromPath(filePath) {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return Buffer.from(xxh32(fileContents, 0).toString(16), 'hex').toString('base64');
  }
}

// Skybolt class
class Skybolt {
  constructor(session) {
    this.session = session;
    this.clientInventory = session.assets || {};
    this.isColdLoad = session.assets === undefined;
    this.masterInventory = {
      script: this.getAssetsInFolder(path.join(__dirname, 'public', 'javascripts')),
      style: this.getAssetsInFolder(path.join(__dirname, 'public', 'stylesheets')),
      fragment: this.getAssetsInFolder(path.join(__dirname, 'public', 'fragments')),
    };
  }

  // getAssetsInFolder
  // Iterates over files in a folder, hashes their contents, and returns them as {name, version (hash)} objects
  getAssetsInFolder(folderPath) {
    const assetMap = {};
    fs.readdirSync(folderPath).map((fileName) => {
      // Ignore hidden files (e.g. .gitkeep)
      if (fileName.startsWith('.')) {
        return;
      }
      const name = fileName.split('.').slice(0, -1).join('.');
      const assetType = {
        'js': 'script',
        'css': 'style',
        'html': 'fragment',
      }[fileName.split('.').pop()];
      const version = SkyboltAsset.versionFromPath(path.join(folderPath, fileName));
      assetMap[name] = new SkyboltAsset(path.join(folderPath, fileName), assetType);
    });
    return assetMap;
  }

  // getAsset
  // Returns the current version (as a SkyboltAsset) of an asset from the master inventory
  getAsset(type, name) {
    return this.masterInventory[type][name];
  }

  // assetToMarkup
  // Returns the markup for an asset
  assetToMarkup(asset, store=true) {
    if ( ! this.clientInventoryContains(asset)) {
      return asset.asInlinedHtml(store);
    } else {
      return asset.asCacheReferenceHtml();
    }
  }

  clientInventoryContains(asset) {
    return !this.isColdLoad && this.clientInventory[asset.name] === asset.version;
  }
}

// Skybolt middleware to rewrite custom elements in the rendered html
const originalRenderFunction = express.response.render;
express.response.render = function render(view, options, callback) {
  var self = this;
  var cb = callback;
  var opts = options || {};
  var req = this.req;
  const skybolt = new Skybolt(req.session);

  // Support callback function as second arg
  if (typeof options === 'function') {
    cb = options;
    opts = {};
  }

  // Provide a default callback
  cb = cb || function (err, str) {
    if (err) return req.next(err);
    self.send(str);
  };

  // Wrap the callback function to rewrite the html
  var rewriteAndRender = function(err, str) {
    if (err) return cb(err);

    // Rewrite the html, inserting the Skybolt loader
    const latestLoaderAsset = skybolt.getAsset('script', 'skybolt-load');
    if (skybolt.clientInventoryContains(latestLoaderAsset)) {
      str = str.replace('</head>', `${latestLoaderAsset.asStandardScriptTag('/assets/js/')}</head>`);
    } else {
      str = str.replace('</head>', `${latestLoaderAsset.asInlinedHtml()}</head>`);
    }

    // Rewrite the html, inserting the Skybolt cache builder
    const latestCacheBuilderAsset = skybolt.getAsset('script', 'skybolt-store');
    str = str.replace('</body>', skybolt.assetToMarkup(latestCacheBuilderAsset) + '<script>Skybolt.loadFromCache();</script></body>');

    // Rewrite the html, inlining scripts, stylesheets, and fragments
    str = str.replace(/<(style|script|fragment)-cached .*?><\/\1-cached>/g, (match) => {
      const assetType = match.match(/<(style|script|fragment)-cached .*?>/)[1],
            assetTag = assetType === 'fragment' ? 'div' : assetType,
            url = match.match(/src="(.+?)"/)[1],
            assetName = url.split('/').pop().split('.').slice(0, -1).join('.');
      try {
        // Hash the asset body using XXHash
        const assetBody = fs.readFileSync(path.join(__dirname, 'public', url), 'utf8'),
              assetVersion = Buffer.from(xxh32(assetBody, 0).toString(16), 'hex').toString('base64');
        
        if (skybolt.clientInventoryContains({name: assetName, version: assetVersion})) {
          // If the asset is already in the client's inventory,
          // we insert a meta tag to load the cached version
          return `<meta sb-state='load' sb-type='${assetType}' sb-name='${assetName}' sb-version='${assetVersion}'>`;
        }
        // Otherwise, we inline the asset
        return `<${assetTag} sb-type='${assetType}' sb-name='${assetName}' sb-version='${assetVersion}' sb-state='store'>${assetBody}</${assetTag}>`;
      } catch (err) {
        console.error(err);
        return `<!-- Error: '${url}' not found -->`;
      }
    });

    cb(null, str);
  };

  // Pass the wrapped callback to the original render function
  originalRenderFunction.call(self, view, opts, rewriteAndRender);
};


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Skybolt needs sessions to store the clients' asset inventory, as
// otherwise the client would have to send the inventory on every request
app.use(session({
  cookie: { maxAge: 86400000 },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  resave: false,
  saveUninitialized: false,
  secret: 'definitely not keyboard cat'
}))

// Skybolt middleware to check for cached assets
// and manage the session inventory
app.use(function (req, res, next) {
  const selfdestruct = req.cookies['cachebuster'] === 'true',
        loaderCachedVersion = req.cookies['loadercached'],
        assetsCachedByClient = JSON.parse(req.cookies['assets'] || '{}');

  if (selfdestruct) {
    // Skybolt client self-destructed, so we clear everything
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
  }

  if (loaderCachedVersion) {
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

  // And we set the proper cache headers for the assets folder
  if (req.path.match(/^\/assets\//)) {
    // Set to expire in one year, remove all other cache headers
    res.header('Expires', new Date(Date.now() + 31536000000).toUTCString());
    res.header('Cache-Control', null);
    res.header('ETag', null);
    res.header('Last-Modified', null);
  }

  next()
})

app.use('/', indexRouter);
// Skybolt asset routing
app.use('/assets', assetsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
