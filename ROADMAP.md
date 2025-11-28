# Skybolt Roadmap

This document outlines the planned features and improvements for Skybolt.

## Version 3.1 (Current) ✅

**Status:** Beta | **Released:** November 2025

### Completed Features

- ✅ Multi-language support (Go, PHP, Python, Ruby)
- ✅ Framework integrations (Django, Flask, Gin, Laravel, Ruby on Rails)
- ✅ Vite integration for build-time bundling
- ✅ Manifest-based asset discovery
- ✅ CDN support with configurable URLs
- ✅ Service Worker caching with Cache API
- ✅ Cookie-based version tracking

### Planned Tasks for 3.x

- [X] **Language specific repos** - Add 'splitter' Github Actions for each supported language - all the languages get a repo!

- [X] **Async CSS** - Make it possible to actually load non-critical CSS in a non-blocking way while still using Service Worker caching; preload plus JS to apply styles once fetched? `<link rel="preload" href="path/to/mystylesheet.css" as="style" onload="this.rel='stylesheet'">` is pretty neat

- [X] **README Look&Feel** - Revamp READMEs with better visuals & diagrams; logo/header, before/after performance charts

- [X] **Publish skybolt-php to Packagist** - Make it installable via Composer; set up GitHub Actions for automatic releases
- [X] **Publish skybolt-python to PyPI** - Make it installable via pip; set up GitHub Actions for automatic releases
- [X] **Publish skybolt-ruby to RubyGems** - Make it installable via gem; set up GitHub Actions for automatic releases
- [X] **Publish skybolt-go to Go Modules** - Make it installable via `go get`; set up GitHub Actions for automatic releases

- [X] **Publish tooling** - Publishing the packages should be as simple as `./publish.sh patch|minor|major` from each package directory

- [X] **Bun/Node.js adapter package** - JavaScript/TypeScript adapter NPM package (`@skybolt/server-adapter`)

- [X] **Test Suite** - smoke test all packages and examples! Spin up server, use aheadless browser.
  - Hit without cookie, check console logs, check markup, check cache status
  - Hit with cookie, check console logs, check markup, check cache status again
  - Hit with cookie again, check console logs, check markup, check cache status
  - Check if assets are reachable directly

## Future Vision 🚀

**Target:** 2026 | **Focus:** Anything not prioritized for 3.x

- [ ] **Cache Digest** - Replace manifest-based asset discovery with cache digests for smaller cookies (Cuckoo filter?). See <https://calendar.perfplanet.com/2016/cache-digests-http2-server-push/>

- [ ] **HTML Fragment Caching** - Support caching of HTML fragments (e.g., partials, components) alongside CSS/JS assets. The challenge is we've designed Skybolt around a build-time asset definition model, so you'd need to define your assets upfront - in the Vite config. And even if we limit it to known reusable components, different stacks have very different methods for rendering those, so it would make it tricky to implement in a generic way.

- [ ] **Laravel Integration** - Framework integration with Laravel (Blade directives), include in skybolt-php package
- [ ] **Express.js Integration** - Framework integration with Express.js, include in skybolt-server-adapter package
- [ ] **Gin Integration** - Framework integration with Gin, include in skybolt-go package
- [ ] **Rails Integration** - Framework integration with Rails, include in skybolt-ruby package
- [ ] **Django Integration** - Framework integration with Django (middleware, template tags?), include in skybolt-python package
- [ ] **Nette Integration** - Framework integration with Nette (Latte and Nette Assets), include in skybolt-php package

- [ ] **Import Maps** - Consider if we could use import maps to manage JS dependencies more efficiently?

- [ ] **Stale version purging** - I think we should not cache multiple versions of the same asset. Since we know the asset ‘name’ we should be able to purge existing assets with a different hash when a new one is inlined from the server.

### Concept: Skybolt Chain Lightning ⚡⚡⚡

What if you had a site with a lot of JS components with dependencies on each other -- a big hairy dependency graph like you might get when you compose your app from a lot of NPM packages.

And what if you wanted good caching and fast loading times?

- You would not want to bundle everything into one big file, because that would be slow to load and cache inefficiently. Updates would invalidate the whole bundle every time. This is what many SPA frameworks do today, but this does indeed lead to slow initial load times and poor caching.
- You also would not want to have each component load separately but bundling its own dependencies, because that would lead to duplication and bloat.
- And you would not want to dynamically import-fetch all dependencies on demand, because the 'chaining' of dependencies would lead to sequential loading, ultimately resulting in very large delays before a component would be ready.

THE HOLY GRAIL..... is the ability to insert a 'script component' tag which would begin fetching that component and its whole dependency tree immediately and in parallel (or bundled on demand, but that requires server work on every asset request, best to avoid that), so the server only returns non-cached assets, and the client then caches everything efficiently. If two components share a dependency, that dependency is only fetched once.

One of the challenges with something like that is versioning; your search component may depend on your UI library v1.2.1 (fetched from a versioned URL), so what happens when there is a new patch version 1.2.2 of the UI library? You don't want to have to update your search component just to update the `ìmport('ui-library')` statement to point to the new version. You want components to depend on version ranges that are decoupled from the concrete cached dependency URL. Import Maps solve that problem nicely, but you have to build the tooling around that, the dependency resolution, the import map generation, the script tag generation, etc.

But.... it's totally doable.

So that is what our new library 'Chain Lightning' (package names a la `skybolt/chain-lightning`) will do!!!

---

**Last Updated:** November 28, 2025
