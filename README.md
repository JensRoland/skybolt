# Skybolt

Skybolt is a high performance front end asset loading and caching library which jumps through significant hoops to make sure your assets are loaded as fast as possible, and always with a Lighthouse / Page Speed score of 100.

In a nutshell, the Skybolt Server component will detect if a client is 'cold' and automatically inline all assets into the HTML, eliminating additional HTTP requests. The Skybolt Client component will take these inlined assets, store them in localStorage, and then serve them from there on subsequent requests.

## Getting Started

1. Upload the contents of the `src/` folder to your PHP7/8 enabled web server (making sure you include the `.htaccess` file)
2. Edit the `src/libs/config.php` file to suit your needs (especially the `SITE_ROOT` constant)
3. Open the URL to the source folder in your browser
4. Take a look at the source to see how the HTML is being served, and how the assets are being inlined

## Features

- [X] Supports all major browsers
- [X] Caching of scripts, styles, and HTML fragments (both inline and external assets)
- [X] Hash-based asset versioning (using [XXH3](https://github.com/Cyan4973/xxHash) when available, or MD5 as a good-enough fallback)
- [X] [AMD named module](https://en.wikipedia.org/wiki/Asynchronous_module_definition) support (customized for versioning): module definition, parallel loading, dependency resolution
- [X] Dynamic imports
- [X] Code splitting
- [X] Automatic inlining of assets for performance - all the benefits of bundling without actually bundling anything
- [ ] Skybolt as a package (NPM, Composer, PyPi?)
- [ ] Native ESM module support
- [ ] NPM (CommonJS) module support
- [ ] Caching of >5MB of assets by leveraging IndexedDB
- [ ] Build step to generate 'master inventory' of assets
- [ ] Server sends cache invalidation commands to clients when cached assets are updated
- [ ] Preloading of assets (requestIdleCallback?)
- [ ] Integrated CDN support
- [ ] Integrated asset minification, CSS preprocessors, etc.
- [ ] Support for image assets
- [ ] Graceful handling of cookie size overflows

## Background

Skybolt was born out of web performance experiments I did around 2012-2013 together with [Morten Olsen](https://mortenolsen.pro/). I had recently led the development of Tomahawk (aka T2), a frontend framework for the [Nordic fashion community site Trendsales](https://trendsales.dk/) incorporating a number of features which were cutting edge then, but are now commonplace in modern frontend frameworks:

- JavaScript modules with dependencies (imports) and a scoped public interface (exports)
- HTML-first progressive enhancement
- Parallel async loading of dependencies
- No Virtual DOM (it wasn't invented yet)
- Multi-Page App with some client-side routing features
- Interactive modules loaded on otherwise static pages with similar benefits to the modern 'Islands' architecture
- Module decoupling with a custom pub/sub event bus
- Dynamic imports
- Code splitting and common chunks
- Server scripts could issue DOM changes with a choice of server-side rendering or client-side rendering
- HTML syntax enhancements allowing dynamic application features without any JavaScript code, similar to [htmx](https://htmx.org/)
- CSS preprocessing
- Minification of JS and CSS, compression of images
- Lazyloading of modules
- No 'hydration' but T2 used a clever event delegation method based on Facebooks 'Primer', allowing us to be interactive by the time the DOM was ready, before the modules were even downloaded
- Polyfills as modules, conditionally loaded only in browsers which need them
- Page Speed and YSlow scores consistently around 96-100 points
- Internationalization with i18n 'bundles' as meta-modules
- Blazingly-fast (precompiled) HTML templating
- Error handling and pragmatic (structured) logging to a central server

Other modern features like scoped CSS, data binding, and single-file components were not on our radar if indeed they existed in 2012, so they were never implemented in T2.
