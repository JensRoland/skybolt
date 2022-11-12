const fs = require('fs');
const path = require('path');
const { Skybolt, SkyboltAsset } = require('./skybolt.js');

// Skybolt middleware to rewrite custom elements in the rendered html
function renderOverride(express) {
  const originalRenderFunction = express.response.render;
  express.response.render = function render(view, options, callback) {
    var self = this;
    var cb = callback;
    var opts = options || {};
    var req = this.req;
    const skybolt = new Skybolt(req.session);
    const indentRegex = /^(?!\s*$)/gm;
  
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

    // TODO: Remove or clean up the indentation mess here. This way assumes that the markup is indented by two spaces.
  
    // Wrap the callback function to rewrite the html
    var rewriteAndRender = function(err, str) {
      if (err) return cb(err);
  
      // Rewrite the html, inserting the Skybolt loader
      const latestLoaderAsset = skybolt.getAsset('script', 'skybolt-load');
      if (skybolt.clientInventoryContains(latestLoaderAsset)) {
        str = str.replace(/([\t ]*)<\/head>/, (match) => {
          const [ _, indent ] = match.match(/([\t ]*)<\/head>/);
          return `${indent}  ${latestLoaderAsset.asStandardScriptTag('/assets/js/')}\n${indent}</head>`;
        });
      } else {
        str = str.replace(/([\t ]*)<\/head>/, (match) => {
          const [ _, indent ] = match.match(/([\t ]*)<\/head>/);
          return `${indent}  ${latestLoaderAsset.asInlinedHtml()}\n${indent}</head>`;
        });
      }
  
      // Rewrite the html, inserting the Skybolt cache builder
      const latestCacheBuilderAsset = skybolt.getAsset('script', 'skybolt-store');
      str = str.replace(/([\t ]*)<\/body>/, `$1  ` + skybolt.assetToMarkup(latestCacheBuilderAsset) + `\n$1</body>`);
  
      // Rewrite the html, inlining scripts, stylesheets, and fragments
      str = str.replace(/([\t ]*)<(style|script|fragment)-cached .*?><\/\2-cached>/g, (match) => {
        const [ _, indent, assetType ] = match.match(/([\t ]*)<(style|script|fragment)-cached .*?>/),
              assetTag = assetType === 'fragment' ? 'div' : assetType,
              url = match.match(/src="(.+?)"/)[1],
              assetName = url.split('/').pop().split('.').slice(0, -1).join('.');
        try {
          // Hash the asset body to get the version
          const assetBody = fs.readFileSync(path.join(process.cwd(), 'public', url), 'utf8'),
                assetVersion = SkyboltAsset.versionHash(assetBody);
          
          if (skybolt.clientInventoryContains({name: assetName, version: assetVersion})) {
            // If the asset is already in the client's inventory,
            // we insert a meta tag to load the cached version
            return `${indent}<meta sb-state='load' sb-type='${assetType}' sb-name='${assetName}' sb-version='${assetVersion}'>`;
          }
          // Otherwise, we inline the asset
          return `<${assetTag} sb-type='${assetType}' sb-name='${assetName}' sb-version='${assetVersion}' sb-state='store'>\n${assetBody.replace(indentRegex, '  ')}\n</${assetTag}>`.replace(indentRegex, indent);
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
}

module.exports = renderOverride;