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

### Remaining Tasks for 3.1

- [X] **Language specific repos** - Add 'splitter' Github Actions for each supported language - all the languages get a repo!

- [ ] **README Look&Feel** - Revamp READMEs with better visuals & diagrams; logo/header, before/after performance charts

- [X] **Publish skybolt-php to Packagist** - Make it installable via Composer; set up GitHub Actions for automatic releases
- [X] **Publish skybolt-python to PyPI** - Make it installable via pip; set up GitHub Actions for automatic releases
- [X] **Publish skybolt-ruby to RubyGems** - Make it installable via gem; set up GitHub Actions for automatic releases
- [X] **Publish skybolt-go to Go Modules** - Make it installable via `go get`; set up GitHub Actions for automatic releases

## Version 3.2 (Next) 📦

**Target:** Q4 2025 | **Focus:** Reusable Packages for Distribution

Having examples isn't enough -- we have to provide out-of-the-box integrations (one-liners or single-command installs) for the most popular frameworks.

### Planned Features

- [ ] **HTML Fragment Caching** - Support caching of HTML fragments (e.g., partials, components) alongside CSS/JS assets

- [ ] **Bun/Node.js adapter package** - JavaScript/TypeScript adapter NPM package (`@skybolt/skybolt-js-adapter`)
  - Express integration middleware, included in js adapter package

- [ ] **ASP.NET Core adapter package** - C# adapter NuGet package (`Skybolt.AspNetCore`)
  - Middleware for ASP.NET Core, included in ASP.NET Core adapter package

- [ ] **Laravel Integration** - Framework integration with Laravel (Blade directives), include in skybolt-php package

- [ ] **Gin Integration** - Framework integration with Gin, include in skybolt-go package

- [ ] **Rails Integration** - Framework integration with Rails, include in skybolt-ruby package

## Version 4.0 (Future Vision) 🚀

**Target:** 2026 | **Focus:** Anything not prioritized for 3.x

- [ ] **Django Integration** - Framework integration with Django (middleware, template tags?), include in skybolt-python package
- [ ] **Nette Integration** - Framework integration with Nette (Latte and Nette Assets), include in skybolt-php package
- [ ] **Import Maps** - Support for import maps to manage JS dependencies more efficiently
- [ ] **Async CSS** - Make it possible to actually load non-critical CSS in a non-blocking way while still using Service Worker caching; preload plus JS to apply styles once fetched?
- [ ] **HTTP/2 Push Support** - Integrate HTTP/2 push capabilities for critical asset delivery before the initial HTML is fully loaded

---

**Last Updated:** November 25, 2025
