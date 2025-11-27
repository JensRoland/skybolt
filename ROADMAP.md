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

- [ ] **HTML Fragment Caching** - Support caching of HTML fragments (e.g., partials, components) alongside CSS/JS assets

- [X] **README Look&Feel** - Revamp READMEs with better visuals & diagrams; logo/header, before/after performance charts

- [X] **Publish skybolt-php to Packagist** - Make it installable via Composer; set up GitHub Actions for automatic releases
- [X] **Publish skybolt-python to PyPI** - Make it installable via pip; set up GitHub Actions for automatic releases
- [X] **Publish skybolt-ruby to RubyGems** - Make it installable via gem; set up GitHub Actions for automatic releases
- [X] **Publish skybolt-go to Go Modules** - Make it installable via `go get`; set up GitHub Actions for automatic releases

- [X] **Publish tooling** - Publishing the packages should be as simple as `./publish.sh patch|minor|major` from each package directory

- [ ] **Bun/Node.js adapter package** - JavaScript/TypeScript adapter NPM package (`@skybolt/server-adapter`)

- [ ] **ASP.NET Core adapter package** - C# adapter NuGet package (`Skybolt.AspNetCore`)

- [X] **Test Suite** - smoke test all packages and examples! Spin up server, use aheadless browser.
  - Hit without cookie, check console logs, check markup, check cache status
  - Hit with cookie, check console logs, check markup, check cache status again
  - Hit with cookie again, check console logs, check markup, check cache status
  - Check if assets are reachable directly

## Version 4.0+ (Future Vision) 🚀

**Target:** 2026 | **Focus:** Anything not prioritized for 3.x

- [ ] **Cache Digest** - Replace manifest-based asset discovery with cache digests for smaller cookies (Cuckoo filter?). See <https://calendar.perfplanet.com/2016/cache-digests-http2-server-push/>

- [ ] **Laravel Integration** - Framework integration with Laravel (Blade directives), include in skybolt-php package
- [ ] **Express.js Integration** - Framework integration with Express.js, include in skybolt-node package
- [ ] **Gin Integration** - Framework integration with Gin, include in skybolt-go package
- [ ] **Rails Integration** - Framework integration with Rails, include in skybolt-ruby package
- [ ] **Django Integration** - Framework integration with Django (middleware, template tags?), include in skybolt-python package
- [ ] **Nette Integration** - Framework integration with Nette (Latte and Nette Assets), include in skybolt-php package

- [ ] **Import Maps** - Consider if we could use import maps to manage JS dependencies more efficiently?

- [ ] **Stale version purging** - I think we should not cache multiple versions of the same asset. Since we know the asset ‘name’ we should be able to purge existing assets with a different hash when a new one is inlined from the server.

---

**Last Updated:** November 25, 2025
