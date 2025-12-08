# Skybolt Roadmap

This document outlines the planned features and improvements for Skybolt.

## Version 3.x (Current) ✅

**Status:** Beta | **Released:** December 2025

### Completed Features

- ✅ Multi-language support (JavaScript, Go, PHP, Python, Ruby)
- ✅ Framework integrations (Django, Express, Flask, Gin, Laravel, Ruby on Rails)
- ✅ Vite integration for build-time bundling
- ✅ Cache Digest asset discovery with Cuckoo filter
- ✅ CDN support with configurable URLs
- ✅ Service Worker caching with Cache API
- ✅ Cookie-based version tracking
- ✅ Async, non-blocking CSS loading
- ✅ Chain Lightning: component loader with parallel dependency preloading

### Planned Tasks

- [ ] **Chain Lightning 'ready' events** - In CL we dispatch 'chain-lightning:ready' event when the manifest is injected by the serer -- and CL then listens for this. But that's confusing: The event should be called 'chain-lightning:manifestReady' or similar, because 'ready' implies the whole CL is ready, which is not the case yet. CL in turn should dispatch a 'chain-lightning:ready' event when it's fully ready.

- [ ] **Chain Lightning single head script injection** -- we inject both `$sb->launchScript()` and `$cl->headScripts()` separately, but if you passed Skybolt to CL when constructing it, CL should just insert the Skybolt launch script automatically in the headScripts() call

## Future Vision 🚀

**Target:** 2026 | **Focus:** Anything a little further out

- [ ] **Experiment: A fully server side Chain Lightning** - A single PHP/Go/Ruby/Python script that serves static script assets and includes prebaked headers from a sidecar file, so /assets/main-abc678.js would have a sidecar /assets/main-abc678.js.headers with the necessary `103 Early Hints` headers to preload dependencies. This would not be compatible with Skybolt inlining, but it would

- [ ] **Stale version purging** - We can detect when a component version from the cache no longer exists in the import map, meaning it is no longer used by any page. We can use this to purge stale versions from the cache automatically.

- [ ] **'Primer' Interaction-Triggered Loading** - Optional on-demand component loading triggered by user interactions (click, click intent, hover, focus, scrollIntoView). A tiny (~1KB) Primer script would listen for events on annotated elements and load components just-in-time using Chain Lightning's dependency graph. Inspired by Facebook's 2012 Primer/Bootloader pattern (see [Makinde's JsConf talk](https://www.youtube.com/watch?v=wHlyLEPtL9o) and [Primer gist](https://gist.github.com/makinde/376039)), this enables instant interactivity with near-zero initial JS, conceptually similar to Qwik's resumability but without requiring a custom framework or compiler. Components remain standard ES modules.

- [ ] **HTML Fragment Caching** - Support caching of HTML fragments (e.g., partials, components) alongside CSS/JS assets. The challenge is we've designed Skybolt around a build-time asset definition model, so you'd need to define your assets upfront - in the Vite config. And even if we limit it to known reusable components, different stacks have very different methods for rendering those, so it would make it tricky to implement in a generic way.

- [ ] **Laravel Integration** - Framework integration with Laravel (Blade directives), include in skybolt-php package
- [ ] **Express.js Integration** - Framework integration with Express.js, include in skybolt-server-adapter package
- [ ] **Gin Integration** - Framework integration with Gin, include in skybolt-go package
- [ ] **Rails Integration** - Framework integration with Rails, include in skybolt-ruby package
- [ ] **Django Integration** - Framework integration with Django (middleware, template tags?), include in skybolt-python package
- [ ] **Nette Integration** - Framework integration with Nette (Latte and Nette Assets), include in skybolt-php package

---

**Last Updated:** November 28, 2025
