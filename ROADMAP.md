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

## Version 2.1 (Next) 🎯

**Target:** Q4 2025 | **Focus:** Reusable Package for Distribution

### Planned Features

- [ ] **Developer Experience** - Better encapsulation and interfaces for easy integration and deployment alongside existing applications
- [ ] **Simplified HTML meta syntax** - maybe `sb-load-script="boot:Fhwa4p"` and `sb-load-style="default:FFJg-n"` and `sb-load-fragment="header:PgpDxo"`
- [ ] **Sessionless Caching** - Support for caching without session inventory
- [ ] **Composer Package** - Publish to Packagist for easy installation

## Version 2.2 (Planned) 📦

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

## Version 3.0 (Future Vision) 🚀

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
