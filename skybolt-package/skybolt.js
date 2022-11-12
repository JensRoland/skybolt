const fs = require('fs');
const path = require('path');
const { xxh32 } = require('@node-rs/xxhash')

// Skybolt class
class Skybolt {
  constructor(session) {
    const workingDirectory = process.cwd();
    this.session = session;
    this.clientInventory = session.assets || {};
    this.isColdLoad = session.assets === undefined;

    // We include our own (minified) assets in the master inventory
    const skyboltScripts = this.getAssetsInFolder(path.join(__dirname, 'clientside-scripts', 'min'));
    this.masterInventory = {
      script: Object.assign(skyboltScripts, this.getAssetsInFolder(path.join(workingDirectory, 'public', 'javascripts'))),
      style: this.getAssetsInFolder(path.join(workingDirectory, 'public', 'stylesheets')),
      fragment: this.getAssetsInFolder(path.join(workingDirectory, 'public', 'fragments')),
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

  static versionHash(fileContents) {
    return Buffer.from(xxh32(fileContents, 0).toString(16), 'hex').toString('base64');
  }

  static versionFromPath(filePath) {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return SkyboltAsset.versionHash(fileContents);
  }
}

module.exports = {
  Skybolt,
  SkyboltAsset,
};
