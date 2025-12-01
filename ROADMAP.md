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

- [X] **'Chain Lightning' Component Dependency Preloading** - Use import maps to manage JS dependencies more efficiently

- [ ] **'Primer' Interaction-Triggered Loading** - Optional on-demand component loading triggered by user interactions (click, click intent, hover, focus, scrollIntoView). A tiny (~1KB) Primer script would listen for events on annotated elements and load components just-in-time using Chain Lightning's dependency graph. Inspired by Facebook's 2012 Primer/Bootloader pattern (see [Makinde's JsConf talk](https://www.youtube.com/watch?v=wHlyLEPtL9o) and [Primer gist](https://gist.github.com/makinde/376039)), this enables instant interactivity with near-zero initial JS, conceptually similar to Qwik's resumability but without requiring a custom framework or compiler. Components remain standard ES modules.

## Future Vision 🚀

**Target:** 2026 | **Focus:** Anything not prioritized for 3.x

- [ ] **Cache Digest** - Replace manifest-based asset discovery with cache digests for smaller cookies (Cuckoo filter?). See <https://calendar.perfplanet.com/2016/cache-digests-http2-server-push/>

- [ ] **Experiment: A fully server side Chain Lightning** - A single PHP/Go/Ruby/Python script that serves static script assets and includes prebaked headers from a sidecar file, so /assets/main-abc678.js would have a sidecar /assets/main-abc678.js.headers with the necessary `103 Early Hints` headers to preload dependencies. This would not be compatible with Skybolt inlining, but it would

- [ ] **HTML Fragment Caching** - Support caching of HTML fragments (e.g., partials, components) alongside CSS/JS assets. The challenge is we've designed Skybolt around a build-time asset definition model, so you'd need to define your assets upfront - in the Vite config. And even if we limit it to known reusable components, different stacks have very different methods for rendering those, so it would make it tricky to implement in a generic way.

- [ ] **Laravel Integration** - Framework integration with Laravel (Blade directives), include in skybolt-php package
- [ ] **Express.js Integration** - Framework integration with Express.js, include in skybolt-server-adapter package
- [ ] **Gin Integration** - Framework integration with Gin, include in skybolt-go package
- [ ] **Rails Integration** - Framework integration with Rails, include in skybolt-ruby package
- [ ] **Django Integration** - Framework integration with Django (middleware, template tags?), include in skybolt-python package
- [ ] **Nette Integration** - Framework integration with Nette (Latte and Nette Assets), include in skybolt-php package

- [ ] **Stale version purging** - We can detect when a component version from the cache no longer exists in the import map, meaning it is no longer used by any page. We can use this to purge stale versions from the cache automatically.

---

**Last Updated:** November 28, 2025
