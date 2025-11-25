# Skybolt Roadmap

This document outlines the planned features and improvements for Skybolt.

## Version 2.0 (Current) ✅

**Status:** Production Ready | **Released:** January 2025

### Completed Features

- ✅ PHP 8.3 rewrite with modern features (readonly properties, typed everything)
- ✅ Vite integration for build-time bundling
- ✅ Manifest-based asset discovery
- ✅ CDN support with configurable URLs
- ✅ Dev server detection for HMR
- ✅ ES Module client-side JavaScript
- ✅ Self-contained examples
- ✅ Comprehensive documentation

### Performance Improvements

- Build speed: Runtime minification → <1s with Vite (significantly faster)
- Minification: Custom PHP → esbuild/Lightning CSS (modern tooling)
- Modern stack: PHP 8.3, ES Modules, Vite integration

## Version 3.0 (Next) 🎯

**Target:** Q4 2025 | **Focus:** Reusable Package for Distribution

### Planned Features

- [X] **Developer Experience** - Better encapsulation and interfaces for easy integration and deployment alongside existing applications
- [X] **Simplified HTML syntax** - maybe `sb-asset="counter:rGu4co" sb-state='store'` and `sb-asset="header:PgpDxo" sb-state='store'` (since we use script tags for scripts and link tags for stylesheets etc.)
- [X] **Sessionless Caching** - Support for caching without session inventory since most 'modern' web devs are afraid of sessions, and we won't convince anyone to configure DB-backed sessions just for Skybolt. The session inventory was really just a half-baked attempt at working around the 4KB cookie limit (and not be so wasteful with cookie headers), but I was still using the cookie... to get around the cookie limit I could just use multiple cookies if needed. Could also use a better data packing method than JSON.
- [X] **Composer Package** - Publish to Packagist for easy installation
- [X] **Service Workers and Cache API** - Attempt to use WorkBox or similar as the caching engine instead of localStorage for better DX and performance
- [ ] **Async CSS** - Make it possible to actually load non-critical CSS in a non-blocking way while still using Service Worker caching; preload plus JS to apply styles once fetched?

## Version 3.1 (Planned) 📦

**Target:** Q1 2026 | **Focus:** Multi-Language/Framework Integrations

### Framework Packages

- [ ] **Nette Package** - Template engine integration with Latte and Nette Assets

- [ ] **Laravel Package** - First-class Laravel integration
  - Blade directives
  - Artisan commands
  - Config publishing
  - Asset pipeline integration

### Multi-Language Support

- [ ] **Bun/Node.js** - JavaScript/TypeScript implementation
  - NPM package (`@skybolt/core`)
  - Express middleware
  - Vite plugin?

- [ ] **Python** - Python implementation
  - PyPI package (`skybolt`)
  - FastAPI integration

- [ ] **Go** - Go implementation
  - Go module
  - Middleware for Gin
  - Template helpers

## Version 4.0 (Future Vision) 🚀

**Target:** 2026 | **Focus:** Advanced Features

- [ ] **WebP/AVIF Support** - Automatic image format optimization
- [ ] **Idle Preloading** - Idle Detection API-triggered asset preloading of lazy assets
- [ ] **Service Worker Strategy** - Migrate from localStorage to Cache API for better performance and reliability
- [ ] **Streaming** - Stream-based asset delivery
- [ ] **HTTP/3 Support** - QUIC protocol optimization

## Community & Ecosystem 🌍

### Documentation & Learning

- [ ] **Interactive Documentation** - Live code examples and playground
- [ ] **Video Tutorials** - Getting started and advanced topics
- [ ] **Migration Guides** - Framework-specific migration guides
- [ ] **Case Studies** - Real-world performance improvements

---

**Last Updated:** November 23, 2025

**Note:** This roadmap is subject to change based on community feedback, technical constraints, and strategic priorities.
